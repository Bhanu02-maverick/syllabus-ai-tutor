"""
schemas.py
-----------
Pydantic models — define the exact shape of JSON the frontend sends/receives.
FastAPI auto-validates every request against these.
"""

from pydantic import BaseModel
from typing import List, Optional


class SignupRequest(BaseModel):
    name: str
    password: str
    role: str  # "student" or "faculty"
    subject_name: Optional[str] = None  # required for faculty signup
    faculty_id: Optional[int] = None    # required for student signup (which faculty/subject)


class LoginRequest(BaseModel):
    name: str
    password: str


class AuthResponse(BaseModel):
    token: str
    id: int
    name: str
    role: str
    subject_name: Optional[str] = None
    faculty_id: Optional[int] = None


class FacultyListItem(BaseModel):
    id: int
    name: str
    subject_name: str


class AskRequest(BaseModel):
    query: str
    mode: str = "exam"  # "exam" or "analogy"
    faculty_id: Optional[int] = None
    unit_number: Optional[int] = None
    subtopic: Optional[str] = None



class Citation(BaseModel):
    source: str
    page: int
    unit: int


class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    unit_number: Optional[int] = None


class QuizRequest(BaseModel):
    topic: str = ""  # can be empty if unit_number is provided
    unit_number: Optional[int] = None  # quiz by unit
    num_questions: int = 5  # how many questions (max 50)
    faculty_id: Optional[int] = None



class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str


class QuizResponse(BaseModel):
    unit_number: Optional[int] = None
    quizzes: List[QuizQuestion]


class QuizSubmitItem(BaseModel):
    question: str
    selected_answer: str
    correct_answer: str
    topic_query: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    unit_number: int
    items: List[QuizSubmitItem]
    faculty_id: Optional[int] = None


class UnitProgress(BaseModel):
    unit_number: int
    unit_name: str
    indexed: bool
    attempts: int
    mastery_percent: float
    subtopics: List[str] = []


class SubtopicsResponse(BaseModel):
    unit_number: int
    unit_name: str
    subtopics: List[str]


class UnitCreateRequest(BaseModel):
    unit_number: Optional[int] = None  # omit to auto-assign the next number
    unit_name: Optional[str] = None    # omit + provide a PDF to auto-suggest a name


class UnitOut(BaseModel):
    unit_number: int
    unit_name: str


class FacultyQuestionBankRequest(BaseModel):
    unit_number: int
    difficulty: str = "medium"
    num_questions: int = 5
    question_type: str = "mcq"  # "mcq" or "short_answer"


class FacultyAnalyticsUnit(BaseModel):
    unit_number: int
    unit_name: str
    students_attempted: int
    average_score_percent: float


class AdminUserListItem(BaseModel):
    id: int
    name: str
    role: str
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    created_at: str
    quiz_attempts_count: int = 0
    documents_count: int = 0


class AdminStatsResponse(BaseModel):
    total_users: int
    total_faculty: int
    total_students: int
    total_documents: int
    total_quiz_attempts: int


class AdminResetPasswordRequest(BaseModel):
    new_password: str


class AdminCreateUserRequest(BaseModel):
    name: str
    password: str
    role: str  # "student", "faculty", or "admin"
    subject_name: Optional[str] = None
    faculty_id: Optional[int] = None


# ─── Feature 1: Weak-Topic Detection ─────────────────────────────────

class WeakTopicItem(BaseModel):
    unit_number: int
    unit_name: str
    topic: str
    total_questions: int
    incorrect_count: int
    accuracy_percent: float


class WeakTopicAnalysis(BaseModel):
    weak_topics: List[WeakTopicItem]
    ai_recommendation: str
    overall_mastery: float


# ─── Feature 3: Adaptive Study Plan ──────────────────────────────────

class StudyPlanRequest(BaseModel):
    exam_date: str  # ISO format: "2026-10-15"
    unit_numbers: List[int]  # which units to cover
    faculty_id: Optional[int] = None


class StudyPlanDay(BaseModel):
    day: int
    date: str
    focus_unit: int
    unit_name: str
    activity: str  # "Study", "Review", "Practice Quiz", "Revision"
    priority: str  # "high", "medium", "low"


class StudyPlanResponse(BaseModel):
    exam_date: str
    total_days: int
    plan: List[StudyPlanDay]
    ai_advice: str




