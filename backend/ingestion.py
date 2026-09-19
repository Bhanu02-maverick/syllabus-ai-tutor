"""
ingestion.py
-------------
Core RAG ingestion logic: PDF -> text -> chunks -> embeddings -> ChromaDB.

Each faculty gets their OWN isolated vector store at:
    ./chroma_db/faculty_{faculty_id}/

This ensures Faculty A's "OS" PDFs never mix with Faculty B's "DBMS" PDFs.

Exposes ingest_pdf() so it can be called:
  1. From the command line directly (python ingestion.py)
  2. From main.py's /faculty/upload endpoint, right after a professor
     drags-and-drops a new PDF
"""

import os
import time
import math
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

DB_DIR_BASE = "./chroma_db"


def get_faculty_db_dir(faculty_id: int) -> str:
    """Return the ChromaDB directory for a specific faculty member."""
    path = os.path.join(DB_DIR_BASE, f"faculty_{faculty_id}")
    os.makedirs(path, exist_ok=True)
    return path


def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")


def ingest_pdf(file_path: str, unit_number: int, unit_name: str = "", faculty_id: int = 0) -> int:
    """
    Parses, chunks, embeds, and stores a PDF in the faculty's ChromaDB.
    Uses batching + rate-limit backoff to smoothly handle large (100+ page) PDFs.
    Returns the number of chunks created (0 if the file was missing).
    """
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return 0

    db_dir = get_faculty_db_dir(faculty_id)
    print(f"Loading {file_path} into faculty {faculty_id} store at {db_dir}...")

    loader = PyPDFLoader(file_path)
    pages = loader.load()

    for page in pages:
        page.metadata["unit"] = unit_number
        page.metadata["unit_name"] = unit_name
        page.metadata["source_file"] = os.path.basename(file_path)
        page.metadata["faculty_id"] = faculty_id

    # Optimal chunking for large textbook PDFs: 1000 chars per chunk reduces total embedding calls while preserving dense context
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(pages)
    print(f"Split {len(pages)} pages into {len(chunks)} chunks.")

    embeddings = get_embeddings()

    # Rate-Limit Aware Batching Strategy (Max 40 chunks per batch to stay under 100 RPM limit)
    batch_size = 40
    total_batches = math.ceil(len(chunks) / batch_size)

    vector_store = None
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        batch_num = (i // batch_size) + 1
        print(f"⚡ Embedding batch {batch_num}/{total_batches} ({len(batch)} chunks)...")

        max_retries = 5
        for attempt in range(max_retries):
            try:
                if vector_store is None:
                    vector_store = Chroma.from_documents(
                        documents=batch,
                        embedding=embeddings,
                        persist_directory=db_dir,
                    )
                else:
                    vector_store.add_documents(batch)
                break
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "resource_exhausted" in err_msg or "quota" in err_msg:
                    wait_sec = (attempt + 1) * 15
                    print(f"⚠️ Rate limit (429) hit. Pausing {wait_sec}s before retrying batch {batch_num}/{total_batches} (Attempt {attempt+1}/{max_retries})...")
                    time.sleep(wait_sec)
                else:
                    print(f"Error embedding batch {batch_num}: {e}")
                    if attempt == max_retries - 1:
                        raise e

        # Short pause between batches to respect Gemini free-tier RPM smoothly
        time.sleep(1.2)

    print(f"✅ Vector store updated successfully at '{db_dir}'. Total chunks: {len(chunks)}")
    return len(chunks)


if __name__ == "__main__":
    os.makedirs("./docs", exist_ok=True)
    sample_pdf = "./docs/unit1.pdf"

    if os.path.exists(sample_pdf):
        ingest_pdf(sample_pdf, unit_number=1, unit_name="Process & CPU Scheduling", faculty_id=1)
    else:
        print(f"Please put a sample PDF at: {sample_pdf} and run this script again.")

