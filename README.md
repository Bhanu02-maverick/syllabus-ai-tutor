# VCE AI Tutor — Full Syllabus-Bound RAG Framework

A dual-portal AI tutoring system with **real authentication** and **fully
dynamic syllabus units** (no fixed unit list — every course can be different).

- **Students** get syllabus-bound Q&A, adaptive explanation modes, and
  active-recall quizzes that update a real progress tree.
- **Faculty** create their own units (or let the AI suggest a name from the
  PDF), upload documents, view classroom analytics, and generate formal
  question banks — all behind a real login.

Backend: FastAPI + SQLAlchemy (SQLite) + JWT auth + bcrypt + LangChain + ChromaDB + Gemini
Frontend: React + Tailwind

## Folder Structure

```
syllabus-ai-tutor/
├── backend/
│   ├── main.py              # All API routes (auth, student, faculty)
│   ├── auth.py               # Password hashing + JWT session tokens
│   ├── database.py           # SQLite engine/session setup
│   ├── models.py             # User, Unit, Document, QuizAttempt tables
│   ├── schemas.py            # Request/response validation
│   ├── ingestion.py          # PDF -> chunks -> embeddings -> ChromaDB
│   ├── requirements.txt
│   ├── .env.example          # Copy to .env, add GOOGLE_API_KEY + JWT_SECRET
│   └── docs/                  # Uploaded PDFs land here automatically
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx            # Routes to Login / Student / Faculty view
        ├── api.js             # All backend calls + bearer token handling
        └── components/
            ├── Login.jsx       # Sign up / log in with password
            ├── StudentPortal.jsx
            └── FacultyDashboard.jsx
```

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and set:
```
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=any_long_random_string
```
Get a Gemini key at https://aistudio.google.com/apikey

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

`app.db` (SQLite) is created automatically on first run. Swagger docs:
http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo Flow (recommended order for review)

1. **Sign up** as Faculty (pick a username + password + role = Faculty).
2. In **Manage Syllabus Units**, either:
   - Add a unit manually (name it yourself), or
   - Skip straight to **Ingest Syllabus PDF**, choose "+ Create a new unit
     for this PDF", leave the number/name blank, and upload — the backend
     auto-assigns the next unit number and asks Gemini to suggest a title
     from the PDF's first page.
3. Use the **Question Bank Generator** — pick that unit, generate formal
   exam questions.
4. Sign out. **Sign up** again as a Student (different username).
5. The Syllabus Units panel shows exactly the units your faculty account
   created — nothing hardcoded, nothing pre-set.
6. Ask a question from that PDF, see the citation-backed answer, toggle
   Exam / Analogy mode, answer the quiz, click Submit.
7. Watch the mastery % update — this is a real database write.
8. Log back in as Faculty, check **Classroom Analytics** — the same
   attempt now shows up in the class-wide numbers.

## What Makes This "Real" (not a mockup)

- **Auth**: passwords are bcrypt-hashed (`passlib`), sessions are signed
  JWTs (`pyjwt`) with a 12-hour expiry. Every student/faculty endpoint
  requires a valid `Authorization: Bearer <token>` header — there is no way
  to call `/faculty/upload` as a student, the backend rejects it with 403.
- **Units are not a fixed list.** They live in a `units` table. Faculty
  create them (manually, or implicitly while uploading a PDF), and the
  student portal only ever shows what actually exists in the database.
- **AI-assisted unit naming**: if faculty leave the unit name blank during
  upload, `suggest_unit_name()` in `main.py` sends the PDF's first page to
  Gemini and uses its suggested title — genuinely dynamic per PDF, not a
  template string.
- **Progress and analytics** are computed from real `quiz_attempts` rows,
  same as before — nothing mocked.

## Known, Honest Scope Cuts (say these out loud if asked)

- No password reset / email verification — out of scope for a class demo.
- No document deletion / re-indexing — faculty can only add, not remove.
- Runs entirely on `localhost` — not deployed anywhere.
- No automated tests.
