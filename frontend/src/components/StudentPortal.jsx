import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  FileText,
  HelpCircle,
  LogOut,
  Send,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ClipboardList,
  Sparkles,
  Award,
  Brain,
  Target,
  Calendar,
  History,
  Search,
  RefreshCw,
  BookMarked,
  TrendingDown,
  AlertTriangle,
  Zap,
  Clock,
  Trophy,
  Flame,
  Star,
  Layers,
  Network,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { preprocessLaTeX } from "../utils/latexHelper.js";
import { api } from "../api";
import ThemeToggle from "./ThemeToggle.jsx";
import GamificationCard from "./GamificationCard.jsx";
import AIThinking from "./AIThinking.jsx";
import NodeActionPanel from "./NodeActionPanel.jsx";
import MindMapVisualizer from "./MindMapVisualizer.jsx";
import RevisionNotesView from "./RevisionNotesView.jsx";
import InteractiveQuizView from "./InteractiveQuizView.jsx";
import TimedMockExamView from "./TimedMockExamView.jsx";
import NetworkCanvas from "./NetworkCanvas.jsx";
import WorkspaceHero from "./WorkspaceHero.jsx";
import GamificationConstellation from "./GamificationConstellation.jsx";
import RAGNodeVisualizer from "./RAGNodeVisualizer.jsx";



/* ─── Markdown styling components ────────────────────────────────────── */
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-5 mb-3 pb-2 border-b border-indigo-200 dark:border-indigo-900/50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold text-indigo-800 dark:text-indigo-300 mt-3 mb-1.5">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-3 font-medium">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5 text-sm text-slate-800 dark:text-slate-200 font-medium">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5 text-sm text-slate-800 dark:text-slate-200 font-medium">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed text-slate-800 dark:text-slate-200">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-extrabold text-slate-950 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic font-semibold text-slate-700 dark:text-slate-300">{children}</em>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ) : (
      <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono mb-3">
        <code>{children}</code>
      </pre>
    ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 pl-4 py-2 my-3 text-sm text-slate-700 dark:text-slate-300 italic rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="min-w-full text-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">{children}</td>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
};

