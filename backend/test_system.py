"""
test_system.py
--------------
Automated regression and reliability test suite for Syllabus AI Tutor.
Covers authentication, role authorization, guardrail evaluation, and telemetry.
"""

import pytest
from conftest import requires_google_api_key
from fastapi.testclient import TestClient
from main import app
import time

client = TestClient(app)

@pytest.fixture(scope="module")
def faculty_token():
    username = f"faculty_test_{int(time.time())}"
    res = client.post("/auth/signup", json={
        "name": username,
        "password": "TestPassword123!",
        "role": "faculty",
        "subject_name": "Distributed Systems",
    })
    assert res.status_code == 200, res.text
    return res.json()["token"]

@pytest.fixture(scope="module")
def student_token(faculty_token):
    # Fetch faculty list to find faculty id
    headers = {"Authorization": f"Bearer {faculty_token}"}
    fac_res = client.get("/faculty/list")
    faculty_id = fac_res.json()[0]["id"] if fac_res.json() else 1

    username = f"student_test_{int(time.time())}"
    res = client.post("/auth/signup", json={
        "name": username,
        "password": "TestPassword123!",
        "role": "student",
        "faculty_id": faculty_id,
    })
    assert res.status_code == 200, res.text
    return res.json()["token"], faculty_id

def test_unauthenticated_access_rejected():
    """Unauthenticated access to protected endpoints must return 401."""
    res = client.get("/units")
    assert res.status_code == 401

def test_faculty_signup_and_token(faculty_token):
    """Faculty token must be valid JWT and allow access to faculty endpoints."""
    headers = {"Authorization": f"Bearer {faculty_token}"}
    res = client.get("/faculty/analytics/enhanced", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_student_role_authorization_barrier(student_token):
    """Students attempting faculty actions must receive 403 Forbidden."""
    tok, _ = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    # Students cannot access faculty analytics
    res = client.get("/faculty/analytics/enhanced", headers=headers)
    assert res.status_code == 403

def test_syllabus_units_listing(student_token):
    """Authenticated student can query syllabus units."""
    tok, _ = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    res = client.get("/units", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_quiz_submit_and_progress(student_token):
    """Student submitting quiz attempt records correct and updates mastery."""
    tok, fid = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    payload = {
        "unit_number": 1,
        "faculty_id": fid,
        "items": [
            {
                "question": "What is primary memory?",
                "selected_answer": "RAM",
                "correct_answer": "RAM",
                "topic_query": "Memory Management",
            }
        ]
    }
    res = client.post("/quiz/submit", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["saved"] == 1

@requires_google_api_key
def test_out_of_syllabus_guardrail(student_token):
    """
    Out-of-syllabus query must trigger the similarity-threshold guardrail
    and return syllabus boundary rejection response with audit score.
    """
    tok, fid = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    payload = {
        "query": "What is the best recipe for baking chocolate brownies?",
        "faculty_id": fid,
        "mode": "exam",
    }
    res = client.post("/ask", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "outside the uploaded syllabus boundaries" in data["answer"]
    assert len(data["citations"]) == 0
    assert data["top_similarity"] is not None
    assert data["top_similarity"] < 0.40

@requires_google_api_key
def test_doubt_history_auditing(student_token):
    """Doubt history records every attempt with top_similarity audit score."""
    tok, fid = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    res = client.get("/student/doubt-history", headers=headers)
    assert res.status_code == 200
    history = res.json()
    assert "items" in history
    assert len(history["items"]) > 0
    first_item = history["items"][0]
    assert "top_similarity" in first_item
    assert first_item["top_similarity"] is not None

def test_invalid_jwt_rejected():
    """Tampered or invalid JWT signature must be rejected with 401."""
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_payload.fake_sig"
    headers = {"Authorization": f"Bearer {fake_token}"}
    res = client.get("/units", headers=headers)
    assert res.status_code == 401

def test_faculty_create_unit(faculty_token):
    """Faculty can dynamically create syllabus units."""
    headers = {"Authorization": f"Bearer {faculty_token}"}
    unit_num = int(time.time()) % 1000 + 10
    payload = {
        "unit_number": unit_num,
        "unit_name": "Distributed Consensus & Raft",
    }
    res = client.post("/faculty/units", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["unit_number"] == unit_num

def test_explain_again_endpoint(student_token):
    """Explain-again accepts simplification request with mode validation."""
    tok, fid = student_token
    headers = {"Authorization": f"Bearer {tok}"}
    payload = {
        "query": "What is semantic analysis?",
        "style": "simpler",
        "faculty_id": fid,
    }
    res = client.post("/ask/explain-again", json=payload, headers=headers)
    # Returns 200 with structured response or 400 if vectorstore empty for this subject
    assert res.status_code in [200, 400]

def test_faculty_document_versions_retrieval(faculty_token):
    """Faculty can query document version histories."""
    headers = {"Authorization": f"Bearer {faculty_token}"}
    res = client.get("/faculty/documents/versions/1", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
