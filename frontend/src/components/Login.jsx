import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  User,
  Briefcase,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import StudyBackground from "./StudyBackground.jsx";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [subjectName, setSubjectName] = useState(""); // faculty signup
  const [facultyList, setFacultyList] = useState([]); // available faculty
  const [selectedFacultyId, setSelectedFacultyId] = useState(""); // student signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load available faculty for student signup
  useEffect(() => {
    if (mode === "signup" && role === "student") {
      api
        .getFacultyList()
        .then((list) => {
          setFacultyList(list);
          if (list.length > 0 && !selectedFacultyId) {
            setSelectedFacultyId(String(list[0].id));
          }
        })
        .catch(() => setFacultyList([]));
    }
  }, [mode, role, selectedFacultyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      let auth;
      if (mode === "signup") {
        const facId = role === "student" ? Number(selectedFacultyId) : null;
        const subj = role === "faculty" ? subjectName : null;
        auth = await api.signup(name.trim(), password, role, subj, facId);
      } else {
        auth = await api.login(name.trim(), password);
      }

      api.setToken(auth.token);
      onLogin(auth);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-6 relative font-sans">
      {/* Calm background with a soft top glow */}
      <StudyBackground isDark={false} />

      {/* Main Authentication Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 rounded-3xl p-8 space-y-6 relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-1">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <span>VCE AI Tutor</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Syllabus-Bound Adaptive Learning Platform</span>
          </div>
        </div>

        {/* Sliding Tab Pill (Log In / Sign Up) */}
        <div className="flex bg-slate-100 rounded-2xl p-1 relative border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors relative z-10 cursor-pointer ${
              mode === "login" ? "text-indigo-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {mode === "login" && (
              <motion.div
                layoutId="activeLoginTabPill"
                className="absolute inset-0 bg-white border border-slate-200/80 rounded-xl shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Log In</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors relative z-10 cursor-pointer ${
              mode === "signup" ? "text-indigo-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {mode === "signup" && (
              <motion.div
                layoutId="activeLoginTabPill"
                className="absolute inset-0 bg-white border border-slate-200/80 rounded-xl shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Sign Up</span>
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. bhanuteja"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-900 placeholder-slate-400 font-semibold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-900 placeholder-slate-400 font-semibold transition"
            />
          </div>

          {/* Sign Up Role Selection */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-1"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        role === "student"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <User className="h-4 w-4" /> Student
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("faculty")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        role === "faculty"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Briefcase className="h-4 w-4" /> Faculty
                    </button>
                  </div>
                </div>

                {/* Faculty Subject Name Input */}
                {role === "faculty" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject / Course Name
                    </label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g. Natural Language Processing, Operating Systems..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs text-slate-900 font-semibold transition"
                    />
                  </div>
                )}

                {/* Student Multi-Course Note */}
                {role === "student" && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600" /> Multi-Subject Access
                    </p>
                    <p className="text-[11px] text-indigo-700">
                      Register once! Inside the portal, you can switch dynamically between any professor's course.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-xs text-rose-600 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" /> {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{mode === "signup" ? "Create Account" : "Log In"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
