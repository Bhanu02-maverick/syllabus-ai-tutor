"""
main.py
--------
The full backend API. Run with:
    uvicorn main:app --reload --port 8000

Endpoint map:
    POST /auth/signup             -> create account (hashed password), returns JWT
    POST /auth/login              -> verify password, returns JWT
    GET  /faculty/list            -> public list of all faculty (for student signup)
    GET  /units                   -> syllabus units scoped to the user's faculty
    POST /faculty/units           -> faculty creates a new unit (number auto-assigned if omitted)
    POST /ask                     -> RAG Q&A (Exam Mode / Analogy Mode)            [auth required]
    POST /quiz                    -> generate a 2-question micro-quiz             [auth required]
    POST /quiz/submit             -> grade + store quiz results (drives progress) [auth required]
    GET  /progress/me             -> the logged-in student's real progress        [auth required]
    POST /faculty/upload          -> drag-and-drop PDF ingestion; can auto-create a
                                      unit and auto-suggest its name from the PDF  [faculty only]
    GET  /faculty/documents       -> list of uploaded/indexed documents           [faculty only]
    GET  /faculty/analytics       -> class-wide completion & weak-topic data      [faculty only]
    POST /faculty/question-bank   -> 1-click formal exam question generator      [faculty only]

ALL data (units, documents, vector stores) is scoped per-faculty so different
subjects never mix. Students are enrolled under a specific faculty at signup.
"""

import os
import json
import shutil
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader

from database import Base, engine, get_db
import models
import schemas
from ingestion import ingest_pdf, get_faculty_db_dir
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Syllabus-Bound RAG Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

import time as _time

from langchain_openai import ChatOpenAI

FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash"]
OPENROUTER_FREE_MODELS = [
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "z-ai/glm-5.2:free",
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-3.5-lightning:free",
]


def get_api_keys() -> List[str]:
    raw_keys = os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", ""))
    keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
    return keys if keys else [""]


def safe_llm_invoke(messages):
    """Ultra-fast LLM invocation: tries primary Gemini model first.
    If rate-limited or error occurs, IMMEDIATELY switches to OpenRouter free LLM (openrouter/free) with zero delay."""
    last_err = None
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()

    # 1. Fast attempt: Primary Google Gemini model (gemini-3.6-flash)
    api_keys = get_api_keys()
    for key in api_keys:
        try:
            kwargs = {"model": "gemini-3.6-flash", "temperature": 0.2}
            if key:
                kwargs["google_api_key"] = key
            current_llm = ChatGoogleGenerativeAI(**kwargs)
            return current_llm.invoke(messages)
        except Exception as e:
            last_err = e
            err_str = str(e).lower()
            if any(kw in err_str for kw in ["resource_exhausted", "quota", "rate", "429", "503", "timeout"]):
                print("⚡ Gemini-3.6-flash rate-limited. Immediately switching to OpenRouter free LLM...")
            else:
                print(f"Gemini-3.6-flash error: {e}")
            break

    # 2. Immediate Direct Switch: OpenRouter Free Models (no delays)
    if openrouter_key:
        for or_model in ["openrouter/free", "google/gemma-4-31b-it:free", "z-ai/glm-5.2:free"]:
            try:
                current_llm = ChatOpenAI(
                    api_key=openrouter_key,
                    base_url="https://openrouter.ai/api/v1",
                    model=or_model,
                    temperature=0.2,
                )
                print(f"🚀 Directly invoking OpenRouter model: {or_model}...")
                return current_llm.invoke(messages)
            except Exception as e:
                last_err = e
                print(f"OpenRouter model {or_model} error: {e}")
                continue

    # 3. Fallback: Secondary Gemini model (gemini-2.5-flash)
    for key in api_keys:
        try:
            kwargs = {"model": "gemini-2.5-flash", "temperature": 0.2}
            if key:
                kwargs["google_api_key"] = key
            current_llm = ChatGoogleGenerativeAI(**kwargs)
            return current_llm.invoke(messages)
        except Exception as e:
            last_err = e

    if last_err is not None:
        raise last_err
    raise RuntimeError("safe_llm_invoke: all models exhausted")





def extract_text(response) -> str:
    """Extract plain text from an LLM response.
    Newer Gemini models (3.6+) return content as a list of parts
    instead of a plain string. This normalises both formats."""
    content = response.content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)
    return str(content)


# Clean any legacy markdown stars from unit names in DB
try:
    with Session(engine) as db_session:
        existing_units = db_session.query(models.Unit).all()
        changed = False
        for u in existing_units:
            if "**" in u.unit_name or "*" in u.unit_name:
                u.unit_name = u.unit_name.replace("**", "").replace("*", "").strip()
                changed = True
        if changed:
            db_session.commit()
except Exception:
    pass

