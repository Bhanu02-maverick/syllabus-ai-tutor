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
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import ThemeToggle from "./ThemeToggle.jsx";
import { useThemeAttribute } from "../utils/theme.js";
import NetworkCanvas from "./NetworkCanvas.jsx";

export default function FacultyDashboard({ user, onLogout }) {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("vce_faculty_theme") !== "false";
  });

  useThemeAttribute(isDark);

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

  return (
    <div className="ds-page flex flex-col relative overflow-hidden">
      {/* 60 FPS HTML5 Canvas Background Particle Network */}
      <NetworkCanvas isDark={isDark} />

      {/* Header */}
      <header className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm border-b transition-colors z-20 ds-topbar`}>
        <div className="flex items-center space-x-3">
          {/* History Back & Forward Navigation Controls */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => window.history.back()}
              title="Go Back (Browser History)"
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center bg-surface-sunken border-line text-ink-soft hover:bg-line/60 hover:text-ink`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              title="Go Forward (Browser History)"
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center bg-surface-sunken border-line text-ink-soft hover:bg-line/60 hover:text-ink`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
          >
            <Briefcase className="h-6 w-6" />
          </motion.div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight flex items-center gap-2">
              <span>Faculty Command Deck</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO CONTROL
              </span>
            </h1>
            <p className="text-xs opacity-60">
              Prof. {user.name} {user.subject_name ? `· ${user.subject_name}` : ""}
            </p>
          </div>
        </div>

        {/* Header Actions & Theme Switcher */}
        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-2xl border transition cursor-pointer bg-surface-sunken border-line text-ink-soft hover:bg-line/60`}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </motion.button>
        </div>
      </header>

      {/* Main Command Deck Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 z-10">
        {/* Cohort Overview Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border transition shadow-sm ds-card`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Syllabus Units</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black">{totalUnits}</div>
            <p className="text-[10px] text-ink-subtle mt-0.5">Indexed course units</p>
          </div>

          <div className={`p-4 rounded-2xl border transition shadow-sm ds-card`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Indexed PDFs</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black">{indexedDocs}</div>
            <p className="text-[10px] text-ink-subtle mt-0.5">Active textbook documents</p>
          </div>

          <div className={`p-4 rounded-2xl border transition shadow-sm ds-card`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Cohort Mastery</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black">{overallAvgMastery}%</div>
            <p className="text-[10px] text-ink-subtle mt-0.5">Class average accuracy</p>
          </div>

          <div className={`p-4 rounded-2xl border transition shadow-sm ds-card`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Student Activity</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black">{totalStudentsAttempted}</div>
            <p className="text-[10px] text-ink-subtle mt-0.5">Total quiz attempts</p>
          </div>
        </div>

        {/* Command Deck Navigation Tabs */}
        <div className={`flex rounded-2xl border shadow-sm overflow-x-auto relative p-1 transition ds-card`}>
          {[
            { id: "ingest", icon: UploadCloud, label: "PDF Ingestion & Syllabus" },
            { id: "qbank", icon: FileQuestion, label: "AI Question Generator" },
            { id: "analytics", icon: BarChart3, label: "Classroom Analytics" },
            { id: "versions", icon: History, label: "Version Control & Units" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors z-10 cursor-pointer ${
                  isActive
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFacultyTabPill"
                    className={`absolute inset-0 rounded-xl ds-nav-active`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 z-10 transition-transform ${isActive ? "scale-110 text-blue-500" : ""}`} />
                <span className="z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════ TAB 1: PDF INGESTION & SYLLABUS ═══════════════ */}
        {activeTab === "ingest" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ds-card`}>
              <div className="flex items-center gap-3 pb-3 border-b border-line">
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
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold border transition ds-field`}
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
                  <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ds-inset`}>
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80">
                        Unit Number <span className="text-ink-subtle font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={newUnitNumber}
                        onChange={(e) => setNewUnitNumber(e.target.value)}
                        placeholder="auto"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ds-field`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 opacity-80">
                        Unit Name <span className="text-ink-subtle font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="auto-detect from PDF"
                        className={`w-full px-3 py-2 rounded-xl text-xs border ds-field`}
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
                  <div className={`p-6 rounded-2xl border-2 border-dashed text-center transition bg-surface-sunken border-primary/30 hover:border-primary/60`}>
                    <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="block w-full text-xs text-ink-subtle file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
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
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ds-card`}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
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
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ds-inset`}
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
            <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ds-card`}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
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
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ds-field`}
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
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ds-field`}
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
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ds-field`}
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
                      className={`w-20 px-3 py-2.5 rounded-xl text-xs font-semibold border ds-field`}
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
              <div className={`p-6 rounded-3xl border shadow-md space-y-5 transition ds-card`}>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
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
                          : "bg-surface-sunken border-line text-ink-soft hover:bg-line/60"
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
                      className={`p-4 rounded-2xl border space-y-2 text-xs transition ds-inset`}
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
                                  : "ds-card text-ink-soft"
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
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ds-card`}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
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
                      className={`p-4 rounded-2xl border transition ds-inset`}
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
                                : <ChevronRight className="w-4 h-4 text-ink-subtle" />
                            )}
                            Unit {a.unit_number}: {a.unit_name}
                          </span>
                          <span className="text-xs">
                            {a.average_score_percent}% average score ({a.students_attempted} student attempts)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-line rounded-full overflow-hidden">
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
                        <div className="mt-4 pt-3 border-t border-line space-y-2">
                          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                            Most Challenging Concepts for Students
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {enhanced.difficult_topics.map((dt, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ds-card`}
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
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ds-card`}>
              <div className="flex items-center gap-3 pb-3 border-b border-line">
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
                  className={`w-20 px-3 py-2.5 rounded-xl text-xs border ds-field`}
                />
                <input
                  type="text"
                  value={manualUnitName}
                  onChange={(e) => setManualUnitName(e.target.value)}
                  placeholder="Unit name (e.g. Natural Language Processing)"
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs border ds-field`}
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
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ds-inset`}
                  >
                    <span className="font-bold">Unit {u.unit_number}: {u.unit_name}</span>
                    <button
                      onClick={() => handleDeleteUnit(u.unit_number)}
                      className="p-1.5 text-ink-subtle hover:text-rose-400 transition cursor-pointer"
                      title={`Delete Unit ${u.unit_number}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF Version Control */}
            <div className={`p-6 rounded-3xl border shadow-md space-y-4 transition ds-card`}>
              <div className="flex items-center gap-3 pb-3 border-b border-line">
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
                        : "bg-surface-sunken border-line text-ink-muted hover:bg-line/60 hover:text-ink"
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
                            : "ds-inset"
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
                                className="p-1 text-ink-subtle hover:text-rose-400 transition cursor-pointer"
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
      </div>
    </div>
  );
}
