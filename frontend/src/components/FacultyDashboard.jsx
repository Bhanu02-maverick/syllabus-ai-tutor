import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  UploadCloud,
  BarChart3,
  FileQuestion,
  LogOut,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  History,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  Check,
  Copy,
  BookOpen,
  Award,
  Zap,
  Users,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { api } from "../api";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { id: "ingest", icon: UploadCloud, label: "Upload PDFs", hint: "Index syllabus material" },
  { id: "qbank", icon: FileQuestion, label: "Question Generator", hint: "Build assignments with AI" },
  { id: "analytics", icon: BarChart3, label: "Analytics", hint: "Cohort performance" },
  { id: "versions", icon: History, label: "Versions & Units", hint: "Manage units and PDF history" },
];

// Soft ambient background: two slowly drifting glows over a faded dot grid.
function FacultyBackdrop({ isDark }) {
  const reduceMotion = useReducedMotion();
  const drift = (x, y) =>
    reduceMotion
      ? {}
      : {
          animate: { x: [0, x, 0], y: [0, y, 0] },
          transition: { duration: 24, repeat: Infinity, ease: "easeInOut" },
        };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        {...drift(60, 40)}
        className={`absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl ${
          isDark ? "bg-indigo-600/20" : "bg-indigo-300/30"
        }`}
      />
      <motion.div
        {...drift(-50, -30)}
        className={`absolute -bottom-48 -right-24 w-[620px] h-[620px] rounded-full blur-3xl ${
          isDark ? "bg-purple-700/15" : "bg-sky-200/40"
        }`}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${isDark ? "rgba(148,163,184,0.10)" : "rgba(99,102,241,0.10)"} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}