# Seed default admin account if not present
try:
    with Session(engine) as db_session:
        admin_user = db_session.query(models.User).filter(models.User.role == "admin").first()
        if not admin_user:
            default_admin = models.User(
                name="admin",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db_session.add(default_admin)
            db_session.commit()
            print("Seeded default admin account (name: admin, password: admin123)")
except Exception as e:
    print("Admin seeding error:", e)

DOCS_DIR = "./docs"
os.makedirs(DOCS_DIR, exist_ok=True)



def _resolve_faculty_id(user: models.User, requested_faculty_id: Optional[int] = None) -> int:
    """Return the faculty_id for scoping queries.
    Faculty users -> their own id.
    Student users -> requested_faculty_id from query/body, fallback to user.faculty_id if set."""
    if user.role == "faculty":
        return user.id
    if requested_faculty_id is not None:
        return requested_faculty_id
    if user.faculty_id is not None:
        return user.faculty_id
    raise HTTPException(status_code=400, detail="Please select a faculty/subject to query.")


def get_vector_store(faculty_id: int):
    db_dir = get_faculty_db_dir(faculty_id)
    if not os.path.exists(db_dir) or not os.listdir(db_dir):
        raise HTTPException(
            status_code=400,
            detail="No documents indexed yet for this subject. Faculty must upload a PDF first.",
        )
    return Chroma(persist_directory=db_dir, embedding_function=embeddings)


def majority_unit(docs) -> Optional[int]:
    units = [d.metadata.get("unit") for d in docs if d.metadata.get("unit") is not None]
    if not units:
        return None
    return Counter(units).most_common(1)[0][0]


import re


def suggest_unit_name(file_path: str) -> str:
    """Asks Gemini to propose a short syllabus unit title from the PDF's opening text, with smart regex filename fallback."""
    try:
        pages = PyPDFLoader(file_path).load()
        full_text = ""
        for p in pages[:4]:
            if p.page_content and p.page_content.strip():
                full_text += p.page_content + "\n"

        if full_text.strip():
            prompt = (
                "Suggest a short, formal syllabus unit title (max 6 words, no numbering, no quotes) "
                "for a textbook chapter that begins with the following text:\n\n"
                f"{full_text[:3000]}"
            )
            response = safe_llm_invoke([{"role": "user", "content": prompt}])
            suggested = extract_text(response).strip().strip('"').strip("'")
            if suggested and "untitled" not in suggested.lower():
                return suggested
    except Exception as e:
        print("Auto unit name AI extraction exception:", e)

    # Fallback to cleaned filename
    filename = os.path.basename(file_path)
    clean_name = os.path.splitext(filename)[0]
    clean_name = re.sub(r'^[0-9_\-\s]*(unit[\s_\-]*[0-9]+[\s_\-]*)?', '', clean_name, flags=re.IGNORECASE)
    clean_name = clean_name.replace("_", " ").replace("-", " ").strip()
    return clean_name.title() if clean_name else "Syllabus Unit"


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

@app.post("/auth/signup", response_model=schemas.AuthResponse)
def signup(req: schemas.SignupRequest, db: Session = Depends(get_db)):
    if req.role not in ("student", "faculty"):
        raise HTTPException(status_code=400, detail="role must be 'student' or 'faculty'")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")

    existing = db.query(models.User).filter(models.User.name == req.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="That username is already taken.")

    # Faculty must provide a subject name
    subject_name = None
    faculty_id = None

    if req.role == "faculty":
        if not req.subject_name or not req.subject_name.strip():
            raise HTTPException(status_code=400, detail="Faculty must provide a subject_name (e.g. 'Operating Systems').")
        subject_name = req.subject_name.strip()

    if req.role == "student" and req.faculty_id:
        # Optionally verify the faculty exists if passed
        faculty = db.query(models.User).filter(
            models.User.id == req.faculty_id, models.User.role == "faculty"
        ).first()
        if faculty:
            faculty_id = req.faculty_id

    user = models.User(
        name=req.name,
        hashed_password=hash_password(req.password),
        role=req.role,
        subject_name=subject_name,
        faculty_id=faculty_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return schemas.AuthResponse(
        token=token,
        id=user.id,
        name=user.name,
        role=user.role,
        subject_name=user.subject_name,
        faculty_id=user.faculty_id if user.role == "student" else user.id,
    )


@app.post("/auth/login", response_model=schemas.AuthResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.name == req.name).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    token = create_access_token(user)
    return schemas.AuthResponse(
        token=token,
        id=user.id,
        name=user.name,
        role=user.role,
        subject_name=user.subject_name,
        faculty_id=user.faculty_id if user.role == "student" else user.id,
    )


# ---------------------------------------------------------------------------
# PUBLIC: list faculty accounts (for student signup dropdown)
# ---------------------------------------------------------------------------

@app.get("/faculty/list", response_model=List[schemas.FacultyListItem])
def list_faculty(db: Session = Depends(get_db)):
    faculty_users = db.query(models.User).filter(models.User.role == "faculty").all()
    return [
        schemas.FacultyListItem(
            id=f.id,
            name=f.name,
            subject_name=f.subject_name or "Unknown Subject",
        )
        for f in faculty_users
    ]


# ---------------------------------------------------------------------------
# UNITS (dynamic — created by faculty, scoped per-faculty)
# ---------------------------------------------------------------------------

@app.get("/units", response_model=List[schemas.UnitOut])
def list_units(
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    units = db.query(models.Unit).filter(
        models.Unit.faculty_id == fid
    ).order_by(models.Unit.unit_number).all()
    return [
        schemas.UnitOut(unit_number=u.unit_number, unit_name=u.unit_name)
        for u in units
    ]


@app.post("/faculty/units")
def create_unit(
    req: schemas.UnitCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    fid = user.id

    unit_number = req.unit_number
    if unit_number is None:
        max_existing = db.query(sqlfunc.max(models.Unit.unit_number)).filter(
            models.Unit.faculty_id == fid
        ).scalar()
        unit_number = (max_existing or 0) + 1

    if db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid,
    ).first():
        raise HTTPException(status_code=409, detail=f"Unit {unit_number} already exists in your syllabus.")

    unit_name = req.unit_name or f"Unit {unit_number}"
    unit = models.Unit(unit_number=unit_number, unit_name=unit_name, faculty_id=fid)
    db.add(unit)
    db.commit()
    db.refresh(unit)

    return {"unit_number": unit.unit_number, "unit_name": unit.unit_name}


@app.delete("/faculty/units/{unit_number}")
def delete_unit(
    unit_number: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    fid = user.id
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {unit_number} not found in your syllabus.")

    # Delete associated documents from DB
    db.query(models.Document).filter(
        models.Document.unit_number == unit_number,
        models.Document.faculty_id == fid,
    ).delete()

    # Delete associated quiz attempts
    db.query(models.QuizAttempt).filter(
        models.QuizAttempt.unit_number == unit_number,
        models.QuizAttempt.faculty_id == fid,
    ).delete()

    # Try to remove chunks from ChromaDB
    try:
        db_dir = get_faculty_db_dir(fid)
        if os.path.exists(db_dir) and os.listdir(db_dir):
            store = Chroma(persist_directory=db_dir, embedding_function=embeddings)
            # Get all doc IDs that belong to this unit
            results = store.get(where={"unit": unit_number})
            if results and results["ids"]:
                store.delete(ids=results["ids"])
    except Exception:
        pass  # ChromaDB cleanup is best-effort

    db.delete(unit)
    db.commit()
    return {"deleted": True, "unit_number": unit_number}


@app.get("/units/{unit_number}/subtopics", response_model=schemas.SubtopicsResponse)
def get_unit_subtopics(
    unit_number: int,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {unit_number} not found.")

    unit_name = unit.unit_name
    subtopics = []

    try:
        store = get_vector_store(fid)
        chunks_text = []

        # 1. Direct metadata query for unit chunks
        res = store.get(where={"unit": unit_number}, limit=10)
        if res and res.get("documents"):
            chunks_text = res["documents"][:8]

        # 2. Similarity search fallback
        if not chunks_text:
            docs = store.similarity_search(unit_name, k=8, filter={"unit": unit_number})
            chunks_text = [d.page_content for d in docs]

        if chunks_text:
            context = "\n".join([t[:500] for t in chunks_text[:6]])
            prompt = (
                "From the following textbook content, extract a flat list of 5-10 key subtopics or concepts covered. "
                "Return ONLY a JSON array of short strings (max 6 words each). No numbering, no explanations.\n\n"
                f"Unit: {unit_name}\nContent:\n{context}"
            )
            response = safe_llm_invoke([
                {"role": "system", "content": "You extract subtopic lists. Respond only with a JSON array of strings."},
                {"role": "user", "content": prompt},
            ])
            clean = extract_text(response).strip().replace("```json", "").replace("```", "")
            subtopics = json.loads(clean)
    except Exception as e:
        print("Subtopics extraction error:", e)
        subtopics = []

    return schemas.SubtopicsResponse(
        unit_number=unit_number,
        unit_name=unit_name,
        subtopics=subtopics if isinstance(subtopics, list) else [],
    )




@app.get("/progress/me", response_model=List[schemas.UnitProgress])
def get_my_progress(
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)

    indexed_numbers = {
        d.unit_number for d in db.query(models.Document).filter(
            models.Document.status == "indexed",
            models.Document.faculty_id == fid,
        ).all()
    }
    units = db.query(models.Unit).filter(
        models.Unit.faculty_id == fid
    ).order_by(models.Unit.unit_number).all()

    results = []
    for u in units:
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.unit_number == u.unit_number,
            models.QuizAttempt.user_id == user.id,
            models.QuizAttempt.faculty_id == fid,
        ).all()
        total = len(attempts)
        correct = sum(1 for a in attempts if a.is_correct)
        mastery = round((correct / total) * 100, 1) if total > 0 else 0.0

        # Try to get cached subtopics (lightweight — don't call AI here)
        results.append(schemas.UnitProgress(
            unit_number=u.unit_number,
            unit_name=u.unit_name,
            indexed=u.unit_number in indexed_numbers,
            attempts=total,
            mastery_percent=mastery,
            subtopics=[],
        ))
    return results


# ---------------------------------------------------------------------------
# STUDENT: RAG Q&A (scoped to enrolled faculty's vector store)
# ---------------------------------------------------------------------------

@app.post("/ask", response_model=schemas.AskResponse)
def ask_question(req: schemas.AskRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)
    
    search_kwargs = {"k": 4}
    if req.unit_number is not None:
        search_kwargs["filter"] = {"unit": int(req.unit_number)}

    retriever = store.as_retriever(search_kwargs=search_kwargs)
    
    # Prepend subtopic to vector query for high-precision semantic matching
    semantic_query = req.query
    if req.subtopic and req.subtopic.strip():
        semantic_query = f"Topic: {req.subtopic.strip()} - Question: {req.query}"
        
    docs = retriever.invoke(semantic_query)


    if not docs:
        return schemas.AskResponse(
            answer="This topic is outside the uploaded syllabus boundaries.",
            citations=[],
            unit_number=None,
        )

    context = "\n\n".join([d.page_content for d in docs])
    citations = [
        schemas.Citation(
            source=d.metadata.get("source_file", "Textbook"),
            page=d.metadata.get("page", 0) + 1,
            unit=d.metadata.get("unit", 1),
        )
        for d in docs
    ]

    if req.mode == "analogy":
        system_instruction = (
            "You are a helpful virtual tutor. Explain the following student query using intuitive, "
            "everyday analogies while remaining strictly faithful to the provided textbook context.\n\n"
            f"Context:\n{context}"
        )
    else:
        system_instruction = (
            "You are a strict university examination evaluator. Provide a technically precise, concise, "
            "and syllabus-compliant answer based EXCLUSIVELY on the context below. Do not guess or extrapolate.\n\n"
            f"Context:\n{context}"
        )

    response = safe_llm_invoke([
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": req.query},
    ])

    answer_text = extract_text(response)
    resolved_unit = majority_unit(docs)

    # Feature 6: Save to DoubtHistory
    try:
        doubt = models.DoubtHistory(
            user_id=user.id,
            faculty_id=fid,
            unit_number=resolved_unit,
            query=req.query,
            mode=req.mode,
            answer=answer_text,
            citations_json=json.dumps([c.dict() for c in citations[:2]]),
        )
        db.add(doubt)
        db.commit()
    except Exception as e:
        print(f"Doubt history save error: {e}")

    return schemas.AskResponse(
        answer=answer_text,
        citations=citations[:2],
        unit_number=resolved_unit,
    )


@app.post("/quiz", response_model=schemas.QuizResponse)
def generate_micro_quiz(
    req: schemas.QuizRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)
    num_q = min(max(req.num_questions, 1), 50)  # clamp 1-50

    # Determine search query: use topic text or look up unit name
    search_query = req.topic
    unit_number = req.unit_number
    if not search_query and unit_number:
        unit = db.query(models.Unit).filter(
            models.Unit.unit_number == unit_number,
            models.Unit.faculty_id == fid,
        ).first()
        search_query = unit.unit_name if unit else f"Unit {unit_number}"

    if not search_query:
        raise HTTPException(status_code=400, detail="Provide a topic or unit_number.")

    # Retrieve more chunks for larger quizzes
    k = min(5 + (num_q // 2), 25)
    if unit_number:
        docs = store.similarity_search(search_query, k=k, filter={"unit": unit_number})
    else:
        retriever = store.as_retriever(search_kwargs={"k": k})
        docs = retriever.invoke(search_query)

    context = "\n".join([d.page_content for d in docs])
    resolved_unit = unit_number or majority_unit(docs)

    quiz_prompt = (
        f"Generate exactly {num_q} syllabus-aligned multiple choice questions strictly based on the context below. "
        "Return ONLY a JSON array with objects containing 'question', 'options' (array of 4 strings), "
        "and 'answer' (exact string matching the correct option).\n\n"
        f"Context:\n{context}"
    )

    response = safe_llm_invoke([
        {"role": "system", "content": "You are a quiz generation engine. Respond only with raw JSON."},
        {"role": "user", "content": quiz_prompt},
    ])

    try:
        clean_content = extract_text(response).strip().replace("```json", "").replace("```", "")
        quiz_data = json.loads(clean_content)
    except Exception:
        quiz_data = []

    return schemas.QuizResponse(unit_number=resolved_unit, quizzes=quiz_data)


@app.post("/quiz/submit")
def submit_quiz(
    req: schemas.QuizSubmitRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    saved = 0
    for item in req.items:
        is_correct = item.selected_answer.strip() == item.correct_answer.strip()
        attempt = models.QuizAttempt(
            user_id=user.id,
            unit_number=req.unit_number,
            faculty_id=fid,
            topic_query=item.topic_query,
            question=item.question,
            selected_answer=item.selected_answer,
            correct_answer=item.correct_answer,
            is_correct=is_correct,
        )
        db.add(attempt)
        saved += 1
    db.commit()
    return {"saved": saved}


# ---------------------------------------------------------------------------
# FACULTY: document ingestion, analytics, question bank generation
# (all scoped to the logged-in faculty)
# ---------------------------------------------------------------------------

@app.post("/faculty/upload")
def upload_document(
    file: UploadFile = File(...),
    unit_number: Optional[int] = Form(default=None),
    unit_name: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    fid = user.id
    dest_path = os.path.join(DOCS_DIR, file.filename)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Auto-suggest a unit name from the PDF if faculty left it blank
    resolved_name = unit_name
    if not resolved_name:
        resolved_name = suggest_unit_name(dest_path)

    # Auto-assign the next unit number if faculty left it blank
    resolved_number = unit_number
    if resolved_number is None:
        max_existing = db.query(sqlfunc.max(models.Unit.unit_number)).filter(
            models.Unit.faculty_id == fid
        ).scalar()
        resolved_number = (max_existing or 0) + 1

    # Create the Unit row if this number doesn't exist yet for THIS faculty
    existing_unit = db.query(models.Unit).filter(
        models.Unit.unit_number == resolved_number,
        models.Unit.faculty_id == fid,
    ).first()
    if not existing_unit:
        db.add(models.Unit(unit_number=resolved_number, unit_name=resolved_name, faculty_id=fid))
        db.commit()
    elif unit_name:
        existing_unit.unit_name = unit_name
        db.commit()
        resolved_name = unit_name
    else:
        resolved_name = existing_unit.unit_name

    doc = models.Document(
        filename=file.filename,
        unit_number=resolved_number,
        unit_name=resolved_name,
        faculty_id=fid,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        chunk_count = ingest_pdf(dest_path, unit_number=resolved_number, unit_name=resolved_name, faculty_id=fid)
        doc.status = "indexed" if chunk_count > 0 else "failed"
        doc.chunk_count = chunk_count
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "unit_number": doc.unit_number,
        "unit_name": doc.unit_name,
        "status": doc.status,
        "chunk_count": doc.chunk_count,
    }


@app.get("/faculty/documents")
def list_documents(db: Session = Depends(get_db), user: models.User = Depends(require_role("faculty"))):
    docs = db.query(models.Document).filter(
        models.Document.faculty_id == user.id
    ).order_by(models.Document.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "unit_number": d.unit_number,
            "unit_name": d.unit_name,
            "status": d.status,
            "chunk_count": d.chunk_count,
        }
        for d in docs
    ]


@app.get("/faculty/analytics", response_model=List[schemas.FacultyAnalyticsUnit])
def faculty_analytics(db: Session = Depends(get_db), user: models.User = Depends(require_role("faculty"))):
    units = db.query(models.Unit).filter(
        models.Unit.faculty_id == user.id
    ).order_by(models.Unit.unit_number).all()
    results = []
    for u in units:
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.unit_number == u.unit_number,
            models.QuizAttempt.faculty_id == user.id,
        ).all()
        students = {a.user_id for a in attempts}
        total = len(attempts)
        correct = sum(1 for a in attempts if a.is_correct)
        avg_score = round((correct / total) * 100, 1) if total > 0 else 0.0

        results.append(schemas.FacultyAnalyticsUnit(
            unit_number=u.unit_number,
            unit_name=u.unit_name,
            students_attempted=len(students),
            average_score_percent=avg_score,
        ))
    return results


@app.post("/faculty/question-bank")
def generate_question_bank(
    req: schemas.FacultyQuestionBankRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    fid = user.id
    store = get_vector_store(fid)
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == req.unit_number,
        models.Unit.faculty_id == fid,
    ).first()
    unit_name = unit.unit_name if unit else f"Unit {req.unit_number}"

    clean_unit_name = unit.unit_name.replace("**", "").replace("*", "").strip() if unit else f"Unit {req.unit_number}"

    # Try direct metadata query first, then similarity search
    chunks_text = []
    res = store.get(where={"unit": req.unit_number}, limit=15)
    if res and res.get("documents"):
        chunks_text = res["documents"][:8]

    if not chunks_text:
        docs = store.similarity_search(clean_unit_name, k=6, filter={"unit": req.unit_number})
        chunks_text = [d.page_content for d in docs]

    if not chunks_text:
        doc_exists = db.query(models.Document).filter(
            models.Document.unit_number == req.unit_number,
            models.Document.faculty_id == fid,
        ).first()
        if not doc_exists:
            raise HTTPException(status_code=400, detail=f"No indexed content found for Unit {req.unit_number}. Please upload a PDF for this unit first.")
        context = f"Unit {req.unit_number} — {clean_unit_name}"
    else:
        context = "\n\n".join(chunks_text[:8])

    if req.question_type == "short_answer":
        format_instruction = "Return ONLY a JSON array of objects with 'question' and 'model_answer' fields."
    else:
        format_instruction = "Return ONLY a JSON array of objects with 'question', 'options' (array of 4 strings), and 'answer' (exact string matching the correct option)."

    prompt = (
        f"Generate {req.num_questions} {req.difficulty}-difficulty exam questions strictly based on "
        f"the textbook context below, for {clean_unit_name}. {format_instruction}\n\n"
        f"Context:\n{context}"
    )

    try:
        response = safe_llm_invoke([
            {"role": "system", "content": "You are a formal exam question generation engine. Respond only with raw JSON."},
            {"role": "user", "content": prompt},
        ])
        clean_content = extract_text(response).strip().replace("```json", "").replace("```", "")
        questions = json.loads(clean_content)
    except Exception as e:
        print("Question bank generation exception:", e)
        # Fallback question bank
        if req.question_type == "short_answer":
            questions = [
                {
                    "question": f"Explain the key principles of {clean_unit_name} as detailed in Unit {req.unit_number}.",
                    "model_answer": f"The key principles of {clean_unit_name} involve core concepts and standard specifications covered in Unit {req.unit_number}."
                } for _ in range(min(req.num_questions, 5))
            ]
        else:
            questions = [
                {
                    "question": f"Which of the following is a primary concept in {clean_unit_name}?",
                    "options": [
                        f"Standard specifications of {clean_unit_name}",
                        "External unverified module",
                        "Non-standard system model",
                        "Deprecated legacy format"
                    ],
                    "answer": f"Standard specifications of {clean_unit_name}"
                } for _ in range(min(req.num_questions, 5))
            ]

    return {"unit_number": req.unit_number, "unit_name": clean_unit_name, "questions": questions}


# ==========================================
# ==========================================
# FEATURE 1: AI WEAK-TOPIC DETECTION
# ==========================================

@app.get("/student/weak-topics", response_model=schemas.WeakTopicAnalysis)
def get_weak_topics(
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)

    # Get all quiz attempts for this student under this faculty
    attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == user.id,
        models.QuizAttempt.faculty_id == fid,
    ).all()

    if not attempts:
        return schemas.WeakTopicAnalysis(
            weak_topics=[],
            ai_recommendation="Take some quizzes first to get personalized weak-topic analysis!",
            overall_mastery=0.0,
        )

    total_all = len(attempts)
    correct_all = sum(1 for a in attempts if a.is_correct)
    overall_mastery = round((correct_all / total_all) * 100, 1) if total_all > 0 else 0.0

    # Group incorrect answers by unit
    units_map = {}
    for a in attempts:
        if a.unit_number not in units_map:
            units_map[a.unit_number] = {"total": 0, "incorrect": 0, "wrong_questions": []}
        units_map[a.unit_number]["total"] += 1
        if not a.is_correct:
            units_map[a.unit_number]["incorrect"] += 1
            units_map[a.unit_number]["wrong_questions"].append(a.question)

    # Get unit names
    units = db.query(models.Unit).filter(models.Unit.faculty_id == fid).all()
    unit_name_map = {u.unit_number: u.unit_name for u in units}

    # Build weak topics from units with errors
    weak_topics = []
    weak_units_summary = []
    for un, data in sorted(units_map.items()):
        if data["incorrect"] == 0:
            continue
        accuracy = round(((data["total"] - data["incorrect"]) / data["total"]) * 100, 1)
        if accuracy >= 80:
            continue  # Not weak enough

        unit_name = unit_name_map.get(un, f"Unit {un}")

        # Extract topic patterns from wrong questions using LLM
        wrong_sample = data["wrong_questions"][:8]
        topic_label = unit_name  # fallback
        try:
            prompt = (
                "From these exam questions a student got wrong, identify the ONE most common weak subtopic "
                "(max 5 words, no quotes, no numbering):\n\n"
                + "\n".join(f"- {q}" for q in wrong_sample)
            )
            resp = safe_llm_invoke([
                {"role": "system", "content": "Return only a short topic name, nothing else."},
                {"role": "user", "content": prompt},
            ])
            topic_label = extract_text(resp).strip().strip('"').strip("'")
            if not topic_label or len(topic_label) > 60:
                topic_label = unit_name
        except Exception:
            pass

        weak_topics.append(schemas.WeakTopicItem(
            unit_number=un,
            unit_name=unit_name,
            topic=topic_label,
            total_questions=data["total"],
            incorrect_count=data["incorrect"],
            accuracy_percent=accuracy,
        ))
        weak_units_summary.append(f"Unit {un} ({unit_name}): {topic_label} — {accuracy}% accuracy")

    # Generate AI recommendation
    ai_recommendation = "Great job! Keep practicing to maintain your mastery."
    if weak_topics:
        try:
            rec_prompt = (
                "A student has these weak areas in their course:\n"
                + "\n".join(weak_units_summary)
                + "\n\nGive a brief, encouraging 2-3 sentence study recommendation."
            )
            rec_resp = safe_llm_invoke([
                {"role": "system", "content": "You are a supportive study advisor. Be concise and actionable."},
                {"role": "user", "content": rec_prompt},
            ])
            ai_recommendation = extract_text(rec_resp).strip()
        except Exception:
            ai_recommendation = f"Focus on your weakest areas: {', '.join(t.topic for t in weak_topics[:3])}. Take targeted practice quizzes to improve."

    return schemas.WeakTopicAnalysis(
        weak_topics=weak_topics,
        ai_recommendation=ai_recommendation,
        overall_mastery=overall_mastery,
    )


# ==========================================
# FEATURE 3: ADAPTIVE STUDY PLAN
# ==========================================

@app.post("/student/study-plan", response_model=schemas.StudyPlanResponse)
def generate_study_plan(
    req: schemas.StudyPlanRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)

    # Parse exam date
    try:
        exam_dt = datetime.strptime(req.exam_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid exam_date format. Use YYYY-MM-DD.")

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    days_left = (exam_dt - today).days
    if days_left < 1:
        raise HTTPException(status_code=400, detail="Exam date must be in the future.")

    # Get unit mastery data
    units = db.query(models.Unit).filter(
        models.Unit.faculty_id == fid,
        models.Unit.unit_number.in_(req.unit_numbers),
    ).all()

    if not units:
        raise HTTPException(status_code=400, detail="No matching units found.")

    unit_mastery = {}
    for u in units:
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.user_id == user.id,
            models.QuizAttempt.unit_number == u.unit_number,
            models.QuizAttempt.faculty_id == fid,
        ).all()
        total = len(attempts)
        correct = sum(1 for a in attempts if a.is_correct)
        mastery = round((correct / total) * 100, 1) if total > 0 else 0.0
        unit_mastery[u.unit_number] = {"name": u.unit_name, "mastery": mastery}

    # Build plan: weak units get more days, strong units less
    plan_days = []
    # Sort units by mastery ascending (weakest first)
    sorted_units = sorted(unit_mastery.items(), key=lambda x: x[1]["mastery"])

    # Assign weights: lower mastery = more days
    total_weight = 0
    weights = {}
    for un, data in sorted_units:
        w = max(1, int((100 - data["mastery"]) / 20) + 1)
        weights[un] = w
        total_weight += w

    # Add revision + quiz days
    revision_days = max(1, days_left // 8)
    study_days = days_left - revision_days

    day_counter = 1
    current_date = today + timedelta(days=1)

    # Distribute study days
    for un, data in sorted_units:
        unit_days = max(1, round(study_days * weights[un] / total_weight))
        priority = "high" if data["mastery"] < 40 else "medium" if data["mastery"] < 70 else "low"
        for _ in range(unit_days):
            if day_counter > days_left:
                break
            activity = "Study" if day_counter % 3 != 0 else "Practice Quiz"
            plan_days.append(schemas.StudyPlanDay(
                day=day_counter,
                date=current_date.strftime("%Y-%m-%d"),
                focus_unit=un,
                unit_name=data["name"],
                activity=activity,
                priority=priority,
            ))
            day_counter += 1
            current_date += timedelta(days=1)

    # Add revision days
    for i in range(revision_days):
        if day_counter > days_left:
            break
        weakest = sorted_units[i % len(sorted_units)]
        plan_days.append(schemas.StudyPlanDay(
            day=day_counter,
            date=current_date.strftime("%Y-%m-%d"),
            focus_unit=weakest[0],
            unit_name=weakest[1]["name"],
            activity="Revision" if i < revision_days - 1 else "Final Review",
            priority="high",
        ))
        day_counter += 1
        current_date += timedelta(days=1)

    # Generate AI advice
    ai_advice = "Follow the plan consistently and take practice quizzes on weak areas."
    try:
        mastery_summary = ", ".join(
            f"{data['name']}: {data['mastery']}% mastery" for _, data in sorted_units
        )
        advice_prompt = (
            f"A student has {days_left} days until their exam. Their mastery levels: {mastery_summary}. "
            "Give a brief, actionable 2-sentence study tip."
        )
        advice_resp = safe_llm_invoke([
            {"role": "system", "content": "You are a study coach. Be brief and motivational."},
            {"role": "user", "content": advice_prompt},
        ])
        ai_advice = extract_text(advice_resp).strip()
    except Exception:
        pass

    # Save study plan to DB
    try:
        plan_record = models.StudyPlan(
            user_id=user.id,
            faculty_id=fid,
            exam_date=req.exam_date,
            units_json=json.dumps(req.unit_numbers),
            plan_json=json.dumps([d.dict() for d in plan_days]),
        )
        db.add(plan_record)
        db.commit()
    except Exception as e:
        print(f"Study plan save error: {e}")

    return schemas.StudyPlanResponse(
        exam_date=req.exam_date,
        total_days=days_left,
        plan=plan_days,
        ai_advice=ai_advice,
    )



@app.get("/student/study-plan")
def get_saved_study_plan(
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == user.id,
        models.StudyPlan.faculty_id == fid,
    ).order_by(models.StudyPlan.created_at.desc()).first()

    if not plan:
        return {"plan": None}

    return {
        "exam_date": plan.exam_date,
        "plan": json.loads(plan.plan_json),
        "units": json.loads(plan.units_json),
        "created_at": plan.created_at.strftime("%Y-%m-%d %H:%M") if plan.created_at else "N/A",
    }


# ==========================================
# FEATURE 5: AI UNIT SUMMARIES
# ==========================================

@app.get("/units/{unit_number}/summary", response_model=schemas.UnitSummaryResponse)
def get_unit_summary(
    unit_number: int,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {unit_number} not found.")

    # Check cache first
    cached = db.query(models.UnitSummaryCache).filter(
        models.UnitSummaryCache.faculty_id == fid,
        models.UnitSummaryCache.unit_number == unit_number,
    ).first()
    if cached:
        return schemas.UnitSummaryResponse(
            unit_number=unit_number,
            unit_name=unit.unit_name,
            summary=cached.summary_text,
            cached=True,
        )

    # Generate summary from vector store
    try:
        store = get_vector_store(fid)
        chunks_text = []
        res = store.get(where={"unit": unit_number}, limit=15)
        if res and res.get("documents"):
            chunks_text = res["documents"][:10]

        if not chunks_text:
            docs = store.similarity_search(unit.unit_name, k=10, filter={"unit": unit_number})
            chunks_text = [d.page_content for d in docs]

        if not chunks_text:
            raise HTTPException(status_code=400, detail="No indexed content for this unit.")

        context = "\n\n".join([t[:600] for t in chunks_text[:8]])
        prompt = (
            f"Create a comprehensive study summary of '{unit.unit_name}' based on the textbook content below. "
            "Include: key concepts, important definitions, and main takeaways. "
            "Use markdown formatting with headers and bullet points.\n\n"
            f"Content:\n{context}"
        )
        response = safe_llm_invoke([
            {"role": "system", "content": "You create clear, well-structured study summaries in markdown format."},
            {"role": "user", "content": prompt},
        ])
        summary_text = extract_text(response).strip()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {e}")

    # Cache the summary
    try:
        cache_entry = models.UnitSummaryCache(
            faculty_id=fid,
            unit_number=unit_number,
            summary_text=summary_text,
        )
        db.add(cache_entry)
        db.commit()
    except Exception as e:
        print(f"Summary cache error: {e}")

    return schemas.UnitSummaryResponse(
        unit_number=unit_number,
        unit_name=unit.unit_name,
        summary=summary_text,
        cached=False,
    )


# ==========================================
# FEATURE 6: DOUBT HISTORY
# ==========================================

@app.get("/student/doubt-history", response_model=schemas.DoubtHistoryResponse)
def get_doubt_history(
    faculty_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)

    query = db.query(models.DoubtHistory).filter(
        models.DoubtHistory.user_id == user.id,
        models.DoubtHistory.faculty_id == fid,
    )

    if search:
        query = query.filter(models.DoubtHistory.query.ilike(f"%{search}%"))

    total = query.count()
    doubts = query.order_by(models.DoubtHistory.created_at.desc()).limit(limit).all()

    items = [
        schemas.DoubtHistoryItem(
            id=d.id,
            query=d.query,
            mode=d.mode,
            answer=d.answer,
            unit_number=d.unit_number,
            created_at=d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else "N/A",
        )
        for d in doubts
    ]

    return schemas.DoubtHistoryResponse(items=items, total=total)


# ==========================================
# FEATURE 7: EXPLAIN-AGAIN
# ==========================================

@app.post("/ask/explain-again", response_model=schemas.AskResponse)
def explain_again(
    req: schemas.ExplainAgainRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)
    retriever = store.as_retriever(search_kwargs={"k": 3})
    docs = retriever.invoke(req.query)

    if not docs:
        return schemas.AskResponse(
            answer="Could not find relevant content in the syllabus for this topic.",
            citations=[],
            unit_number=None,
        )

    context = "\n\n".join([d.page_content for d in docs])
    citations = [
        schemas.Citation(
            source=d.metadata.get("source_file", "Textbook"),
            page=d.metadata.get("page", 0) + 1,
            unit=d.metadata.get("unit", 1),
        )
        for d in docs
    ]

    if req.style == "simpler":
        system_instruction = (
            "You are a patient tutor. Explain the following concept in the simplest possible way, "
            "as if teaching a complete beginner. Use everyday analogies and avoid jargon. "
            "Keep it concise but thorough.\n\n"
            f"Context:\n{context}"
        )
    else:
        system_instruction = (
            "You are an expert tutor. Provide a detailed, in-depth explanation with examples, "
            "edge cases, and technical depth. Include diagrams described in text if helpful.\n\n"
            f"Context:\n{context}"
        )

    response = safe_llm_invoke([
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": req.query},
    ])

    answer_text = extract_text(response)

    # Save to doubt history
    try:
        doubt = models.DoubtHistory(
            user_id=user.id,
            faculty_id=fid,
            unit_number=majority_unit(docs),
            query=f"[{req.style}] {req.query}",
            mode=req.style,
            answer=answer_text,
            citations_json=json.dumps([c.dict() for c in citations[:2]]),
        )
        db.add(doubt)
        db.commit()
    except Exception:
        pass

    return schemas.AskResponse(
        answer=answer_text,
        citations=citations[:2],
        unit_number=majority_unit(docs),
    )


# ==========================================
# FEATURE 4: FACULTY ENHANCED ANALYTICS
# ==========================================

@app.get("/faculty/analytics/enhanced", response_model=List[schemas.FacultyEnhancedAnalyticsUnit])
def faculty_enhanced_analytics(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    units = db.query(models.Unit).filter(
        models.Unit.faculty_id == user.id
    ).order_by(models.Unit.unit_number).all()

    results = []
    for u in units:
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.unit_number == u.unit_number,
            models.QuizAttempt.faculty_id == user.id,
        ).all()
        students = {a.user_id for a in attempts}
        total = len(attempts)
        correct = sum(1 for a in attempts if a.is_correct)
        avg_score = round((correct / total) * 100, 1) if total > 0 else 0.0

        # Identify difficult topics from incorrect answers
        wrong_questions = [a.question for a in attempts if not a.is_correct]
        difficult_topics = []

        if wrong_questions:
            # Group by question similarity — use LLM to extract topics
            try:
                sample = wrong_questions[:15]
                prompt = (
                    "From these exam questions students got wrong, identify the top 3-5 distinct topics "
                    "(each max 5 words). Return ONLY a JSON array of strings.\n\n"
                    + "\n".join(f"- {q}" for q in sample)
                )
                resp = safe_llm_invoke([
                    {"role": "system", "content": "Return only a JSON array of topic strings."},
                    {"role": "user", "content": prompt},
                ])
                clean = extract_text(resp).strip().replace("```json", "").replace("```", "")
                topic_names = json.loads(clean)

                # Estimate accuracy for each topic
                per_topic = len(wrong_questions) // max(len(topic_names), 1)
                for i, topic in enumerate(topic_names[:5]):
                    topic_total = max(per_topic, total // max(len(topic_names), 1))
                    topic_correct = max(0, topic_total - per_topic)
                    topic_accuracy = round((topic_correct / topic_total) * 100, 1) if topic_total > 0 else 0.0
                    difficult_topics.append(schemas.FacultyDifficultyTopic(
                        topic=topic,
                        total_attempts=topic_total,
                        correct_count=topic_correct,
                        accuracy_percent=topic_accuracy,
                    ))
            except Exception as e:
                print(f"Difficulty topic extraction error: {e}")

        results.append(schemas.FacultyEnhancedAnalyticsUnit(
            unit_number=u.unit_number,
            unit_name=u.unit_name,
            students_attempted=len(students),
            average_score_percent=avg_score,
            difficult_topics=difficult_topics,
        ))
    return results


# ==========================================
# FEATURE 8: PDF VERSION MANAGEMENT
# ==========================================

@app.get("/faculty/documents/versions/{unit_number}", response_model=List[schemas.DocumentVersionItem])
def get_document_versions(
    unit_number: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    docs = db.query(models.Document).filter(
        models.Document.unit_number == unit_number,
        models.Document.faculty_id == user.id,
    ).order_by(models.Document.version.desc()).all()

    return [
        schemas.DocumentVersionItem(
            id=d.id,
            filename=d.filename,
            version=d.version,
            is_active=d.is_active if d.is_active is not None else True,
            status=d.status,
            chunk_count=d.chunk_count or 0,
            uploaded_at=d.uploaded_at.strftime("%Y-%m-%d %H:%M") if d.uploaded_at else "N/A",
        )
        for d in docs
    ]


@app.post("/faculty/documents/{doc_id}/activate")
def activate_document_version(
    doc_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.faculty_id == user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Deactivate all other versions for same unit
    db.query(models.Document).filter(
        models.Document.unit_number == doc.unit_number,
        models.Document.faculty_id == user.id,
    ).update({"is_active": False})

    doc.is_active = True
    db.commit()
    return {"message": f"Version {doc.version} of '{doc.filename}' is now active."}


@app.delete("/faculty/documents/{doc_id}/version")
def delete_document_version(
    doc_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("faculty")),
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.faculty_id == user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the active version. Activate another version first.")

    db.delete(doc)
    db.commit()
    return {"message": f"Version {doc.version} deleted."}


# ==========================================
# ADMINISTRATOR ENDPOINTS
# ==========================================

@app.get("/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role("admin")),
):
    total_users = db.query(models.User).count()
    total_faculty = db.query(models.User).filter(models.User.role == "faculty").count()
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_documents = db.query(models.Document).count()
    total_quiz_attempts = db.query(models.QuizAttempt).count()

    return schemas.AdminStatsResponse(
        total_users=total_users,
        total_faculty=total_faculty,
        total_students=total_students,
        total_documents=total_documents,
        total_quiz_attempts=total_quiz_attempts,
    )


@app.get("/admin/users", response_model=List[schemas.AdminUserListItem])
def get_admin_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role("admin")),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    faculty_map = {u.id: u.name for u in users if u.role == "faculty"}

    result = []
    for u in users:
        quiz_count = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == u.id).count()
        doc_count = db.query(models.Document).filter(models.Document.faculty_id == u.id).count() if u.role == "faculty" else 0
        faculty_name = faculty_map.get(u.faculty_id) if u.role == "student" and u.faculty_id else None

        created_str = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "N/A"

        result.append(schemas.AdminUserListItem(
            id=u.id,
            name=u.name,
            role=u.role,
            subject_name=u.subject_name,
            faculty_name=faculty_name,
            created_at=created_str,
            quiz_attempts_count=quiz_count,
            documents_count=doc_count,
        ))

    return result


@app.post("/admin/users/create", response_model=schemas.AdminUserListItem)
def create_admin_user(
    req: schemas.AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role("admin")),
):
    existing = db.query(models.User).filter(models.User.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")

    if req.role not in ["student", "faculty", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    new_user = models.User(
        name=req.name.strip(),
        hashed_password=hash_password(req.password),
        role=req.role,
        subject_name=req.subject_name.strip() if req.subject_name and req.role == "faculty" else None,
        faculty_id=req.faculty_id if req.role == "student" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    faculty_map = {u.id: u.name for u in db.query(models.User).filter(models.User.role == "faculty").all()}
    created_str = new_user.created_at.strftime("%Y-%m-%d %H:%M") if new_user.created_at else "N/A"

    return schemas.AdminUserListItem(
        id=new_user.id,
        name=new_user.name,
        role=new_user.role,
        subject_name=new_user.subject_name,
        faculty_name=faculty_map.get(new_user.faculty_id) if new_user.faculty_id else None,
        created_at=created_str,
        quiz_attempts_count=0,
        documents_count=0,
    )


@app.post("/admin/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    req: schemas.AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role("admin")),
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not req.new_password or len(req.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    target_user.hashed_password = hash_password(req.new_password.strip())
    db.commit()
    return {"message": f"Password for user '{target_user.name}' reset successfully."}


@app.delete("/admin/users/{user_id}")
def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role("admin")),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    username = target_user.name

    db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == user_id).delete()
    if target_user.role == "faculty":
        db.query(models.QuizAttempt).filter(models.QuizAttempt.faculty_id == user_id).delete()
        db.query(models.Document).filter(models.Document.faculty_id == user_id).delete()
        db.query(models.Unit).filter(models.Unit.faculty_id == user_id).delete()

    db.delete(target_user)
    db.commit()
    return {"message": f"User '{username}' and associated data removed successfully."}


# ---------------------------------------------------------------------------
# PHASE 1: MIND MAPS & NODE ACTIONS (DB CACHED)
# ---------------------------------------------------------------------------

@app.get("/units/{unit_number}/mindmap", response_model=schemas.MindMapResponse)
def get_unit_mindmap(
    unit_number: int,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid
    ).first()
    unit_name = unit.unit_name if unit else f"Unit {unit_number}"

    # 1. Check DB Cache
    cached_entry = db.query(models.MindMapCache).filter(
        models.MindMapCache.faculty_id == fid,
        models.MindMapCache.unit_number == unit_number
    ).first()

    if cached_entry:
        try:
            tree_data = json.loads(cached_entry.mindmap_json)
            return schemas.MindMapResponse(
                unit_number=unit_number,
                unit_name=unit_name,
                tree=tree_data,
                cached=True
            )
        except Exception:
            pass

    # 2. Fetch unit vector store context
    store = get_vector_store(fid)
    docs = store.similarity_search(f"Unit {unit_number} topics key concepts overview", filter={"unit": unit_number}, k=6)
    if not docs:
        docs = store.similarity_search(f"Unit {unit_number} key concepts", k=4)

    context = "\n\n".join([d.page_content for d in docs]) if docs else "Overview of unit topics."

    prompt = (
        f"Analyze the syllabus context for Unit {unit_number}: '{unit_name}'.\n"
        "Generate a structured hierarchical JSON tree representing the core mind map for this unit.\n"
        "Return ONLY a valid JSON object matching this exact schema:\n"
        "{\n"
        '  "id": "root",\n'
        f'  "label": "{unit_name}",\n'
        '  "description": "Core unit mind map overview",\n'
        '  "children": [\n'
        '    {\n'
        '      "id": "topic_1",\n'
        '      "label": "Topic Name",\n'
        '      "description": "Brief 1-sentence definition",\n'
        '      "children": [\n'
        '        {"id": "sub_1", "label": "Sub-concept", "description": "Brief explanation", "children": []}\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        f"Syllabus Context:\n{context[:3000]}"
    )

    try:
        response = safe_llm_invoke([
            {"role": "system", "content": "You are a JSON mind map generator. Output raw valid JSON only."},
            {"role": "user", "content": prompt}
        ])
        raw_text = extract_text(response).strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()
        tree_data = json.loads(raw_text)
    except Exception:
        # Fallback tree structure if JSON parsing fails
        tree_data = {
            "id": "root",
            "label": unit_name,
            "description": f"Mind map overview for Unit {unit_number}",
            "children": [
                {"id": "c1", "label": "Core Concepts", "description": "Primary theoretical topics in this unit", "children": []},
                {"id": "c2", "label": "Key Algorithms & Methods", "description": "Essential procedures and implementations", "children": []},
                {"id": "c3", "label": "Applications & Use Cases", "description": "Practical domain examples", "children": []}
            ]
        }

    # Save to Cache
    new_cache = models.MindMapCache(
        faculty_id=fid,
        unit_number=unit_number,
        mindmap_json=json.dumps(tree_data)
    )
    db.add(new_cache)
    db.commit()

    return schemas.MindMapResponse(
        unit_number=unit_number,
        unit_name=unit_name,
        tree=tree_data,
        cached=False
    )


@app.post("/mindmap/node-action", response_model=schemas.NodeActionResponse)
def handle_mindmap_node_action(
    req: schemas.NodeActionRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)
    docs = store.similarity_search(f"Unit {req.unit_number} {req.node_label}", k=3)
    context = "\n\n".join([d.page_content for d in docs]) if docs else f"Concept: {req.node_label}"

    if req.action == "explain":
        prompt = f"Explain the concept '{req.node_label}' clearly in 3 concise bullet points for a student studying for an exam based on this context:\n{context[:2000]}"
    elif req.action == "example":
        prompt = f"Provide a clear real-world example explaining how '{req.node_label}' is used in practice based on this context:\n{context[:2000]}"
    elif req.action == "quiz":
        prompt = f"Generate 1 multiple choice practice question testing '{req.node_label}' with 4 options and the correct answer indicated clearly."
    else:
        prompt = f"Explain '{req.node_label}' concisely based on:\n{context[:2000]}"

    response = safe_llm_invoke([
        {"role": "system", "content": "You are a helpful virtual tutor explaining a specific mind map concept node."},
        {"role": "user", "content": prompt}
    ])
    content = extract_text(response).strip()

    return schemas.NodeActionResponse(
        action=req.action,
        node_label=req.node_label,
        content=content
    )


# ---------------------------------------------------------------------------
# PHASE 2: ADAPTIVE AI QUIZ
# ---------------------------------------------------------------------------

@app.post("/quiz/adaptive", response_model=schemas.AdaptiveQuizResponse)
def generate_adaptive_quiz_question(
    req: schemas.AdaptiveQuizRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)

    # Dynamic difficulty adjustment logic based on session history
    total_answered = req.correct_count + req.wrong_count
    current_diff = req.current_difficulty.lower()

    if total_answered > 0:
        accuracy = req.correct_count / total_answered
        if accuracy >= 0.75:
            current_diff = "hard"
        elif accuracy <= 0.4:
            current_diff = "easy"
        else:
            current_diff = "medium"

    query_str = f"Unit {req.unit_number} {req.subtopic or ''} key concepts"
    docs = store.similarity_search(query_str, filter={"unit": req.unit_number} if req.unit_number else None, k=3)
    if not docs:
        docs = store.similarity_search(query_str, k=3)
    context = "\n\n".join([d.page_content for d in docs]) if docs else "Syllabus topic content."

    prompt = (
        f"Generate exactly 1 multiple choice question at **{current_diff.upper()}** difficulty level for Unit {req.unit_number}"
        f"{f' on topic: {req.subtopic}' if req.subtopic else ''}.\n"
        "Return ONLY a JSON object with keys: 'question', 'options' (array of 4 strings), 'correct_answer' (must match one option exactly), 'explanation'.\n\n"
        f"Context:\n{context[:2500]}"
    )

    try:
        response = safe_llm_invoke([
            {"role": "system", "content": "You are an adaptive exam question generator. Return valid JSON only."},
            {"role": "user", "content": prompt}
        ])
        raw_text = extract_text(response).strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()
        data = json.loads(raw_text)
        return schemas.AdaptiveQuizResponse(
            question_number=req.question_number,
            difficulty=current_diff,
            question=data.get("question", f"Sample question on Unit {req.unit_number}"),
            options=data.get("options", ["Option A", "Option B", "Option C", "Option D"]),
            correct_answer=data.get("correct_answer", "Option A"),
            explanation=data.get("explanation", "Correct based on syllabus definitions.")
        )
    except Exception:
        return schemas.AdaptiveQuizResponse(
            question_number=req.question_number,
            difficulty=current_diff,
            question=f"Which of the following is a primary concept in Unit {req.unit_number}?",
            options=["Theoretical Foundation", "Practical Application", "Standard Algorithm", "System Evaluation"],
            correct_answer="Theoretical Foundation",
            explanation="Theoretical Foundation represents the baseline core of this syllabus unit."
        )


# ---------------------------------------------------------------------------
# PHASE 3: TIMED AI MOCK EXAM
# ---------------------------------------------------------------------------

@app.post("/quiz/mock-exam", response_model=schemas.MockExamResponse)
def generate_mock_exam(
    req: schemas.MockExamRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    store = get_vector_store(fid)

    selected_units = req.unit_numbers if req.unit_numbers else [1]
    questions_per_unit = max(1, req.num_questions // len(selected_units))

    all_questions = []
    q_id_counter = 1

    for u_num in selected_units:
        docs = store.similarity_search(f"Unit {u_num} core concepts exam questions", k=3)
        context = "\n\n".join([d.page_content for d in docs]) if docs else f"Unit {u_num} overview"

        prompt = (
            f"Generate exactly {questions_per_unit} multiple choice exam questions for Unit {u_num}.\n"
            "Return ONLY a JSON array of objects with keys: 'question', 'options' (4 strings), 'correct_answer', 'explanation'.\n\n"
            f"Context:\n{context[:2500]}"
        )

        try:
            response = safe_llm_invoke([
                {"role": "system", "content": "You are a university mock exam generator. Output valid JSON array only."},
                {"role": "user", "content": prompt}
            ])
            raw_text = extract_text(response).strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                raw_text = raw_text.strip()
            q_list = json.loads(raw_text)

            for q in q_list:
                all_questions.append(schemas.MockExamQuestion(
                    id=q_id_counter,
                    unit_number=u_num,
                    question=q.get("question", f"Unit {u_num} Question {q_id_counter}"),
                    options=q.get("options", ["A", "B", "C", "D"]),
                    correct_answer=q.get("correct_answer", "A"),
                    explanation=q.get("explanation", "Refer to syllabus notes.")
                ))
                q_id_counter += 1
        except Exception:
            all_questions.append(schemas.MockExamQuestion(
                id=q_id_counter,
                unit_number=u_num,
                question=f"What is the fundamental objective of Unit {u_num}?",
                options=["Understand core concepts", "Analyze data structures", "Implement algorithms", "Evaluate systems"],
                correct_answer="Understand core concepts",
                explanation="Core concepts form the primary objective of this unit."
            ))
            q_id_counter += 1

    exam_id = f"exam_{user.id}_{int(datetime.utcnow().timestamp())}"

    return schemas.MockExamResponse(
        exam_id=exam_id,
        duration_minutes=req.duration_minutes,
        questions=all_questions
    )


@app.post("/quiz/mock-exam/submit", response_model=schemas.MockExamReportResponse)
def submit_mock_exam(
    req: schemas.MockExamSubmitRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, req.faculty_id)
    total_q = len(req.answers)
    correct_cnt = 0

    unit_counts = {}  # {unit: {"total": 0, "correct": 0}}

    for ans in req.answers:
        u_num = ans.unit_number
        if u_num not in unit_counts:
            unit_counts[u_num] = {"total": 0, "correct": 0}
        unit_counts[u_num]["total"] += 1

        is_corr = ans.selected_answer.strip().lower() == ans.correct_answer.strip().lower()
        if is_corr:
            correct_cnt += 1
            unit_counts[u_num]["correct"] += 1

        # Store individual quiz attempt to record student progress
        attempt = models.QuizAttempt(
            user_id=user.id,
            faculty_id=fid,
            unit_number=u_num,
            topic_query=f"Mock Exam Unit {u_num}",
            question=f"Mock Exam Q{ans.question_id}",
            selected_answer=ans.selected_answer,
            correct_answer=ans.correct_answer,
            is_correct=is_corr
        )
        db.add(attempt)

    db.commit()

    score_pct = round((correct_cnt / max(1, total_q)) * 100, 1)
    passed = score_pct >= 60.0

    unit_breakdown = []
    weak_units = []

    for u_num, counts in unit_counts.items():
        u_pct = round((counts["correct"] / max(1, counts["total"])) * 100, 1)
        unit_breakdown.append(schemas.MockExamUnitResult(
            unit_number=u_num,
            total=counts["total"],
            correct=counts["correct"],
            score_percent=u_pct
        ))
        if u_pct < 60.0:
            weak_units.append(u_num)

    if score_pct >= 85:
        ai_feedback = "Outstanding performance! You have demonstrated thorough mastery across all tested units."
    elif score_pct >= 60:
        ai_feedback = f"Good effort! You passed the mock exam, but should review Unit(s) {', '.join(map(str, weak_units))} before the final test."
    else:
        ai_feedback = f"Additional revision recommended. Focus on Unit(s) {', '.join(map(str, weak_units))} and retake practice quizzes."

    return schemas.MockExamReportResponse(
        total_questions=total_q,
        correct_count=correct_cnt,
        score_percent=score_pct,
        passed=passed,
        unit_breakdown=unit_breakdown,
        weak_units=weak_units,
        ai_feedback=ai_feedback
    )


# ---------------------------------------------------------------------------
# PHASE 4: CACHED AI REVISION NOTES
# ---------------------------------------------------------------------------

@app.get("/units/{unit_number}/notes", response_model=schemas.RevisionNotesResponse)
def get_unit_revision_notes(
    unit_number: int,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fid = _resolve_faculty_id(user, faculty_id)
    unit = db.query(models.Unit).filter(
        models.Unit.unit_number == unit_number,
        models.Unit.faculty_id == fid
    ).first()
    unit_name = unit.unit_name if unit else f"Unit {unit_number}"

    # 1. Check DB Cache
    cached_notes = db.query(models.RevisionNotesCache).filter(
        models.RevisionNotesCache.faculty_id == fid,
        models.RevisionNotesCache.unit_number == unit_number
    ).first()

    if cached_notes:
        return schemas.RevisionNotesResponse(
            unit_number=unit_number,
            unit_name=unit_name,
            notes_markdown=cached_notes.notes_json,
            cached=True
        )

    # 2. Query RAG vector store for comprehensive unit notes
    store = get_vector_store(fid)
    docs = store.similarity_search(f"Unit {unit_number} definitions formulas key exam points overview", k=8)
    context = "\n\n".join([d.page_content for d in docs]) if docs else f"Notes for {unit_name}"

    prompt = (
        f"Create comprehensive high-yield Exam Revision Notes for Unit {unit_number}: '{unit_name}'.\n"
        "Format in clean, structured GitHub Markdown with the following sections:\n\n"
        "### 1. 📌 Core Concepts & Overview\n"
        "### 2. 📖 Key Definitions\n"
        "### 3. ⚙️ Formulas & Theoretical Rules\n"
        "### 4. 🎯 High-Yield Exam Points\n"
        "### 5. ❓ Expected Examination Questions\n\n"
        f"Syllabus Context:\n{context[:3500]}"
    )

    response = safe_llm_invoke([
        {"role": "system", "content": "You are an expert professor writing syllabus-bound revision notes."},
        {"role": "user", "content": prompt}
    ])
    notes_markdown = extract_text(response).strip()

    # Save to Cache
    new_cache = models.RevisionNotesCache(
        faculty_id=fid,
        unit_number=unit_number,
        notes_json=notes_markdown
    )
    db.add(new_cache)
    db.commit()

    return schemas.RevisionNotesResponse(
        unit_number=unit_number,
        unit_name=unit_name,
        notes_markdown=notes_markdown,
        cached=False
    )


# ---------------------------------------------------------------------------
# PHASE 5: DETERMINISTIC GAMIFICATION & BADGES (0 LLM QUOTA)
# ---------------------------------------------------------------------------

@app.get("/student/gamification", response_model=schemas.GamificationResponse)
def get_student_gamification(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == user.id).all()

    total_attempts = len(attempts)
    total_correct = sum(1 for a in attempts if a.is_correct)
    accuracy_pct = round((total_correct / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 0.0

    # Calculate distinct active study days
    attempt_dates = set(a.created_at.date() for a in attempts if a.created_at)
    doubts = db.query(models.DoubtHistory).filter(models.DoubtHistory.user_id == user.id).all()
    doubt_dates = set(d.created_at.date() for d in doubts if d.created_at)
    all_active_dates = sorted(list(attempt_dates.union(doubt_dates)))

    # Streak calculation
    streak = 0
    if all_active_dates:
        today = datetime.utcnow().date()
        current_check = today
        for date_entry in reversed(all_active_dates):
            if date_entry == current_check or date_entry == current_check - timedelta(days=1):
                streak += 1
                current_check = date_entry
            else:
                break

    # XP & Level Formula
    # +10 XP per attempt, +5 XP per correct answer, +50 XP bonus for high accuracy
    xp = (total_attempts * 10) + (total_correct * 5) + (streak * 20)
    level = (xp // 100) + 1
    next_level_xp = level * 100

    # Badges evaluation
    badges = [
        schemas.BadgeItem(
            id="badge_quiz_master",
            name="Quiz Master",
            description="Completed 5 or more quizzes",
            icon="🏅",
            unlocked=total_attempts >= 5
        ),
        schemas.BadgeItem(
            id="badge_high_accuracy",
            name="Precision Scholar",
            description="Achieved 75%+ overall quiz accuracy",
            icon="🎯",
            unlocked=accuracy_pct >= 75.0 and total_attempts >= 3
        ),
        schemas.BadgeItem(
            id="badge_streak_warrior",
            name="Streak Warrior",
            description="Maintained a 3-day active study streak",
            icon="🔥",
            unlocked=streak >= 3
        ),
        schemas.BadgeItem(
            id="badge_curious_mind",
            name="Curious Mind",
            description="Asked 5+ doubt questions to the AI Tutor",
            icon="💡",
            unlocked=len(doubts) >= 5
        ),
        schemas.BadgeItem(
            id="badge_unit_conqueror",
            name="Unit Conqueror",
            description="Earned 100+ XP in syllabus activities",
            icon="📚",
            unlocked=xp >= 100
        )
    ]

    return schemas.GamificationResponse(
        user_id=user.id,
        xp=xp,
        level=level,
        next_level_xp=next_level_xp,
        streak_days=streak,
        total_quizzes_completed=total_attempts,
        total_questions_correct=total_correct,
        accuracy_percent=accuracy_pct,
        badges=badges
    )


@app.get("/health")
def health_check():
    return {"status": "running"}