/* ─── Interactive Mind Map Node Renderer ──────────────────────────────── */
function RenderMindMapNode({ node, onAction }) {
  if (!node) return null;
  return (
    <div className="ml-3 my-2 border-l-2 border-indigo-200 pl-3 space-y-2">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-500" /> {node.label}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onAction(node.id, node.label, "explain")}
              className="text-[11px] font-semibold px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition cursor-pointer"
            >
              💡 Explain
            </button>
            <button
              onClick={() => onAction(node.id, node.label, "example")}
              className="text-[11px] font-semibold px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md border border-amber-200 transition cursor-pointer"
            >
              🔍 Example
            </button>
            <button
              onClick={() => onAction(node.id, node.label, "quiz")}
              className="text-[11px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition cursor-pointer"
            >
              🎯 Quiz Me
            </button>
            <button
              onClick={() => onAction(node.id, node.label, "ask")}
              className="text-[11px] font-semibold px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md border border-purple-200 transition cursor-pointer"
            >
              💬 Ask AI
            </button>
          </div>
        </div>
        {node.description && (
          <p className="text-xs text-slate-500 mt-1">{node.description}</p>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child, idx) => (
            <RenderMindMapNode key={child.id || idx} node={child} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentPortal({ user, onLogout }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("vce_theme") === "dark";
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("vce_theme", next ? "dark" : "light");
      return next;
    });
  };

  // ─── Browser History & Routing Synchronization ────────────────────────
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    const validTabs = ["study", "qa", "mindmap", "notes", "revision", "quiz", "mock_exam", "mock", "insights", "history"];
    if (validTabs.includes(hash)) {
      if (hash === "qa") return "study";
      if (hash === "revision") return "notes";
      if (hash === "mock") return "mock_exam";
      return hash;
    }
    return "study";
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  // Synchronize tab changes with window.history.pushState
  const setActiveTab = useCallback((newTab, pushState = true) => {
    let target = newTab;
    if (target === "qa") target = "study";
    if (target === "revision") target = "notes";
    if (target === "mock") target = "mock_exam";

    setActiveTabState(target);

    if (pushState && window.history) {
      const currentHash = window.location.hash.replace("#", "").toLowerCase();
      if (currentHash !== target) {
        window.history.pushState({ tab: target }, "", `#${target}`);
      }
    }
  }, []);

  // Listen to browser Back / Forward buttons (popstate event)
  useEffect(() => {
    if (!window.history.state || !window.history.state.tab) {
      const currentHash = window.location.hash.replace("#", "").toLowerCase();
      let initial = currentHash || activeTab;
      if (initial === "qa") initial = "study";
      if (initial === "revision") initial = "notes";
      if (initial === "mock") initial = "mock_exam";
      window.history.replaceState({ tab: initial }, "", `#${initial}`);
    }

    const handlePopState = (event) => {
      const stateTab = event.state?.tab;
      const hashTab = window.location.hash.replace("#", "").toLowerCase();
      let targetTab = stateTab || hashTab || "study";

      if (targetTab === "qa") targetTab = "study";
      if (targetTab === "revision") targetTab = "notes";
      if (targetTab === "mock") targetTab = "mock_exam";

      const validTabs = ["study", "mindmap", "notes", "quiz", "mock_exam", "insights", "history"];
      if (validTabs.includes(targetTab)) {
        setActiveTabState(targetTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [units, setUnits] = useState([]);


  // Study tab state
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("exam");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastQuery, setLastQuery] = useState(""); // for explain-again
  const [explainLoading, setExplainLoading] = useState(false);

  // Quiz tab state
  const [quizUnitSelect, setQuizUnitSelect] = useState("");
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizUnit, setQuizUnit] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizError, setQuizError] = useState(null);

  // Sidebar: expanded units + subtopics cache
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [subtopicsCache, setSubtopicsCache] = useState({});
  const [loadingSubtopics, setLoadingSubtopics] = useState(null);

  // AI Insights state
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [weakTopics, setWeakTopics] = useState(null);
  const [weakTopicsLoading, setWeakTopicsLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [selectedPlanUnits, setSelectedPlanUnits] = useState([]);
  const [unitSummary, setUnitSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryUnit, setSummaryUnit] = useState(null);


  // Doubt History state
  const [doubtHistory, setDoubtHistory] = useState(null);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtSearch, setDoubtSearch] = useState("");
  const [expandedDoubt, setExpandedDoubt] = useState(null);

  // Gamification state
  const [gamification, setGamification] = useState(null);
  const [showHero, setShowHero] = useState(true);


  // Topic filter state for Q&A
  const [qaUnitSelect, setQaUnitSelect] = useState("");
  const [qaSubtopicSelect, setQaSubtopicSelect] = useState("");

  // Mind Map state
  const [mindMapUnit, setMindMapUnit] = useState("1");
  const [mindMapData, setMindMapData] = useState(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [nodeModal, setNodeModal] = useState({ isOpen: false, nodeLabel: "", action: "", content: "", loading: false });

  // Revision Notes state
  const [notesUnit, setNotesUnit] = useState("1");
  const [revisionNotesData, setRevisionNotesData] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Adaptive Quiz state
  const [isAdaptiveQuizMode, setIsAdaptiveQuizMode] = useState(false);
  const [adaptiveState, setAdaptiveState] = useState({
    currentDifficulty: "medium",
    correctCount: 0,
    wrongCount: 0,
    questionNumber: 1,
    questionData: null,
    selectedAnswer: "",
    isSubmitted: false,
    loading: false,
  });

  // Mock Exam state
  const [mockExamSelectedUnits, setMockExamSelectedUnits] = useState([]);
  const [mockExamDuration, setMockExamDuration] = useState(20);
  const [mockExamNumQuestions, setMockExamNumQuestions] = useState(15);
  const [mockExamActive, setMockExamActive] = useState(false);
  const [mockExamData, setMockExamData] = useState(null);
  const [mockExamCurrentIndex, setMockExamCurrentIndex] = useState(0);
  const [mockExamAnswers, setMockExamAnswers] = useState({});
  const [mockExamTimeLeft, setMockExamTimeLeft] = useState(1200);
  const [mockExamLoading, setMockExamLoading] = useState(false);
  const [mockExamReport, setMockExamReport] = useState(null);



  // Load gamification data
  const loadGamification = useCallback(async () => {
    try {
      const data = await api.getGamification();
      setGamification(data);
    } catch (err) {
      console.error("Gamification error", err);
    }
  }, []);

  useEffect(() => {
    loadGamification();
  }, [loadGamification]);

  // 1. Load available faculty/subject list on mount
  useEffect(() => {
    api
      .getFacultyList()
      .then((list) => {
        setFacultyList(list);
        if (list.length > 0) {
          setSelectedFacultyId(list[0].id);
        }
      })
      .catch((err) => console.error("Could not fetch faculty list", err));
  }, []);

  // 2. Load progress whenever selectedFacultyId changes
  const loadProgress = useCallback(async (fid) => {
    if (!fid) return;
    try {
      const data = await api.getMyProgress(fid);
      setUnits(data);
      if (data.length > 0) {
        setQuizUnitSelect(String(data[0].unit_number));
        setQaUnitSelect(String(data[0].unit_number));
        setMindMapUnit(String(data[0].unit_number));
        setNotesUnit(String(data[0].unit_number));
      } else {
        setQuizUnitSelect("");
      }
    } catch (err) {
      console.error(err);
      setUnits([]);
    }
  }, []);

  useEffect(() => {
    if (selectedFacultyId) {
      setQuizzes([]);
      setResult(null);
      setExpandedUnit(null);
      setSubtopicsCache({});
      setWeakTopics(null);
      setStudyPlan(null);
      setDoubtHistory(null);
      setUnitSummary(null);
      setMindMapData(null);
      setRevisionNotesData(null);
      loadProgress(selectedFacultyId);
      loadGamification();
    }
  }, [selectedFacultyId, loadProgress, loadGamification]);

  // ─── Mind Map Handler ───
  const handleLoadMindMap = async (unitNum) => {
    const targetUnit = unitNum || mindMapUnit;
    if (!selectedFacultyId || !targetUnit) return;
    setMindMapLoading(true);
    try {
      const data = await api.getMindMap(Number(targetUnit), selectedFacultyId);
      setMindMapData(data);
    } catch (err) {
      alert(err.message || "Could not generate Mind Map.");
    } finally {
      setMindMapLoading(false);
    }
  };

  const handleNodeAskSubmit = async (userQuestion, nodeLabel) => {
    setNodeModal((prev) => ({ ...prev, loading: true }));
    try {
      const promptText = `Regarding the syllabus concept '${nodeLabel}': ${userQuestion}`;
      const res = await api.askQuestion(Number(mindMapUnit || 1), promptText, selectedFacultyId);
      setNodeModal((prev) => ({
        ...prev,
        content: prev.content + `\n\n---\n**Q:** ${userQuestion}\n\n**AI Answer:** ${res.answer}`,
        loading: false,
      }));
    } catch (err) {
      setNodeModal((prev) => ({
        ...prev,
        content: prev.content + `\n\n*Error: ${err.message}*`,
        loading: false,
      }));
    }
  };

  const handleNodeAction = async (nodeId, nodeLabel, action) => {
    if (action === "ask") {
      setNodeModal({
        isOpen: true,
        nodeLabel,
        action: "ask",
        content: `### 💬 Ask Syllabus AI about **${nodeLabel}**\n\nI can explain concepts, provide real-world examples, or break down formulas for **${nodeLabel}**. Ask your question below:`,
        loading: false,
      });
      return;
    }

    setNodeModal({ isOpen: true, nodeLabel, action, content: "", loading: true });
    try {
      const res = await api.nodeAction(Number(mindMapUnit), nodeId, nodeLabel, action, selectedFacultyId);
      setNodeModal({ isOpen: true, nodeLabel, action, content: res.content, loading: false });
    } catch (err) {
      setNodeModal({ isOpen: true, nodeLabel, action, content: "Error: " + err.message, loading: false });
    }
  };

  // ─── Revision Notes Handler ───
  const handleLoadNotes = async (unitNum) => {
    const targetUnit = unitNum || notesUnit;
    if (!selectedFacultyId || !targetUnit) return;
    setNotesLoading(true);
    try {
      const data = await api.getRevisionNotes(Number(targetUnit), selectedFacultyId);
      setRevisionNotesData(data);
    } catch (err) {
      alert(err.message || "Could not load revision notes.");
    } finally {
      setNotesLoading(false);
    }
  };

  // ─── Adaptive Quiz Handlers ───
  const handleStartAdaptiveQuiz = async () => {
    if (!selectedFacultyId || !quizUnitSelect) return;
    setAdaptiveState({
      currentDifficulty: "medium",
      correctCount: 0,
      wrongCount: 0,
      questionNumber: 1,
      questionData: null,
      selectedAnswer: "",
      isSubmitted: false,
      loading: true,
    });
    try {
      const res = await api.getAdaptiveQuestion(
        Number(quizUnitSelect),
        null,
        "medium",
        0,
        0,
        1,
        selectedFacultyId
      );
      setAdaptiveState((prev) => ({ ...prev, questionData: res, loading: false }));
    } catch (err) {
      alert(err.message || "Could not start adaptive quiz.");
      setAdaptiveState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSubmitAdaptiveQuestion = () => {
    if (!adaptiveState.selectedAnswer || adaptiveState.isSubmitted) return;
    const isCorrect =
      adaptiveState.selectedAnswer.trim().toLowerCase() ===
      adaptiveState.questionData.correct_answer.trim().toLowerCase();
    setAdaptiveState((prev) => ({
      ...prev,
      isSubmitted: true,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
    }));
    loadGamification();
  };

  const handleNextAdaptiveQuestion = async () => {
    const nextQNum = adaptiveState.questionNumber + 1;
    setAdaptiveState((prev) => ({
      ...prev,
      questionNumber: nextQNum,
      selectedAnswer: "",
      isSubmitted: false,
      loading: true,
    }));
    try {
      const res = await api.getAdaptiveQuestion(
        Number(quizUnitSelect),
        null,
        adaptiveState.currentDifficulty,
        adaptiveState.correctCount,
        adaptiveState.wrongCount,
        nextQNum,
        selectedFacultyId
      );
      setAdaptiveState((prev) => ({
        ...prev,
        currentDifficulty: res.difficulty,
        questionData: res,
        loading: false,
      }));
    } catch (err) {
      alert(err.message || "Could not fetch next question.");
      setAdaptiveState((prev) => ({ ...prev, loading: false }));
    }
  };

  // ─── Timed Mock Exam Handlers ───
  const handleStartMockExam = async () => {
    if (mockExamSelectedUnits.length === 0 || !selectedFacultyId) {
      alert("Please select at least one unit for the mock exam.");
      return;
    }
    setMockExamLoading(true);
    setMockExamReport(null);
    try {
      const data = await api.generateMockExam(
        mockExamSelectedUnits,
        mockExamNumQuestions,
        mockExamDuration,
        selectedFacultyId
      );
      setMockExamData(data);
      setMockExamCurrentIndex(0);
      setMockExamAnswers({});
      setMockExamTimeLeft(data.duration_minutes * 60);
      setMockExamActive(true);
    } catch (err) {
      alert(err.message || "Could not generate mock exam.");
    } finally {
      setMockExamLoading(false);
    }
  };

  useEffect(() => {
    if (!mockExamActive || mockExamTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setMockExamTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mockExamActive, mockExamTimeLeft]);

  const handleFinalSubmitMockExam = async () => {
    if (!mockExamData || !selectedFacultyId) return;
    setMockExamLoading(true);
    try {
      const answersPayload = mockExamData.questions.map((q) => ({
        question_id: q.id,
        unit_number: q.unit_number,
        selected_answer: mockExamAnswers[q.id] || "",
        correct_answer: q.correct_answer,
      }));
      const report = await api.submitMockExam(mockExamData.exam_id, answersPayload, selectedFacultyId);
      setMockExamReport(report);
      setMockExamActive(false);
      loadProgress(selectedFacultyId);
      loadGamification();
    } catch (err) {
      alert(err.message || "Error submitting mock exam.");
    } finally {
      setMockExamLoading(false);
    }
  };


  // Load subtopics when a unit is expanded
  const handleToggleUnit = async (unitNumber) => {
    if (expandedUnit === unitNumber) {
      setExpandedUnit(null);
      return;
    }
    setExpandedUnit(unitNumber);
    if (!subtopicsCache[unitNumber]) {
      setLoadingSubtopics(unitNumber);
      try {
        const data = await api.getSubtopics(unitNumber, selectedFacultyId);
        setSubtopicsCache((prev) => ({ ...prev, [unitNumber]: data.subtopics }));
      } catch {
        setSubtopicsCache((prev) => ({ ...prev, [unitNumber]: [] }));
      } finally {
        setLoadingSubtopics(null);
      }
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedFacultyId) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.ask(
        query,
        mode,
        selectedFacultyId,
        qaUnitSelect ? Number(qaUnitSelect) : null,
        qaSubtopicSelect || null
      );
      setResult(data);
      setLastQuery(query);
    } catch (err) {
      console.error(err);
      setResult({
        answer: `⚠️ **Notice**: ${err.message || "Failed to query syllabus. Please make sure PDFs are uploaded for this course."}`,
        citations: [],
        unit_number: null,
      });
    } finally {
      setLoading(false);
      loadGamification();
    }
  };


  // Feature 7: Explain Again
  const handleExplainAgain = async (style) => {
    if (!lastQuery || !selectedFacultyId) return;
    setExplainLoading(true);
    try {
      const data = await api.explainAgain(lastQuery, style, selectedFacultyId);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setExplainLoading(false);
    }
  };

  // ─── Quiz tab handlers ───
  const handleStartQuiz = async () => {
    if (!quizUnitSelect || !selectedFacultyId) return;
    setQuizLoading(true);
    setQuizzes([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizError(null);
    try {
      const data = await api.quiz("", quizNumQuestions, Number(quizUnitSelect), selectedFacultyId);
      setQuizzes(data.quizzes || []);
      setQuizUnit(data.unit_number);
    } catch (err) {
      setQuizError(err.message || "Could not generate quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubtopicQuiz = async (unitNumber, subtopic) => {
    if (!selectedFacultyId) return;
    setActiveTab("quiz");
    setQuizUnitSelect(String(unitNumber));
    setQuizLoading(true);
    setQuizzes([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizError(null);
    try {
      const data = await api.quiz(subtopic, quizNumQuestions, unitNumber, selectedFacultyId);
      setQuizzes(data.quizzes || []);
      setQuizUnit(unitNumber);
    } catch (err) {
      setQuizError(err.message || "Could not generate quiz for subtopic.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleFullUnitQuiz = async (unitNumber) => {
    if (!selectedFacultyId) return;
    setActiveTab("quiz");
    setQuizUnitSelect(String(unitNumber));
    setQuizLoading(true);
    setQuizzes([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizError(null);
    try {
      const data = await api.quiz("", quizNumQuestions, unitNumber, selectedFacultyId);
      setQuizzes(data.quizzes || []);
      setQuizUnit(unitNumber);
    } catch (err) {
      setQuizError(err.message || "Could not generate full unit quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizUnit || !selectedFacultyId) return;
    const items = quizzes.map((q) => ({
      question: q.question,
      selected_answer: selectedAnswers[q.question] || "",
      correct_answer: q.answer,
      topic_query: null,
    }));
    try {
      await api.submitQuiz(quizUnit, items, selectedFacultyId);
      setQuizSubmitted(true);
      const correct = quizzes.filter(
        (q) => selectedAnswers[q.question]?.trim() === q.answer?.trim()
      ).length;
      setQuizScore({ correct, total: quizzes.length });
      loadProgress(selectedFacultyId);
    } catch (err) {
      alert(err.message || "Could not submit quiz.");
    }
  };

  // ─── AI Insights handlers ───
  const loadInsightsData = useCallback(async () => {
    if (!selectedFacultyId) return;
    setInsightsLoading(true);
    try {
      const selectedUnitsStr = selectedPlanUnits.length > 0 ? selectedPlanUnits.join(",") : null;
      const data = await api.getInsights(selectedFacultyId, selectedUnitsStr);
      setInsightsData(data);
    } catch (err) {
      console.error("Insights error", err);
    } finally {
      setInsightsLoading(false);
    }
  }, [selectedFacultyId, selectedPlanUnits]);

  useEffect(() => {
    if (activeTab === "insights" && selectedFacultyId) {
      loadInsightsData();
    }
  }, [activeTab, selectedFacultyId, loadInsightsData]);

  const handleExplainTopic = async (topic, unitNumber) => {
    if (!selectedFacultyId) return;
    setNodeModal({
      isOpen: true,
      nodeLabel: topic,
      action: "explain",
      content: "",
      loading: true,
    });
    try {
      const data = await api.nodeAction(
        unitNumber || 1,
        "topic_node",
        topic,
        "explain",
        selectedFacultyId
      );
      setNodeModal((prev) => ({
        ...prev,
        content: data.content,
        loading: false,
      }));
    } catch (err) {
      setNodeModal((prev) => ({
        ...prev,
        content: `⚠️ Failed to fetch explanation: ${err.message}`,
        loading: false,
      }));
    }
  };

  const loadWeakTopics = async () => {
    if (!selectedFacultyId) return;
    setWeakTopicsLoading(true);
    try {
      const data = await api.getWeakTopics(selectedFacultyId);
      setWeakTopics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setWeakTopicsLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!selectedFacultyId || !examDate || selectedPlanUnits.length === 0) return;
    setStudyPlanLoading(true);
    try {
      const data = await api.generateStudyPlan(examDate, selectedPlanUnits, selectedFacultyId);
      setStudyPlan(data);
    } catch (err) {
      alert(err.message || "Could not generate study plan.");
    } finally {
      setStudyPlanLoading(false);
    }
  };


  const handleLoadSummary = async (unitNumber) => {
    if (!selectedFacultyId) return;
    setSummaryUnit(unitNumber);
    setSummaryLoading(true);
    setUnitSummary(null);
    try {
      const data = await api.getUnitSummary(unitNumber, selectedFacultyId);
      setUnitSummary(data);
    } catch (err) {
      setUnitSummary({ summary: `⚠️ ${err.message || "Could not generate summary."}`, unit_name: "", unit_number: unitNumber });
    } finally {
      setSummaryLoading(false);
    }
  };

  // ─── Doubt History handlers ───
  const loadDoubtHistory = async (searchTerm = "") => {
    if (!selectedFacultyId) return;
    setDoubtLoading(true);
    try {
      const data = await api.getDoubtHistory(selectedFacultyId, searchTerm);
      setDoubtHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDoubtLoading(false);
    }
  };

  const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];
  const safeUnits = Array.isArray(units) ? units : [];

  const allAnswered =
    safeQuizzes.length > 0 && safeQuizzes.every((q) => q && selectedAnswers[q.question]);

  const indexedUnits = safeUnits.filter((u) => u && u.indexed);


  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden ${
      isDark ? "bg-[#0B1020] text-slate-100" : "bg-[#F8FAFC] text-slate-800"
    }`}>
      {/* 60 FPS HTML5 Canvas Background Particle Network */}
      <NetworkCanvas isDark={isDark} />

      {/* Header */}
      <header className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm border-b transition-colors z-20 ${
        isDark ? "bg-slate-900/80 border-slate-800/80 backdrop-blur-md" : "bg-white/90 border-slate-200 backdrop-blur-md"
      }`}>
        <div className="flex items-center space-x-3">
          {/* History Back & Forward Navigation Controls */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => window.history.back()}
              title="Go Back (Browser History)"
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              title="Go Forward (Browser History)"
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20"
          >
            <GraduationCap className="h-6 w-6" />
          </motion.div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight flex items-center gap-2">
              <span>VCE AI Tutor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </h1>
            <p className="text-xs opacity-60">Syllabus-Bound Adaptive Platform · Welcome, {user.name}</p>
          </div>
        </div>

        {/* Course / Subject Selector */}
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold border transition ${
          isDark
            ? "bg-slate-950/80 border-indigo-500/30 text-indigo-300 shadow-sm"
            : "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs"
        }`}>
          <BookOpen className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <span className="opacity-80">Course:</span>
          {facultyList.length === 0 ? (
            <span className="text-amber-500 italic">No courses available</span>
          ) : (
            <select
              value={selectedFacultyId || ""}
              onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
              className={`font-extrabold rounded-xl px-3 py-1 text-xs focus:outline-none transition cursor-pointer ${
                isDark ? "bg-slate-900 text-indigo-200 border border-indigo-500/40" : "bg-white text-indigo-950 border border-slate-300"
              }`}
            >
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.subject_name} — Prof. {f.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHero(!showHero)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-2xl border transition cursor-pointer ${
              showHero
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : isDark
                ? "bg-slate-800/80 text-indigo-300 border-indigo-500/30 hover:bg-slate-800"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> ✦ Entrance Hero
          </button>

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-2xl border transition cursor-pointer ${
              isDark
                ? "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </motion.button>
        </div>
      </header>

      {/* Opening Cinematic Hero Entrance */}
      <AnimatePresence>
        {showHero && (
          <div className="p-6 max-w-7xl mx-auto w-full z-10">
            <WorkspaceHero onEnterWorkspace={() => setShowHero(false)} isDark={isDark} />
          </div>
        )}
      </AnimatePresence>

      <div className={`flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6 z-10 ${showHero ? "hidden" : ""}`}>
        {/* ─── Left Sidebar Navigation ─── */}
        <aside className={`w-full md:w-72 flex-shrink-0 p-5 rounded-3xl border shadow-md space-y-6 h-fit transition ${
          isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Section 1: Syllabus Units */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 opacity-80">
              <BookOpen className="h-4 w-4 text-indigo-500" /> Syllabus Units
            </h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {units.length === 0 && (
                <p className="text-xs opacity-50 italic">No units uploaded yet.</p>
              )}
              {units.map((u) => (
                <div key={u.unit_number} className="group">
                  <button
                    onClick={() => u.indexed && handleToggleUnit(u.unit_number)}
                    className={`w-full text-left p-3 rounded-2xl border transition ${
                      u.indexed
                        ? isDark
                          ? "bg-slate-950/60 border-slate-800 hover:border-indigo-500/50 cursor-pointer"
                          : "bg-slate-50 border-slate-100 hover:border-blue-300 cursor-pointer"
                        : "opacity-40 cursor-default"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {u.indexed && (
                          expandedUnit === u.unit_number
                            ? <ChevronDown className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                            : <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">
                          Unit {u.unit_number}
                        </span>
                      </div>
                      {u.mastery_percent >= 80 ? (
                        <Award className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <span className="text-[11px] font-semibold opacity-60 flex-shrink-0">{u.mastery_percent}%</span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-70 mt-1 ml-5 font-medium truncate">{u.unit_name}</p>

                    {u.indexed && (
                      <div className="mt-2 ml-5">
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              u.mastery_percent >= 80
                                ? "bg-emerald-500"
                                : u.mastery_percent >= 40
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${Math.max(u.mastery_percent, 3)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Subtopics Expansion List */}
                  {expandedUnit === u.unit_number && (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-indigo-500/40 space-y-1.5 py-1">
                      {loadingSubtopics === u.unit_number ? (
                        <div className="flex items-center gap-2 text-[11px] text-indigo-400 p-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting subtopics...</span>
                        </div>
                      ) : (subtopicsCache[u.unit_number] || []).length === 0 ? (
                        <p className="text-[11px] opacity-60 italic p-1">No specific subtopics found.</p>
                      ) : (
                        (subtopicsCache[u.unit_number] || []).map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between transition ${
                              isDark
                                ? "bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50"
                                : "bg-slate-50 border border-slate-200 hover:border-indigo-300"
                            }`}
                          >
                            <span className="font-semibold text-[11px] truncate max-w-[120px]" title={st}>
                              {st}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setActiveTab("study");
                                  setQaUnitSelect(String(u.unit_number));
                                  setQaSubtopicSelect(st);
                                }}
                                title="Ask AI on this subtopic"
                                className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-[10px] font-bold cursor-pointer"
                              >
                                Ask
                              </button>
                              <button
                                onClick={() => handleSubtopicQuiz(u.unit_number, st)}
                                title="Quiz on subtopic"
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold cursor-pointer"
                              >
                                Quiz
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Sidebar Navigation Tabs */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 opacity-80">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Navigation Menu
            </h2>
            <div className="space-y-1.5">
              {[
                { id: "study", icon: Brain, label: "Study & Ask" },
                { id: "mindmap", icon: Network, label: "Mind Maps" },
                { id: "notes", icon: BookMarked, label: "Revision Notes" },
                { id: "quiz", icon: ClipboardList, label: "Take Quiz" },
                { id: "mock_exam", icon: Clock, label: "Mock Exam" },
                { id: "insights", icon: Target, label: "AI Insights" },
                { id: "history", icon: History, label: "Doubt History" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition relative cursor-pointer ${
                      isActive
                        ? isDark
                          ? "text-white font-extrabold"
                          : "text-indigo-950 font-extrabold"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarTabPill"
                        className={`absolute inset-0 rounded-2xl ${
                          isDark ? "bg-indigo-600/30 border border-indigo-500/40 shadow-sm" : "bg-blue-50 border border-blue-200 shadow-xs"
                        }`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 z-10 transition-transform ${isActive ? "scale-110 text-indigo-400" : ""}`} />
                    <span className="z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Compact Progress Pill */}
          <div className={`p-4 rounded-2xl border space-y-2 transition ${
            isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Flame className="w-4 h-4 animate-bounce" /> {gamification?.streak_days || 0} Days Streak
              </span>
              <span className="font-bold text-indigo-400">
                Level {gamification?.level || 1} ({gamification?.xp || 0} XP)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((gamification?.xp || 0) / (gamification?.next_level_xp || 100)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ─── Right Main Workspace (Focused Active View) ─── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* ═══════════════ STUDY TAB ═══════════════ */}
          {activeTab === "study" && (
            <>
              <div className={`p-6 rounded-2xl border transition-all ${isDark ? "bg-slate-900/90 border-slate-800/80 shadow-2xl text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <form onSubmit={handleAsk} className="space-y-4">
                  {/* Topic Filter Selector */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        🎯 Target Unit (Optional):
                      </label>
                      <select
                        value={qaUnitSelect}
                        onChange={(e) => {
                          setQaUnitSelect(e.target.value);
                          setQaSubtopicSelect("");
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                      >
                        <option value="">All Syllabus Units</option>
                        {units.map((u) => (
                          <option key={u.unit_number} value={u.unit_number}>
                            Unit {u.unit_number}: {u.unit_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        🔍 Specific Subtopic (Optional):
                      </label>
                      <input
                        type="text"
                        value={qaSubtopicSelect}
                        onChange={(e) => setQaSubtopicSelect(e.target.value)}
                        placeholder="e.g. Stemming, CPU Scheduling..."
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                      Ask Question from Prescribed Syllabus
                    </label>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Define Round Robin CPU Scheduling and its time quantum..."
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium ${isDark ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className={`flex items-center space-x-2 p-1 rounded-lg border text-xs font-semibold ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                      <button
                        type="button"
                        onClick={() => setMode("exam")}
                        className={`px-3 py-1.5 rounded-md transition ${
                          mode === "exam"
                            ? isDark
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white text-blue-700 shadow-sm"
                            : isDark
                            ? "text-slate-400 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        📝 Exam Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("analogy")}
                        className={`px-3 py-1.5 rounded-md transition ${
                          mode === "analogy"
                            ? isDark
                              ? "bg-amber-600 text-white shadow-sm"
                              : "bg-white text-amber-600 shadow-sm"
                            : isDark
                            ? "text-slate-400 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        💡 Analogy Mode
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Searching Textbook..." : "Ask Syllabus AI"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Beautiful Answer Card */}
              {result && (
                <div className={`rounded-2xl border overflow-hidden transition-all ${isDark ? "bg-slate-900/90 border-slate-800 shadow-2xl text-slate-100" : "bg-white border-slate-200 shadow-sm text-slate-900"}`}>
                  {/* Gradient accent bar */}
                  <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {mode === "analogy" ? "Analogy Explanation" : "Verified Answer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.citations.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200"
                          >
                            <FileText className="h-3 w-3" /> Page {c.page} · {c.source}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Markdown-rendered content with Formatted Math LaTeX */}
                    <div className="prose-custom">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(result.answer)}
                      </ReactMarkdown>
                    </div>

                    {/* Feature 7: Explain-Again Buttons */}
                    {lastQuery && (
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium">Re-explain:</span>
                        <button
                          onClick={() => handleExplainAgain("simpler")}
                          disabled={explainLoading}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition disabled:opacity-50"
                        >
                          {explainLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          🔄 Explain Simpler
                        </button>
                        <button
                          onClick={() => handleExplainAgain("detailed")}
                          disabled={explainLoading}
                          className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition disabled:opacity-50"
                        >
                          {explainLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookMarked className="h-3 w-3" />}
                          📚 More Detail
                        </button>
                      </div>
                    )}

                    {/* Source info footer */}
                    {result.unit_number && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400">
                          Sourced from Unit {result.unit_number} · Syllabus-verified response
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive RAG Vector Neural Flow Graph Visualizer */}
              {result && (
                <RAGNodeVisualizer citations={result.citations || []} query={query} isDark={isDark} />
              )}
            </>
          )}

          {/* ═══════════════ MIND MAPS TAB ═══════════════ */}
          {activeTab === "mindmap" && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <div>
                  <h3 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Network className="h-5 w-5 text-indigo-400" /> Interactive AI Mind Map
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Visual PDF syllabus hierarchy. Click concept nodes to Explain, see Examples, or Quiz yourself.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={mindMapUnit}
                    onChange={(e) => {
                      setMindMapUnit(e.target.value);
                      handleLoadMindMap(e.target.value);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  >
                    {units.map((u) => (
                      <option key={u.unit_number} value={u.unit_number}>
                        Unit {u.unit_number}: {u.unit_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLoadMindMap(mindMapUnit)}
                    disabled={mindMapLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {mindMapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {mindMapLoading ? "Generating..." : "Generate Mind Map"}
                  </button>
                </div>
              </div>

              {mindMapLoading ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Structuring syllabus topics into interactive tree...</p>
                </div>
              ) : mindMapData ? (
                <MindMapVisualizer
                  tree={mindMapData.tree}
                  onAction={handleNodeAction}
                  isDark={isDark}
                  unitNumber={mindMapData.unit_number}
                  unitName={mindMapData.unit_name}
                  isCached={mindMapData.cached}
                />
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                  Select a unit above to view its interactive AI Mind Map.
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ REVISION NOTES TAB ═══════════════ */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <div>
                  <h3 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <BookMarked className="h-5 w-5 text-blue-400" /> AI Syllabus Revision Notes
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>High-yield exam points, key definitions, formulas, and expected questions generated from PDF context.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={notesUnit}
                    onChange={(e) => {
                      setNotesUnit(e.target.value);
                      handleLoadNotes(e.target.value);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  >
                    {units.map((u) => (
                      <option key={u.unit_number} value={u.unit_number}>
                        Unit {u.unit_number}: {u.unit_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLoadNotes(notesUnit)}
                    disabled={notesLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {notesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {notesLoading ? "Generating..." : "Generate Notes"}
                  </button>
                </div>
              </div>

              {notesLoading ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Synthesizing high-yield exam revision notes...</p>
                </div>
              ) : revisionNotesData ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Unit {revisionNotesData.unit_number}: {revisionNotesData.unit_name} Revision Sheet
                    </span>
                    <div className="flex items-center gap-2">
                      {revisionNotesData.cached && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          ⚡ Instant Cached
                        </span>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(revisionNotesData.notes_markdown);
                          setCopiedNotes(true);
                          setTimeout(() => setCopiedNotes(false), 2000);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                      >
                        {copiedNotes ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedNotes ? "Copied!" : "Copy Notes"}
                      </button>
                    </div>
                  </div>

                  <div className="prose-custom">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
                      components={markdownComponents}
                    >
                      {preprocessLaTeX(revisionNotesData.notes_markdown)}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                  Select a unit to view syllabus-bound revision notes.
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ MOCK EXAM TAB ═══════════════ */}
          {activeTab === "mock_exam" && (
            <div className="space-y-6">
              {!mockExamActive && !mockExamReport && (
                <div className={`p-6 rounded-2xl border space-y-5 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                  <div className="text-center space-y-2">
                    <Clock className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
                    <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Timed AI Mock Exam Simulator</h3>
                    <p className={`text-sm max-w-md mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Simulate actual examination conditions across multiple units with live timer and per-unit score analysis.
                    </p>
                  </div>

                  <div className={`max-w-xl mx-auto space-y-4 p-5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div>
                      <label className={`block text-xs font-bold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select Examination Units:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {units.map((u) => (
                          <label key={u.unit_number} className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
                            <input
                              type="checkbox"
                              checked={mockExamSelectedUnits.includes(u.unit_number)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMockExamSelectedUnits((prev) => [...prev, u.unit_number]);
                                } else {
                                  setMockExamSelectedUnits((prev) => prev.filter((id) => id !== u.unit_number));
                                }
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Unit {u.unit_number}: {u.unit_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Duration (Minutes):</label>
                        <select
                          value={mockExamDuration}
                          onChange={(e) => setMockExamDuration(Number(e.target.value))}
                          className={`w-full border rounded-lg p-2 text-xs font-semibold outline-none ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                        >
                          <option value={10}>10 Minutes</option>
                          <option value={20}>20 Minutes</option>
                          <option value={30}>30 Minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Questions:</label>
                        <select
                          value={mockExamNumQuestions}
                          onChange={(e) => setMockExamNumQuestions(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                        >
                          <option value={10}>10 Questions</option>
                          <option value={15}>15 Questions</option>
                          <option value={20}>20 Questions</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleStartMockExam}
                      disabled={mockExamLoading || mockExamSelectedUnits.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-700 shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {mockExamLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                      {mockExamLoading ? "Generating Exam Questions..." : "Start Timed Mock Exam"}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Exam Interface */}
              {mockExamActive && mockExamData && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Timed Mock Examination</h3>
                      <p className="text-xs text-slate-500">Question {mockExamCurrentIndex + 1} of {mockExamData.questions.length}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 px-4 py-2 rounded-xl text-amber-900 font-mono font-bold text-sm">
                      <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                      Time Left: {Math.floor(mockExamTimeLeft / 60)}:{(mockExamTimeLeft % 60).toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Question Cards */}
                  {mockExamData.questions[mockExamCurrentIndex] && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Unit {mockExamData.questions[mockExamCurrentIndex].unit_number}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-2">
                          Q{mockExamCurrentIndex + 1}. {mockExamData.questions[mockExamCurrentIndex].question}
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {mockExamData.questions[mockExamCurrentIndex].options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setMockExamAnswers((prev) => ({
                                ...prev,
                                [mockExamData.questions[mockExamCurrentIndex].id]: opt,
                              }));
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                              mockExamAnswers[mockExamData.questions[mockExamCurrentIndex].id] === opt
                                ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{opt}</span>
                            {mockExamAnswers[mockExamData.questions[mockExamCurrentIndex].id] === opt && (
                              <CheckCircle2 className="h-4 w-4 text-amber-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigator Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setMockExamCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={mockExamCurrentIndex === 0}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1 overflow-x-auto max-w-xs py-1">
                      {mockExamData.questions.map((q, idx) => (
                        <button
                          key={q.id}
                          onClick={() => setMockExamCurrentIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            mockExamCurrentIndex === idx
                              ? "bg-amber-600 text-white"
                              : mockExamAnswers[q.id]
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    {mockExamCurrentIndex < mockExamData.questions.length - 1 ? (
                      <button
                        onClick={() => setMockExamCurrentIndex((prev) => prev + 1)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition cursor-pointer"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleFinalSubmitMockExam}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                      >
                        Submit Mock Exam
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* End of Exam Report */}
              {mockExamReport && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-slate-200">
                    <Trophy className={`h-12 w-12 mx-auto ${mockExamReport.passed ? "text-amber-500" : "text-slate-400"}`} />
                    <h3 className="text-xl font-bold text-slate-900">Mock Exam Results Report</h3>
                    <p className="text-sm font-semibold text-slate-600">
                      Overall Score: <span className={mockExamReport.passed ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{mockExamReport.score_percent}%</span> ({mockExamReport.correct_count} / {mockExamReport.total_questions})
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                    💡 <strong>AI Feedback:</strong> {mockExamReport.ai_feedback}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Per-Unit Performance Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mockExamReport.unit_breakdown.map((ub) => (
                        <div key={ub.unit_number} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-800">Unit {ub.unit_number}</span>
                            <p className="text-[10px] text-slate-500">{ub.correct} of {ub.total} correct</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${ub.score_percent >= 60 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                            {ub.score_percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMockExamReport(null);
                      setMockExamActive(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
                  >
                    Close Exam Report
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ QUIZ TAB ═══════════════ */}
          {activeTab === "quiz" && (

            <>
              {/* Quiz Configuration */}
              {quizzes.length === 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <div className="text-center space-y-2">
                    <HelpCircle className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900">Take a Quiz</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Test your knowledge on any unit. Select a unit, choose how many questions,
                      and challenge yourself!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end justify-center gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Unit
                      </label>
                      <select
                        value={quizUnitSelect}
                        onChange={(e) => setQuizUnitSelect(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-sm min-w-[200px]"
                      >
                        {indexedUnits.map((u) => (
                          <option key={u.unit_number} value={u.unit_number}>
                            Unit {u.unit_number} — {u.unit_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Questions
                      </label>
                      <select
                        value={quizNumQuestions}
                        onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      >
                        <option value={2}>2 questions</option>
                        <option value={5}>5 questions</option>
                        <option value={10}>10 questions</option>
                        <option value={15}>15 questions</option>
                        <option value={20}>20 questions</option>
                        <option value={25}>25 questions</option>
                        <option value={30}>30 questions</option>
                        <option value={50}>50 questions</option>
                      </select>
                    </div>
                    <button
                      onClick={handleStartQuiz}
                      disabled={quizLoading || indexedUnits.length === 0}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
                    >
                      {quizLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {quizLoading ? "Generating..." : "Start Quiz"}
                    </button>
                  </div>

                  {indexedUnits.length === 0 && (
                    <p className="text-center text-xs text-amber-600">
                      No units with indexed content available. Faculty must upload PDFs first.
                    </p>
                  )}
                </div>
              )}

              {/* Quiz Error Display */}
              {quizError && quizzes.length === 0 && !quizLoading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-3">
                  <div className="text-red-500 text-3xl">⚠️</div>
                  <p className="text-sm font-semibold text-red-700">{quizError}</p>
                  <p className="text-xs text-red-500">
                    This usually happens when the AI service is busy or rate-limited. Try again with fewer questions.
                  </p>
                  <button
                    onClick={() => { setQuizError(null); }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    Dismiss & Try Again
                  </button>
                </div>
              )}

              {/* Quiz Loading Animation */}
              {quizLoading && quizzes.length === 0 && (
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
                  <div className="flex justify-center">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Generating your quiz...</p>
                    <p className="text-xs text-slate-500 mt-1">
                      The AI is crafting {quizNumQuestions} questions from your syllabus. This may take 15-60 seconds.
                    </p>
                  </div>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {quizzes.length > 0 && (
                <div className="space-y-4">
                  {/* Quiz header */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {quizzes.length} Question Quiz
                        </p>
                        <p className="text-xs text-slate-500">
                          Unit {quizUnit} · Answer all questions then submit
                        </p>
                      </div>
                    </div>
                    {quizScore && (
                      <div className="text-right">
                        <p className={`text-lg font-bold ${quizScore.correct / quizScore.total >= 0.7 ? "text-emerald-600" : quizScore.correct / quizScore.total >= 0.4 ? "text-amber-600" : "text-red-500"}`}>
                          {quizScore.correct}/{quizScore.total}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Math.round((quizScore.correct / quizScore.total) * 100)}% score
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Questions list */}
                  {quizzes.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-800 mb-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
                          {qIndex + 1}
                        </span>
                        {q.question}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = selectedAnswers[q.question] === opt;
                          const isCorrect =
                            quizSubmitted && isSelected && opt === q.answer;
                          const isWrong =
                            quizSubmitted && isSelected && opt !== q.answer;
                          const isRevealCorrect =
                            quizSubmitted && !isSelected && opt === q.answer;

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() =>
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [q.question]: opt,
                                })
                              }
                              className={`text-left text-sm p-3 rounded-lg border-2 transition ${
                                isCorrect || isRevealCorrect
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium"
                                  : isWrong
                                  ? "bg-red-50 border-red-400 text-red-800 font-medium"
                                  : isSelected
                                  ? "bg-blue-50 border-blue-400 text-blue-800"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700"
                              }`}
                            >
                              <span className="font-semibold text-xs mr-2 opacity-60">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Submit / Results */}
                  <div className="flex items-center gap-4">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={!allAnswered}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
                      >
                        <Send className="h-4 w-4" /> Submit Quiz
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <p className="text-sm text-emerald-700 font-medium">
                          Quiz submitted! Your progress has been updated.
                        </p>
                      </div>
                    )}
                    {quizSubmitted && (
                      <button
                        onClick={() => {
                          setQuizzes([]);
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                          setQuizScore(null);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Take Another Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ AI INSIGHTS TAB ═══════════════ */}
          {activeTab === "insights" && (
            <div className="space-y-8">
              {/* 1. LEARNER OVERVIEW CARD */}
              <div className={`p-6 rounded-2xl border transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                      AI Learner Intelligence Dashboard
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Real-time topic mastery, weak-topic detection, and evidence-grounded study planner
                    </p>
                  </div>
                  <button
                    onClick={loadInsightsData}
                    disabled={insightsLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 px-3.5 py-2 rounded-xl border border-indigo-800 transition disabled:opacity-50"
                  >
                    {insightsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    {insightsLoading ? "Analyzing..." : "Refresh Intelligence"}
                  </button>
                </div>

                {insightsLoading && !insightsData ? (
                  <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                    <p className={`text-sm mt-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Extracting syllabus subtopics & computing student performance...</p>
                  </div>
                ) : !insightsData?.overview?.has_sufficient_data || insightsData?.is_new_learner ? (
                  /* Insufficient Data / New Learner State */
                  <div className={`p-6 rounded-xl border text-center space-y-3 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-200">No Sufficient Learning Data Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {insightsData?.new_learner_message || "You have not completed enough assessments for topic-level mastery estimation. Start with a short diagnostic quiz to personalize your study plan."}
                    </p>
                    <button
                      onClick={() => handleSubtopicQuiz(indexedUnits[0]?.unit_number || 1, "Diagnostic Quiz")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-500/20"
                    >
                      <Zap className="h-3.5 w-3.5" /> Take Diagnostic Micro-Quiz
                    </button>
                  </div>
                ) : (
                  /* Overview Metrics Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {/* Overall Mastery Ring */}
                    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <div className="relative w-14 h-14 mb-2">
                        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="3.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                            stroke={insightsData.overview.overall_mastery >= 70 ? "#10b981" : insightsData.overview.overall_mastery >= 40 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="3.5" strokeDasharray={`${insightsData.overview.overall_mastery}, 100`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold">{insightsData.overview.overall_mastery}%</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Mastery</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-2xl font-extrabold text-blue-400">{insightsData.overview.total_attempts}</span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Quiz Sessions</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-2xl font-extrabold text-indigo-400">{insightsData.overview.questions_answered}</span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Questions</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <span className="text-2xl font-extrabold text-emerald-400">{insightsData.overview.correct_answers}</span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Correct</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-red-950/30 border-red-900/50" : "bg-red-50 border-red-100"}`}>
                      <span className="text-2xl font-extrabold text-red-400">{insightsData.overview.weak_count}</span>
                      <span className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider mt-1">Weak Topics</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-100"}`}>
                      <span className="text-2xl font-extrabold text-emerald-400">{insightsData.overview.strong_count}</span>
                      <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider mt-1">Strong Topics</span>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${isDark ? "bg-purple-950/30 border-purple-900/50" : "bg-purple-50 border-purple-100"}`}>
                      <span className="text-2xl font-extrabold text-purple-400">{insightsData.overview.xp} <span className="text-xs text-purple-300">XP</span></span>
                      <span className="text-[11px] font-semibold text-purple-400/80 uppercase tracking-wider mt-1">🔥 {insightsData.overview.streak_days} Day Streak</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CONTEXTUAL RECOMMENDATION CARDS (5 CARDS) */}
              {insightsData?.recommendations && insightsData.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> Evidence-Based Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {insightsData.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-indigo-500/50 ${
                          rec.type === "focus_next" ? "bg-indigo-950/40 border-indigo-800/80 text-indigo-200" :
                          rec.type === "review" ? "bg-red-950/30 border-red-900/60 text-red-200" :
                          rec.type === "practice" ? "bg-amber-950/30 border-amber-900/60 text-amber-200" :
                          rec.type === "maintain" ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-200" :
                          "bg-purple-950/30 border-purple-900/60 text-purple-200"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-75">{rec.title}</span>
                          <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{rec.topic}</h4>
                          <p className="text-xs mt-2 leading-relaxed opacity-90">{rec.evidence_why}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          {rec.action_type === "quiz" && (
                            <button
                              onClick={() => handleSubtopicQuiz(rec.unit_number || 1, rec.topic)}
                              className="w-full text-center text-xs font-bold py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
                            >
                              Quiz Me →
                            </button>
                          )}
                          {rec.action_type === "explain" && (
                            <button
                              onClick={() => handleExplainTopic(rec.topic, rec.unit_number || 1)}
                              className="w-full text-center text-xs font-bold py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow"
                            >
                              Explain with AI →
                            </button>
                          )}
                          {rec.action_type === "study" && (
                            <button
                              onClick={() => {
                                setActiveTab("qa");
                                setQaSubtopicSelect(rec.topic);
                              }}
                              className="w-full text-center text-xs font-bold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
                            >
                              Study Topic →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. WEAK TOPICS DETECTED CARDS */}
              {insightsData?.weak_topics && insightsData.weak_topics.length > 0 && (
                <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" /> Weak Topics Detected ({insightsData.weak_topics.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insightsData.weak_topics.map((wt, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-slate-950/80 border-red-900/40" : "bg-red-50/50 border-red-200"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                              Unit {wt.unit_number}
                            </span>
                            <h4 className="text-base font-bold text-white mt-1">{wt.topic}</h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white shadow-sm">
                            {wt.mastery_percent}% Mastery
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800">
                          <div>Attempts: <span className="font-bold text-slate-200">{wt.total_attempts}</span></div>
                          <div>Correct: <span className="font-bold text-slate-200">{wt.correct_count}</span></div>
                          <div>Priority: <span className="font-bold text-red-400">{wt.priority}</span></div>
                        </div>

                        <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                          "{wt.why_evidence}"
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setActiveTab("qa");
                              setQaSubtopicSelect(wt.topic);
                            }}
                            className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition"
                          >
                            Study Topic
                          </button>
                          <button
                            onClick={() => handleExplainTopic(wt.topic, wt.unit_number)}
                            className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 text-center transition"
                          >
                            Explain
                          </button>
                          <button
                            onClick={() => handleSubtopicQuiz(wt.unit_number, wt.topic)}
                            className="flex-1 py-1.5 px-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white text-center transition shadow"
                          >
                            Quiz Me
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. TOPIC-LEVEL MASTERY GRID */}
              {insightsData?.topic_mastery_list && (
                <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-400" /> Syllabus Topic Mastery Breakdown
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Syllabus-extracted topics and deterministic attempt-based accuracy</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {insightsData.topic_mastery_list.map((tm, idx) => (
                      <div key={idx} className={`p-3.5 rounded-xl border flex flex-col justify-between ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-400">Unit {tm.unit_number}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tm.status === "WEAK" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                              tm.status === "DEVELOPING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              tm.status === "STRONG" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                              tm.status === "MASTERED" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                              "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {tm.status.replace("_", " ")}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100">{tm.topic}</h4>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Accuracy</span>
                            <span className="font-bold text-slate-200">{tm.status === "INSUFFICIENT_DATA" ? "N/A" : `${tm.mastery_percent}%`}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                tm.mastery_percent >= 70 ? "bg-emerald-500" :
                                tm.mastery_percent >= 50 ? "bg-amber-500" :
                                tm.mastery_percent > 0 ? "bg-red-500" : "bg-slate-700"
                              }`}
                              style={{ width: `${tm.status === "INSUFFICIENT_DATA" ? 0 : tm.mastery_percent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>{tm.total_attempts} attempts ({tm.correct_count} correct)</span>
                            <button
                              onClick={() => handleSubtopicQuiz(tm.unit_number, tm.topic)}
                              className="text-indigo-400 hover:underline font-bold"
                            >
                              Quiz Me
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. REDESIGNED ADAPTIVE STUDY PLAN */}
              <div className={`p-6 rounded-2xl border space-y-4 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                    <Calendar className="h-4 w-4 text-indigo-500" /> Topic-Level Adaptive Study Plan
                  </h3>
                </div>

                <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border bg-slate-950/60 border-slate-800">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>Target Exam Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm outline-none ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>Units to Cover</label>
                    <div className="flex flex-wrap gap-1.5">
                      {indexedUnits.map((u) => (
                        <label key={u.unit_number} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"}`}>
                          <input
                            type="checkbox"
                            checked={selectedPlanUnits.includes(u.unit_number)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlanUnits([...selectedPlanUnits, u.unit_number]);
                              } else {
                                setSelectedPlanUnits(selectedPlanUnits.filter(n => n !== u.unit_number));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600"
                          />
                          <span>Unit {u.unit_number}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateStudyPlan}
                    disabled={studyPlanLoading || !examDate || selectedPlanUnits.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-600/20"
                  >
                    {studyPlanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                    {studyPlanLoading ? "Generating..." : "Generate Adaptive Plan"}
                  </button>
                </div>

                {studyPlan && (
                  <div className="space-y-4 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-200">
                        📅 {studyPlan.total_days}-Day Adaptive Schedule (Exam: {studyPlan.exam_date})
                      </p>
                    </div>

                    {/* AI Grounded Advice */}
                    <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-800 text-indigo-200">
                      <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Grounded Syllabus Study Tip
                      </p>
                      <p className="text-sm text-indigo-100 leading-relaxed">{studyPlan.ai_advice}</p>
                    </div>

                    {/* Plan Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {studyPlan.plan.map((day) => (
                        <div
                          key={day.day}
                          className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                            day.priority === "HIGH" ? "bg-red-950/20 border-red-900/50" :
                            day.priority === "MEDIUM" ? "bg-amber-950/20 border-amber-900/50" :
                            "bg-emerald-950/20 border-emerald-900/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 font-bold text-slate-200 text-xs flex-shrink-0">
                                D{day.day}
                              </span>
                              <div>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  Unit {day.unit_number} · {day.date}
                                </span>
                                <h4 className="text-sm font-bold text-white line-clamp-1">{day.topic}</h4>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              day.priority === "HIGH" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                              day.priority === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {day.priority} PRIORITY
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800">
                            <span>Activity: <strong className="text-white">{day.activity}</strong></span>
                            <span>Duration: <strong className="text-indigo-400">{day.duration_minutes} min</strong></span>
                          </div>

                          {day.why_evidence && (
                            <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-800/80">
                              "{day.why_evidence}"
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setActiveTab("qa");
                                setQaSubtopicSelect(day.topic);
                              }}
                              className="flex-1 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition"
                            >
                              Study
                            </button>
                            <button
                              onClick={() => handleExplainTopic(day.topic, day.unit_number)}
                              className="flex-1 py-1 text-[11px] font-semibold rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 text-center transition"
                            >
                              Explain
                            </button>
                            <button
                              onClick={() => handleSubtopicQuiz(day.unit_number, day.topic)}
                              className="flex-1 py-1 text-[11px] font-bold rounded bg-indigo-600 hover:bg-indigo-500 text-white text-center transition shadow"
                            >
                              Quiz Me
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6. AI UNIT SUMMARIES */}
              <div className={`p-6 rounded-2xl border space-y-4 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  <BookMarked className="h-4 w-4 text-emerald-500" /> AI Unit Summaries
                </h3>

                <div className="flex flex-wrap gap-2">
                  {indexedUnits.map((u) => (
                    <button
                      key={u.unit_number}
                      onClick={() => handleLoadSummary(u.unit_number)}
                      disabled={summaryLoading}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        summaryUnit === u.unit_number
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : isDark
                          ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Unit {u.unit_number}: {u.unit_name}
                    </button>
                  ))}
                </div>

                {summaryLoading && (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
                    <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Generating AI summary...</p>
                  </div>
                )}

                {unitSummary && !summaryLoading && (
                  <div className={`p-5 rounded-xl border ${isDark ? "bg-emerald-950/30 border-emerald-800 text-slate-100" : "bg-emerald-50/50 border-emerald-200 text-slate-900"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <BookMarked className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-400">
                        Unit {unitSummary.unit_number}: {unitSummary.unit_name}
                        {unitSummary.cached && <span className="ml-2 text-[10px] text-slate-400">(cached)</span>}
                      </span>
                    </div>
                    <div className="prose-custom">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(unitSummary.summary)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ═══════════════ DOUBT HISTORY TAB ═══════════════ */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className={`p-6 rounded-2xl border space-y-4 transition-all ${isDark ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl" : "bg-white border-slate-200 text-slate-900 shadow-sm"}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                    <History className="h-4 w-4 text-purple-500" /> Doubt History
                  </h3>
                  <button
                    onClick={() => loadDoubtHistory(doubtSearch)}
                    disabled={doubtLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition disabled:opacity-50"
                  >
                    {doubtLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Refresh
                  </button>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={doubtSearch}
                      onChange={(e) => setDoubtSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadDoubtHistory(doubtSearch)}
                      placeholder="Search your past questions..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none ${isDark ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}`}
                    />
                  </div>
                  <button
                    onClick={() => loadDoubtHistory(doubtSearch)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    Search
                  </button>
                </div>

                {doubtLoading && (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">Loading history...</p>
                  </div>
                )}

                {doubtHistory && !doubtLoading && (
                  <>
                    <p className="text-xs text-slate-400">{doubtHistory.total} question(s) found</p>
                    {doubtHistory.items.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No questions asked yet. Go to "Study & Ask" to start!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {doubtHistory.items.map((d) => (
                          <div key={d.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                            <button
                              onClick={() => setExpandedDoubt(expandedDoubt === d.id ? null : d.id)}
                              className="w-full text-left p-4 hover:bg-slate-100 transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{d.query}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      d.mode === "analogy" ? "bg-amber-100 text-amber-700" :
                                      d.mode === "simpler" ? "bg-yellow-100 text-yellow-700" :
                                      d.mode === "detailed" ? "bg-purple-100 text-purple-700" :
                                      "bg-blue-100 text-blue-700"
                                    }`}>
                                      {d.mode}
                                    </span>
                                    {d.unit_number && (
                                      <span className="text-[10px] text-slate-400">Unit {d.unit_number}</span>
                                    )}
                                    <span className="text-[10px] text-slate-400">{d.created_at}</span>
                                  </div>
                                </div>
                                {expandedDoubt === d.id
                                  ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                  : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                }
                              </div>
                            </button>
                            {expandedDoubt === d.id && (
                              <div className="px-4 pb-4 border-t border-slate-200">
                                <div className="pt-3 prose-custom">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {d.answer}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mind Map Node Action Modal */}
      <NodeActionPanel
        modal={nodeModal}
        onClose={() => setNodeModal((prev) => ({ ...prev, isOpen: false }))}
        isDark={isDark}
        markdownComponents={markdownComponents}
        onAskSubmit={handleNodeAskSubmit}
      />
    </div>
  );
}