# ─── Feature 4: Faculty Difficulty Analytics ──────────────────────────

class FacultyDifficultyTopic(BaseModel):
    topic: str
    total_attempts: int
    correct_count: int
    accuracy_percent: float


class FacultyEnhancedAnalyticsUnit(BaseModel):
    unit_number: int
    unit_name: str
    students_attempted: int
    average_score_percent: float
    difficult_topics: List[FacultyDifficultyTopic]


# ─── Feature 5: AI Unit Summaries ─────────────────────────────────────

class UnitSummaryResponse(BaseModel):
    unit_number: int
    unit_name: str
    summary: str
    cached: bool = False


# ─── Feature 6: Doubt History ────────────────────────────────────────

class DoubtHistoryItem(BaseModel):
    id: int
    query: str
    mode: str
    answer: str
    unit_number: Optional[int] = None
    created_at: str


class DoubtHistoryResponse(BaseModel):
    items: List[DoubtHistoryItem]
    total: int


# ─── Feature 7: Explain-Again ────────────────────────────────────────

class ExplainAgainRequest(BaseModel):
    query: str
    style: str = "simpler"  # "simpler" or "detailed"
    faculty_id: Optional[int] = None


# ─── Feature 8: PDF Version Management ───────────────────────────────

class DocumentVersionItem(BaseModel):
    id: int
    filename: str
    version: int
    is_active: bool
    status: str
    chunk_count: int
    uploaded_at: str


# ─── Phase 1: Mind Maps & Node Actions ───────────────────────────────

class MindMapNode(BaseModel):
    id: str
    label: str
    description: str
    children: List['MindMapNode'] = []

MindMapNode.update_forward_refs()


class MindMapResponse(BaseModel):
    unit_number: int
    unit_name: str
    tree: MindMapNode
    cached: bool = False


class NodeActionRequest(BaseModel):
    unit_number: int
    node_id: str
    node_label: str
    action: str  # "explain", "example", "quiz"
    faculty_id: Optional[int] = None


class NodeActionResponse(BaseModel):
    action: str
    node_label: str
    content: str  # AI explanation/example/quiz text or JSON


# ─── Phase 2: Adaptive Quiz ─────────────────────────────────────────

class AdaptiveQuizRequest(BaseModel):
    unit_number: int
    subtopic: Optional[str] = None
    current_difficulty: str = "medium"  # "easy", "medium", "hard"
    correct_count: int = 0
    wrong_count: int = 0
    question_number: int = 1
    faculty_id: Optional[int] = None


class AdaptiveQuizResponse(BaseModel):
    question_number: int
    difficulty: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


# ─── Phase 3: Timed AI Mock Exam ─────────────────────────────────────

class MockExamRequest(BaseModel):
    unit_numbers: List[int]
    num_questions: int = 15
    duration_minutes: int = 20
    faculty_id: Optional[int] = None


class MockExamQuestion(BaseModel):
    id: int
    unit_number: int
    question: str
    options: List[str]
    correct_answer: str
    explanation: str


class MockExamResponse(BaseModel):
    exam_id: str
    duration_minutes: int
    questions: List[MockExamQuestion]


class MockExamAnswerItem(BaseModel):
    question_id: int
    unit_number: int
    selected_answer: str
    correct_answer: str


class MockExamSubmitRequest(BaseModel):
    exam_id: str
    answers: List[MockExamAnswerItem]
    faculty_id: Optional[int] = None


class MockExamUnitResult(BaseModel):
    unit_number: int
    total: int
    correct: int
    score_percent: float


class MockExamReportResponse(BaseModel):
    total_questions: int
    correct_count: int
    score_percent: float
    passed: bool
    unit_breakdown: List[MockExamUnitResult]
    weak_units: List[int]
    ai_feedback: str


# ─── Phase 4: AI Revision Notes (Cached) ──────────────────────────────

class RevisionNotesResponse(BaseModel):
    unit_number: int
    unit_name: str
    notes_markdown: str
    cached: bool = False


# ─── Phase 5: Gamification Engine ─────────────────────────────────────

class BadgeItem(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: Optional[str] = None


class GamificationResponse(BaseModel):
    user_id: int
    xp: int
    level: int
    next_level_xp: int
    streak_days: int
    total_quizzes_completed: int
    total_questions_correct: int
    accuracy_percent: float
    badges: List[BadgeItem]



