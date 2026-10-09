"""
Pytest setup shared by the backend test suite.

main.py builds a Gemini embeddings client at import time, which refuses to
start without an API key. Tests that never embed text (auth, roles, quiz
bookkeeping) should still run on a fresh checkout, so we record whether a
real key is configured and then fill in a placeholder so the import succeeds.
Tests that need live embeddings use the ``requires_google_api_key`` marker
and are skipped when no real key is present.
"""

import os

import pytest
from dotenv import load_dotenv

load_dotenv()

HAS_GOOGLE_API_KEY = bool(
    os.getenv("GOOGLE_API_KEYS", "").strip()
    or os.getenv("GOOGLE_API_KEY", "").strip()
    or os.getenv("GEMINI_API_KEY", "").strip()
)

if not HAS_GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = "placeholder-for-tests"

requires_google_api_key = pytest.mark.skipif(
    not HAS_GOOGLE_API_KEY,
    reason="needs GOOGLE_API_KEY and an indexed syllabus PDF for live embeddings",
)