export default function FacultyDashboard({ user, onLogout }) {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("vce_faculty_theme") !== "false";
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("vce_faculty_theme", String(next));
      return next;
    });
  };

  // ─── Browser History Synchronization for Faculty Deck ───────────────
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    const validTabs = ["ingest", "qbank", "analytics", "versions"];
    return validTabs.includes(hash) ? hash : "ingest";
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = useCallback((newTab, pushState = true) => {
    setActiveTabState(newTab);
    if (pushState && window.history) {
      const currentHash = window.location.hash.replace("#", "").toLowerCase();
      if (currentHash !== newTab) {
        window.history.pushState({ tab: newTab }, "", `#${newTab}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!window.history.state || !window.history.state.tab) {
      const currentHash = window.location.hash.replace("#", "").toLowerCase();
      const initial = currentHash || activeTab;
      window.history.replaceState({ tab: initial }, "", `#${initial}`);
    }

    const handlePopState = (event) => {
      const stateTab = event.state?.tab;
      const hashTab = window.location.hash.replace("#", "").toLowerCase();
      const targetTab = stateTab || hashTab || "ingest";
      const validTabs = ["ingest", "qbank", "analytics", "versions"];
      if (validTabs.includes(targetTab)) {
        setActiveTabState(targetTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  // Core data states
  const [units, setUnits] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);

  // Upload form state
  const [uploadUnitChoice, setUploadUnitChoice] = useState("__new__");
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // Standalone "create unit" form state
  const [manualUnitNumber, setManualUnitNumber] = useState("");
  const [manualUnitName, setManualUnitName] = useState("");
  const [creatingUnit, setCreatingUnit] = useState(false);

  // Question bank state
  const [qbUnit, setQbUnit] = useState(null);
  const [qbDifficulty, setQbDifficulty] = useState("medium");
  const [qbCount, setQbCount] = useState(5);
  const [qbType, setQbType] = useState("mcq");
  const [qbLoading, setQbLoading] = useState(false);
  const [qbResult, setQbResult] = useState(null);
  const [copiedAssignment, setCopiedAssignment] = useState(false);

  // PDF Version management
  const [versionUnit, setVersionUnit] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Expanded analytics unit
  const [expandedAnalytics, setExpandedAnalytics] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [unitList, docs, stats] = await Promise.all([
        api.getUnits().catch(() => []),
        api.facultyDocuments().catch(() => []),
        api.facultyAnalytics().catch(() => []),
      ]);
      setUnits(Array.isArray(unitList) ? unitList : []);
      setDocuments(Array.isArray(docs) ? docs : []);
      setAnalytics(Array.isArray(stats) ? stats : []);
      if (Array.isArray(unitList) && unitList.length > 0 && qbUnit === null) {
        setQbUnit(unitList[0].unit_number);
      }
    } catch (err) {
      console.error(err);
    }
  }, [qbUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    setCreatingUnit(true);
    try {
      await api.createUnit(
        manualUnitNumber ? Number(manualUnitNumber) : null,
        manualUnitName || null
      );
      setManualUnitNumber("");
      setManualUnitName("");
      loadData();
    } catch (err) {
      alert(err.message || "Could not create unit.");
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitNumber) => {
    if (!confirm(`Delete Unit ${unitNumber} and all its documents? This cannot be undone.`)) return;
    try {
      await api.deleteUnit(unitNumber);
      loadData();
    } catch (err) {
      alert(err.message || "Could not delete unit.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const isNewUnit = uploadUnitChoice === "__new__";
      const unitNumber = isNewUnit ? (newUnitNumber ? Number(newUnitNumber) : null) : Number(uploadUnitChoice);
      const unitName = isNewUnit ? (newUnitName || null) : null;

      const res = await api.facultyUpload(uploadFile, unitNumber, unitName);
      setUploadMsg({
        type: "success",
        text: `Indexed "${res.filename}" into Unit ${res.unit_number} — ${res.unit_name} (${res.chunk_count} chunks).`,
      });
      setUploadFile(null);
      setNewUnitNumber("");
      setNewUnitName("");
      loadData();
    } catch (err) {
      setUploadMsg({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!qbUnit) return;
    setQbLoading(true);
    setQbResult(null);
    try {
      const res = await api.generateQuestionBank(qbUnit, qbDifficulty, qbCount, qbType);
      setQbResult(res);
    } catch (err) {
      alert(err.message || "Could not generate question bank. Make sure that unit has been uploaded.");
    } finally {
      setQbLoading(false);
    }
  };

  const handleDownloadAssignment = () => {
    if (!qbResult) return;
    let text = `Assignment — ${qbResult.unit_name}\nUnit ${qbResult.unit_number}\n${"=".repeat(50)}\n\n`;
    qbResult.questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`;
      if (q.options) {
        q.options.forEach((opt, oi) => {
          text += `   ${String.fromCharCode(65 + oi)}. ${opt}\n`;
        });
      }
      if (q.model_answer) {
        text += `   Model Answer: ${q.model_answer}\n`;
      }
      if (q.answer && q.options) {
        text += `   Correct: ${q.answer}\n`;
      }
      text += "\n";
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Assignment_Unit${qbResult.unit_number}_${qbResult.unit_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAssignment = () => {
    if (!qbResult) return;
    let text = `Assignment — ${qbResult.unit_name} (Unit ${qbResult.unit_number})\n\n`;
    qbResult.questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question}\n`;
      if (q.options) {
        q.options.forEach((opt, oi) => {
          text += `   ${String.fromCharCode(65 + oi)}. ${opt}\n`;
        });
      }
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    setCopiedAssignment(true);
    setTimeout(() => setCopiedAssignment(false), 2000);
  };

  const loadEnhancedAnalytics = async () => {
    setEnhancedLoading(true);
    try {
      const data = await api.facultyEnhancedAnalytics();
      setEnhancedAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancedLoading(false);
    }
  };

  const loadVersions = async (unitNumber) => {
    if (versionUnit === unitNumber) {
      setVersionUnit(null);
      return;
    }
    setVersionUnit(unitNumber);
    setVersionsLoading(true);
    try {
      const data = await api.getDocumentVersions(unitNumber);
      setVersions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleActivateVersion = async (docId) => {
    try {
      await api.activateDocumentVersion(docId);
      if (versionUnit) loadVersions(versionUnit);
      loadData();
    } catch (err) {
      alert(err.message || "Could not activate version.");
    }
  };

  const handleDeleteVersion = async (docId) => {
    if (!confirm("Delete this document version?")) return;
    try {
      await api.deleteDocumentVersion(docId);
      if (versionUnit) {
        const data = await api.getDocumentVersions(versionUnit);
        setVersions(data);
      }
      loadData();
    } catch (err) {
      alert(err.message || "Could not delete version.");
    }
  };

  // Compute stats summary metrics
  const totalUnits = units.length;
  const indexedDocs = documents.filter((d) => d.status === "indexed").length;
  const totalStudentsAttempted = analytics.reduce((acc, curr) => acc + (curr.students_attempted || 0), 0);
  const overallAvgMastery =
    analytics.length > 0
      ? Math.round(analytics.reduce((acc, curr) => acc + (curr.average_score_percent || 0), 0) / analytics.length)
      : 0;

  const panelClass = isDark
    ? "bg-slate-900/60 border-white/[0.06] backdrop-blur-xl"
    : "bg-white/80 border-slate-200/80 backdrop-blur-xl";
  const dividerClass = isDark ? "border-white/[0.06]" : "border-slate-200";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const initials = (user.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const activeNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const overviewStats = [
    { label: "Syllabus units", value: totalUnits, hint: "Indexed course units", icon: BookOpen, tint: "text-indigo-400 bg-indigo-500/10" },
    { label: "Indexed PDFs", value: indexedDocs, hint: "Active textbook documents", icon: FileText, tint: "text-cyan-400 bg-cyan-500/10" },
    { label: "Cohort mastery", value: `${overallAvgMastery}%`, hint: "Class average accuracy", icon: Award, tint: "text-emerald-400 bg-emerald-500/10", progress: overallAvgMastery },
    { label: "Student activity", value: totalStudentsAttempted, hint: "Total quiz attempts", icon: Users, tint: "text-purple-400 bg-purple-500/10" },
  ];

  const navButtonClass = (isActive) =>
    `relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
      isActive
        ? isDark ? "text-white" : "text-indigo-950"
        : isDark ? "text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]" : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/[0.03]"
    }`;

  const historyButtonClass = `p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
    isDark
      ? "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.08] hover:text-white"
      : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900"
  }`;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 relative ${
      isDark ? "bg-[#070B16] text-slate-100" : "bg-[#F5F7FB] text-slate-800"
    }`}>
      <FacultyBackdrop isDark={isDark} />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar (desktop) */}
        <aside className={`hidden lg:flex w-64 shrink-0 sticky top-0 h-screen flex-col gap-6 p-5 border-r backdrop-blur-xl ${
          isDark ? "bg-slate-950/50 border-white/[0.06]" : "bg-white/60 border-slate-200/80"
        }`}>
          <div className="flex items-center gap-3 px-1">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
            >
              <Briefcase className="h-5 w-5" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold tracking-tight leading-tight">Faculty Studio</p>
              <p className="text-[11px] opacity-50 truncate">Syllabus AI Tutor</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] opacity-40">Workspace</p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={navButtonClass(isActive)}>
                  {isActive && (
                    <motion.span
                      layoutId="facultyNavActive"
                      className={`absolute inset-0 rounded-xl border ${
                        isDark ? "bg-indigo-500/15 border-indigo-400/20" : "bg-indigo-50 border-indigo-100"
                      }`}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="facultyNavBar"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-blue-500 to-purple-500"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className={`relative w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : ""}`} />
                  <span className="relative min-w-0">
                    <span className="block leading-tight">{item.label}</span>
                    <span className="block text-[11px] font-medium opacity-50 truncate">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
              isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/80 border-slate-200"
            }`}>
              <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Prof. {user.name}</p>
                <p className="text-[11px] opacity-50 truncate">{user.subject_name || "Faculty"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLogout}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </motion.button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar (mobile & tablet) */}
          <header className={`lg:hidden sticky top-0 z-20 border-b backdrop-blur-xl ${
            isDark ? "bg-slate-950/70 border-white/[0.06]" : "bg-white/80 border-slate-200/80"
          }`}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white">
                  <Briefcase className="h-4 w-4" />
                </div>
                <p className="text-sm font-extrabold tracking-tight truncate">Faculty Studio</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className={`p-2 rounded-xl border cursor-pointer ${
                    isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-600"
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
            <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                      isActive ? (isDark ? "text-white" : "text-indigo-950") : "opacity-60"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="facultyMobileNavActive"
                        className={`absolute inset-0 rounded-lg ${isDark ? "bg-indigo-500/20" : "bg-indigo-50"}`}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className="relative w-3.5 h-3.5" />
                    <span className="relative">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
            {/* Overview header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-wrap items-end justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold opacity-50">{todayLabel}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {greeting},{" "}
                  <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Prof. {user.name}
                  </span>
                </h1>
                <p className="text-sm opacity-60">
                  {user.subject_name ? `${user.subject_name} · ` : ""}Here's how your course is doing.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <button onClick={() => window.history.back()} title="Go Back (Browser History)" className={historyButtonClass}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => window.history.forward()} title="Go Forward (Browser History)" className={historyButtonClass}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* Overview metrics */}
            <motion.div
              className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
            >
              {overviewStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -2 }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-shadow hover:shadow-lg ${panelClass}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold opacity-50 uppercase tracking-wider">{stat.label}</span>
                      <span className={`p-1.5 rounded-lg ${stat.tint}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight">{stat.value}</div>
                    {stat.progress !== undefined ? (
                      <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}>
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] opacity-50 mt-1">{stat.hint}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="flex items-center gap-2 pt-2">
              <activeNav.icon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold">{activeNav.label}</h2>
              <span className="text-xs opacity-40">· {activeNav.hint}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
        {/* ═══════════════ TAB 1: PDF INGESTION & SYLLABUS ═══════════════ */}
        {activeTab === "ingest" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ${panelClass}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${dividerClass}`}>
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ingest Syllabus & Textbook PDF</h3>
                  <p className="text-xs opacity-60">Upload course PDFs for RAG chunking and Gemini AI Q&A</p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Target Syllabus Unit</label>
                  <select
                    value={uploadUnitChoice}
                    onChange={(e) => setUploadUnitChoice(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="__new__">+ Create a new unit for this PDF</option>
                    {units.map((u) => (
                      <option key={u.unit_number} value={u.unit_number}>
                        Unit {u.unit_number} — {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>

                {uploadUnitChoice === "__new__" && (
                  <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80">
                        Unit Number <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={newUnitNumber}
                        onChange={(e) => setNewUnitNumber(e.target.value)}
                        placeholder="auto"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-800"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80">
                        Unit Name <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="auto-detect from PDF"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-800"
                        }`}
                      />
                    </div>
                    <p className="col-span-2 text-[11px] opacity-60">
                      Leave blank and Gemini will auto-assign the unit number and suggest a title from the opening pages.
                    </p>
                  </div>
                )}

                {/* Drag & Drop Style File Picker */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Select PDF File</label>
                  <div className={`p-6 rounded-2xl border-2 border-dashed text-center transition ${
                    isDark
                      ? "bg-slate-950/40 border-indigo-500/30 hover:border-indigo-500/60"
                      : "bg-slate-50 border-indigo-200 hover:border-indigo-400"
                  }`}>
                    <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                    {uploadFile && (
                      <p className="text-xs font-bold text-indigo-400 mt-2">Selected: {uploadFile.name}</p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {uploading ? "Indexing ChromaDB Vector Chunks..." : "Upload & Index Syllabus PDF"}
                </motion.button>

                {uploadMsg && (
                  <p className={`text-xs p-3 rounded-xl border flex items-center gap-2 ${
                    uploadMsg.type === "success"
                      ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
                      : "bg-rose-950/60 border-rose-800/60 text-rose-400"
                  }`}>
                    {uploadMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {uploadMsg.text}
                  </p>
                )}
              </form>
            </div>

            {/* Indexed Documents Status List */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ${panelClass}`}>
              <div className={`flex items-center justify-between pb-3 border-b ${dividerClass}`}>
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold">Indexed Course Documents ({documents.length})</h3>
                </div>
                <button
                  onClick={loadData}
                  className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Refresh Status
                </button>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {documents.length === 0 && (
                  <div className="text-center py-12 opacity-50 space-y-2">
                    <FileText className="w-10 h-10 mx-auto" />
                    <p className="text-xs font-semibold">No PDF documents indexed yet.</p>
                  </div>
                )}
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                      isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{d.filename}</p>
                        <p className="text-[11px] opacity-60">Unit {d.unit_number}: {d.unit_name}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        d.status === "indexed"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                          : d.status === "processing"
                          ? "bg-amber-950/60 text-amber-400 border-amber-800"
                          : "bg-rose-950/60 text-rose-400 border-rose-800"
                      }`}
                    >
                      {d.status === "indexed" ? "✓ Indexed" : d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 2: AI QUESTION BANK GENERATOR ═══════════════ */}
        {activeTab === "qbank" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ${panelClass}`}>
              <div className={`flex items-center justify-between pb-3 border-b ${dividerClass}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">AI Assignment & Question Bank Generator</h3>
                    <p className="text-xs opacity-60">Generate targeted exam questions from PDF textbook vectors</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGenerateQuestions} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">Target Unit</label>
                  <select
                    value={qbUnit ?? ""}
                    onChange={(e) => setQbUnit(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    {units.map((u) => (
                      <option key={u.unit_number} value={u.unit_number}>
                        Unit {u.unit_number} — {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">Difficulty Level</label>
                  <select
                    value={qbDifficulty}
                    onChange={(e) => setQbDifficulty(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Advanced Analysis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80">Question Format</label>
                  <select
                    value={qbType}
                    onChange={(e) => setQbType(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                      isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="short_answer">Short Answer Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 opacity-80"># Questions</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={qbCount}
                      onChange={(e) => setQbCount(Number(e.target.value))}
                      className={`w-20 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                        isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={qbLoading || !qbUnit}
                      className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {qbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {qbLoading ? "Generating..." : "Generate"}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>

            {/* Generated Question Bank Display */}
            {qbResult && (
              <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ${panelClass}`}>
                <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${dividerClass}`}>
                  <div>
                    <h4 className="text-base font-bold">
                      Generated Assignment: Unit {qbResult.unit_number} — {qbResult.unit_name}
                    </h4>
                    <p className="text-xs opacity-60">
                      Format: {qbType.toUpperCase()} · Difficulty: {qbDifficulty.toUpperCase()} · {qbResult.questions.length} Questions
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAssignment}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer ${
                        copiedAssignment
                          ? "bg-emerald-950/80 border-emerald-800 text-emerald-400"
                          : isDark
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {copiedAssignment ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedAssignment ? "Copied!" : "Copy Text"}
                    </button>

                    <button
                      onClick={handleDownloadAssignment}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download (.txt)
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {qbResult.questions.map((q, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border space-y-2 text-xs transition ${
                        isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <p className="font-bold text-sm">
                        Q{i + 1}. {q.question}
                      </p>
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oi) => (
                            <div
                              key={oi}
                              className={`p-2.5 rounded-xl border font-semibold text-xs ${
                                opt === q.answer
                                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                                  : isDark
                                  ? "bg-slate-900 border-slate-800 text-slate-300"
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              <span className="opacity-60 mr-2">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.model_answer && (
                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 mt-2">
                          <span className="font-bold">Model Answer: </span>
                          {q.model_answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB 3: CLASSROOM ANALYTICS ═══════════════ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ${panelClass}`}>
              <div className={`flex items-center justify-between pb-3 border-b ${dividerClass}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Classroom Mastery Analytics & Cohort Insights</h3>
                    <p className="text-xs opacity-60">Track unit performance, average student scores, and cohort weak areas</p>
                  </div>
                </div>

                <button
                  onClick={loadEnhancedAnalytics}
                  disabled={enhancedLoading}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {enhancedLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {enhancedLoading ? "Analyzing..." : "Analyze Weak Topics"}
                </button>
              </div>

              <div className="space-y-4">
                {analytics.length === 0 && <p className="text-xs opacity-50 italic py-6 text-center">No student attempt data collected yet.</p>}
                {analytics.map((a) => {
                  const enhanced = enhancedAnalytics?.find((e) => e.unit_number === a.unit_number);
                  return (
                    <div
                      key={a.unit_number}
                      className={`p-4 rounded-2xl border transition ${
                        isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedAnalytics(expandedAnalytics === a.unit_number ? null : a.unit_number)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs font-bold mb-2">
                          <span className="flex items-center gap-2">
                            {enhanced && enhanced.difficult_topics.length > 0 && (
                              expandedAnalytics === a.unit_number
                                ? <ChevronDown className="w-4 h-4 text-indigo-400" />
                                : <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            Unit {a.unit_number}: {a.unit_name}
                          </span>
                          <span className="text-xs">
                            {a.average_score_percent}% average score ({a.students_attempted} student attempts)
                          </span>
                        </div>
                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              a.average_score_percent >= 70
                                ? "bg-emerald-500"
                                : a.average_score_percent >= 40
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${a.average_score_percent}%` }}
                          />
                        </div>
                      </button>

                      {/* Expanded: Difficult Topics */}
                      {expandedAnalytics === a.unit_number && enhanced && enhanced.difficult_topics.length > 0 && (
                        <div className={`mt-4 pt-3 border-t space-y-2 ${dividerClass}`}>
                          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                            Most Challenging Concepts for Students
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {enhanced.difficult_topics.map((dt, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                                }`}
                              >
                                <span className="font-semibold truncate max-w-[160px]">{dt.topic}</span>
                                <span className={`font-bold text-xs ${
                                  dt.accuracy_percent < 40 ? "text-rose-400" : "text-amber-400"
                                }`}>
                                  {dt.accuracy_percent}% accuracy
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 4: VERSION CONTROL & UNITS MANAGER ═══════════════ */}
        {activeTab === "versions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standalone Unit Manager */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ${panelClass}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${dividerClass}`}>
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Manage Syllabus Units</h3>
                  <p className="text-xs opacity-60">Add manual syllabus units or remove obsolete units</p>
                </div>
              </div>

              <form onSubmit={handleCreateUnit} className="flex gap-2">
                <input
                  type="number"
                  value={manualUnitNumber}
                  onChange={(e) => setManualUnitNumber(e.target.value)}
                  placeholder="# (auto)"
                  className={`w-20 px-3 py-2.5 rounded-xl text-xs border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
                <input
                  type="text"
                  value={manualUnitName}
                  onChange={(e) => setManualUnitName(e.target.value)}
                  placeholder="Unit name (e.g. Natural Language Processing)"
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  disabled={creatingUnit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  Add Unit
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {units.map((u) => (
                  <div
                    key={u.unit_number}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="font-bold">Unit {u.unit_number}: {u.unit_name}</span>
                    <button
                      onClick={() => handleDeleteUnit(u.unit_number)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title={`Delete Unit ${u.unit_number}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF Version Control */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ${panelClass}`}>
              <div className={`flex items-center gap-3 pb-3 border-b ${dividerClass}`}>
                <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">PDF Version Control</h3>
                  <p className="text-xs opacity-60">Select a unit to view document history and activate version revisions</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {units.map((u) => (
                  <button
                    key={u.unit_number}
                    onClick={() => loadVersions(u.unit_number)}
                    disabled={versionsLoading}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      versionUnit === u.unit_number
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                        : isDark
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Unit {u.unit_number}
                  </button>
                ))}
              </div>

              {versionsLoading && (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                </div>
              )}

              {versionUnit && !versionsLoading && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {versions.length === 0 ? (
                    <p className="text-xs opacity-50 italic py-4">No document history for this unit.</p>
                  ) : (
                    versions.map((v) => (
                      <div
                        key={v.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          v.is_active
                            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                            : isDark
                            ? "bg-slate-950/60 border-slate-800"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{v.filename} (v{v.version})</p>
                          <p className="text-[10px] opacity-60">{v.uploaded_at} · {v.chunk_count} chunks</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!v.is_active && (
                            <>
                              <button
                                onClick={() => handleActivateVersion(v.id)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => handleDeleteVersion(v.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {v.is_active && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active Version
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
