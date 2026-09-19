const API_BASE = "http://localhost:8000";

let authToken = localStorage.getItem("vce_token") || null;

function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem("vce_token", token);
  } else {
    localStorage.removeItem("vce_token");
    localStorage.removeItem("vce_user");
  }
}

function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function request(path, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status === 401 && path !== "/auth/login") {
        setToken(null);
        window.dispatchEvent(new Event("vce_unauthorized"));
        throw new Error("Session expired. Please log in again.");
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out — the AI is taking too long. Please try again with fewer questions or a simpler query.");
    }
    throw err;
  }
}

export const api = {
  setToken,

  signup: (name, password, role, subjectName, facultyId) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name,
        password,
        role,
        subject_name: subjectName || null,
        faculty_id: facultyId || null,
      }),
    }),

  login: (name, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ name, password }) }),

  // Public: list all faculty accounts (for student signup)
  getFacultyList: () => request("/faculty/list"),

  getUnits: (facultyId) =>
    request(facultyId ? `/units?faculty_id=${facultyId}` : "/units"),

  createUnit: (unitNumber, unitName) =>
    request("/faculty/units", {
      method: "POST",
      body: JSON.stringify({ unit_number: unitNumber || null, unit_name: unitName || null }),
    }),

  deleteUnit: (unitNumber) =>
    request(`/faculty/units/${unitNumber}`, { method: "DELETE" }),

  getMyProgress: (facultyId) =>
    request(facultyId ? `/progress/me?faculty_id=${facultyId}` : "/progress/me"),

  ask: (query, mode, facultyId, unitNumber = null, subtopic = null) =>
    request("/ask", {
      method: "POST",
      body: JSON.stringify({
        query,
        mode,
        faculty_id: facultyId || null,
        unit_number: unitNumber || null,
        subtopic: subtopic || null,
      }),
    }, 180000),

  getSubtopics: (unitNumber, facultyId) =>
    request(`/units/${unitNumber}/subtopics${facultyId ? `?faculty_id=${facultyId}` : ""}`, {}, 180000),

  quiz: (topic, numQuestions = 5, unitNumber = null, facultyId = null) =>
    request("/quiz", {
      method: "POST",
      body: JSON.stringify({
        topic: topic || "",
        num_questions: numQuestions,
        unit_number: unitNumber,
        faculty_id: facultyId || null,
      }),
    }, 180000),

  submitQuiz: (unitNumber, items, facultyId = null) =>
    request("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ unit_number: unitNumber, items, faculty_id: facultyId || null }),
    }),

  facultyDocuments: () => request("/faculty/documents"),

  facultyAnalytics: () => request("/faculty/analytics"),

  facultyUpload: async (file, unitNumber, unitName) => {
    const formData = new FormData();
    formData.append("file", file);
    if (unitNumber) formData.append("unit_number", unitNumber);
    if (unitName) formData.append("unit_name", unitName);
    const res = await fetch(`${API_BASE}/faculty/upload`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Upload failed: ${res.status}`);
    }
    return res.json();
  },

  generateQuestionBank: (unitNumber, difficulty, numQuestions, questionType) =>
    request("/faculty/question-bank", {
      method: "POST",
      body: JSON.stringify({
        unit_number: unitNumber,
        difficulty,
        num_questions: numQuestions,
        question_type: questionType,
      }),
    }, 180000),

  // Admin APIs
  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: () => request("/admin/users"),
  createAdminUser: (name, password, role, subjectName, facultyId) =>
    request("/admin/users/create", {
      method: "POST",
      body: JSON.stringify({
        name,
        password,
        role,
        subject_name: subjectName || null,
        faculty_id: facultyId || null,
      }),
    }),
  resetUserPassword: (userId, newPassword) =>
    request(`/admin/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }),
  deleteAdminUser: (userId) =>
    request(`/admin/users/${userId}`, { method: "DELETE" }),

  // Feature 1: Weak-Topic Detection
  getWeakTopics: (facultyId) =>
    request(`/student/weak-topics${facultyId ? `?faculty_id=${facultyId}` : ""}`, {}, 180000),



  // Feature 3: Adaptive Study Plan
  generateStudyPlan: (examDate, unitNumbers, facultyId) =>
    request("/student/study-plan", {
      method: "POST",
      body: JSON.stringify({
        exam_date: examDate,
        unit_numbers: unitNumbers,
        faculty_id: facultyId || null,
      }),
    }, 180000),
  getSavedStudyPlan: (facultyId) =>
    request(`/student/study-plan${facultyId ? `?faculty_id=${facultyId}` : ""}`),

  // Feature 4: Faculty Enhanced Analytics
  facultyEnhancedAnalytics: () => request("/faculty/analytics/enhanced", {}, 180000),

  // Feature 5: AI Unit Summaries
  getUnitSummary: (unitNumber, facultyId) =>
    request(`/units/${unitNumber}/summary${facultyId ? `?faculty_id=${facultyId}` : ""}`, {}, 180000),

  // Feature 6: Doubt History
  getDoubtHistory: (facultyId, search = "") =>
    request(`/student/doubt-history?faculty_id=${facultyId}${search ? `&search=${encodeURIComponent(search)}` : ""}`),

  // Feature 7: Explain Again
  explainAgain: (query, style, facultyId) =>
    request("/ask/explain-again", {
      method: "POST",
      body: JSON.stringify({
        query,
        style, // "simpler" or "detailed"
        faculty_id: facultyId || null,
      }),
    }, 180000),

  // Feature 8: PDF Version Management
  getDocumentVersions: (unitNumber) =>
    request(`/faculty/documents/versions/${unitNumber}`),
  activateDocumentVersion: (docId) =>
    request(`/faculty/documents/${docId}/activate`, { method: "POST" }),
  deleteDocumentVersion: (docId) =>
    request(`/faculty/documents/${docId}/version`, { method: "DELETE" }),

  // Phase 1: Mind Maps & Node Actions
  getMindMap: (unitNumber, facultyId) =>
    request(`/units/${unitNumber}/mindmap${facultyId ? `?faculty_id=${facultyId}` : ""}`, {}, 180000),

  nodeAction: (unitNumber, nodeId, nodeLabel, action, facultyId) =>
    request("/mindmap/node-action", {
      method: "POST",
      body: JSON.stringify({
        unit_number: unitNumber,
        node_id: nodeId,
        node_label: nodeLabel,
        action,
        faculty_id: facultyId || null,
      }),
    }, 180000),

  // Phase 2: Adaptive Quiz
  getAdaptiveQuestion: (unitNumber, subtopic, currentDifficulty, correctCount, wrongCount, questionNumber, facultyId) =>
    request("/quiz/adaptive", {
      method: "POST",
      body: JSON.stringify({
        unit_number: unitNumber,
        subtopic: subtopic || null,
        current_difficulty: currentDifficulty,
        correct_count: correctCount,
        wrong_count: wrongCount,
        question_number: questionNumber,
        faculty_id: facultyId || null,
      }),
    }, 180000),

  // Phase 3: Timed AI Mock Exam
  generateMockExam: (unitNumbers, numQuestions, durationMinutes, facultyId) =>
    request("/quiz/mock-exam", {
      method: "POST",
      body: JSON.stringify({
        unit_numbers: unitNumbers,
        num_questions: numQuestions,
        duration_minutes: durationMinutes,
        faculty_id: facultyId || null,
      }),
    }, 180000),

  submitMockExam: (examId, answers, facultyId) =>
    request("/quiz/mock-exam/submit", {
      method: "POST",
      body: JSON.stringify({
        exam_id: examId,
        answers,
        faculty_id: facultyId || null,
      }),
    }),

  // Phase 4: AI Revision Notes
  getRevisionNotes: (unitNumber, facultyId) =>
    request(`/units/${unitNumber}/notes${facultyId ? `?faculty_id=${facultyId}` : ""}`, {}, 180000),

  // Phase 5: Gamification Engine
  getGamification: () => request("/student/gamification"),
};

