"""
models.py
----------
User          -> student or faculty account (real hashed password now)
               faculty has a subject_name (e.g. "Operating Systems")
               students have a faculty_id linking them to one faculty/subject
Unit          -> a syllabus unit, scoped to a specific faculty
               (NOT a fixed list — every course can have different units)
Document      -> a PDF the faculty has uploaded & indexed into ChromaDB
QuizAttempt   -> one graded quiz question a student answered (drives progress)
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "student" or "faculty"
    subject_name = Column(String, nullable=True)  # faculty fills this (e.g. "Operating Systems")
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # students link to a faculty
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("unit_number", "faculty_id", name="uq_unit_number_per_faculty"),
    )

    id = Column(Integer, primary_key=True, index=True)
    unit_number = Column(Integer, nullable=False)
    unit_name = Column(String, nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    unit_number = Column(Integer, nullable=False)
    unit_name = Column(String, nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="indexed")  # "processing" | "indexed" | "failed"
    chunk_count = Column(Integer, default=0)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    topic_query = Column(String, nullable=True)
    question = Column(String, nullable=False)
    selected_answer = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DoubtHistory(Base):
    """Stores every Q&A interaction from /ask so students can review past doubts."""
    __tablename__ = "doubt_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    unit_number = Column(Integer, nullable=True)
    query = Column(String, nullable=False)
    mode = Column(String, default="exam")  # "exam" or "analogy"
    answer = Column(String, nullable=False)
    citations_json = Column(String, nullable=True)  # JSON string of citations
    top_similarity = Column(Float, nullable=True)  # Similarity score of top chunk for guardrail audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudyPlan(Base):
    """AI-generated adaptive study plans for students."""
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    exam_date = Column(String, nullable=False)  # ISO date string
    units_json = Column(String, nullable=False)  # JSON array of unit numbers
    plan_json = Column(String, nullable=False)  # JSON array of day-by-day plan
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UnitSummaryCache(Base):
    """Caches AI-generated unit summaries to avoid redundant LLM calls."""
    __tablename__ = "unit_summary_cache"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    summary_text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MindMapCache(Base):
    """Caches AI-generated unit mind maps (JSON tree structure)."""
    __tablename__ = "mind_map_cache"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    mindmap_json = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RevisionNotesCache(Base):
    """Caches AI-generated unit revision notes (JSON structured notes)."""
    __tablename__ = "revision_notes_cache"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    notes_json = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



