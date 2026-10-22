import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  User,
  Briefcase,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  AtSign,
  FileText,
  CheckCircle2,
  Network,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { api } from "../api";

/* Sample conversations the left panel types out, to show students what the tutor does. */
const DEMO_CHATS = [
  {
    q: "What is stemming?",
    a: "Stemming cuts a word down to its root form — \"running\" and \"runs\" both become \"run\" — so related words are matched together.",
    source: "Unit 2 · NLP Notes · Page 14",
  },
  {
    q: "Explain overfitting simply",
    a: "Overfitting is like memorising last year's paper word for word: you score perfectly on it, but struggle with any new question.",
    source: "Unit 5 · Deep Learning · Page 32",
  },
  {
    q: "Why do we normalise data?",
    a: "Normalisation puts every feature on the same scale, so a column measured in thousands doesn't drown out one measured in decimals.",
    source: "Unit 4 · Data Mining · Page 9",
  },
];

/* Topic chips floating in the left panel; depth controls how far each one drifts with the mouse. */
const FLOATING_TOPICS = [
  { label: "Tokenization", x: "8%", y: "14%", depth: 26 },
  { label: "Transformers", x: "68%", y: "9%", depth: 40 },
  { label: "Parsing", x: "78%", y: "46%", depth: 18 },
  { label: "Clustering", x: "40%", y: "76%", depth: 34 },
  { label: "N-grams", x: "60%", y: "84%", depth: 22 },
  { label: "Backprop", x: "14%", y: "88%", depth: 30 },
];

function useTypewriter(text, speed = 22, start = true) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) {
      setOut("");
      return;
    }
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return out;
}

/* Left showcase: animated demo chat + parallax topic chips. */
function ShowcasePanel() {
  const [chatIdx, setChatIdx] = useState(0);
  const [phase, setPhase] = useState("question"); // question → thinking → answer
  const chat = DEMO_CHATS[chatIdx];

  const typedQ = useTypewriter(chat.q, 45, phase === "question" || phase === "thinking" || phase === "answer");
  const typedA = useTypewriter(chat.a, 16, phase === "answer");

  useEffect(() => {
    let t;
    if (phase === "question" && typedQ === chat.q) t = setTimeout(() => setPhase("thinking"), 500);
    if (phase === "thinking") t = setTimeout(() => setPhase("answer"), 1100);
    if (phase === "answer" && typedA === chat.a)
      t = setTimeout(() => {
        setPhase("question");
        setChatIdx((i) => (i + 1) % DEMO_CHATS.length);
      }, 3200);
    return () => clearTimeout(t);
  }, [phase, typedQ, typedA, chat]);

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-10 text-white"
    >
      {/* Ambient glows */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />

      {/* Floating topic chips */}
      {FLOATING_TOPICS.map((t, i) => (
        <FloatingChip key={t.label} topic={t} sx={sx} sy={sy} delay={i * 0.4} />
      ))}

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur">
          <GraduationCap className="w-5 h-5" />
        </div>
        <span className="font-bold tracking-tight text-lg">VCE AI Tutor</span>
      </div>

      {/* Headline + demo chat */}
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="text-4xl font-black leading-[1.1] tracking-tight">
            Ask anything.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              Answered from your syllabus.
            </span>
          </h2>
          <p className="text-sm text-indigo-200/80 mt-3 max-w-sm">
            Your faculty's notes, turned into a tutor that's available all night before the exam.
          </p>
        </div>

        <div className="max-w-md rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl p-4 space-y-3 shadow-2xl shadow-indigo-950/50">
          {/* Student bubble */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white text-indigo-950 px-3.5 py-2 text-sm font-medium min-h-[2.25rem]">
              {typedQ}
              {phase === "question" && <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-middle animate-pulse" />}
            </div>
          </div>

          {/* Tutor bubble */}
          <div className="flex gap-2.5 min-h-[6.5rem]">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <AnimatePresence mode="wait">
              {phase === "thinking" && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-indigo-200"
                >
                  <span className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-200"
                      />
                    ))}
                  </span>
                  Searching your course notes…
                </motion.div>
              )}
              {phase === "answer" && (
                <motion.div key={`a-${chatIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <p className="text-sm leading-relaxed text-indigo-50">{typedA}</p>
                  {typedA === chat.a && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                    >
                      <FileText className="w-3 h-3" /> {chat.source}
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="relative z-10 flex flex-wrap gap-2">
        {[
          { icon: Network, label: "Mind maps" },
          { icon: BookOpen, label: "Revision notes" },
          { icon: ClipboardCheck, label: "Quizzes & mock exams" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/15"
          >
            <Icon className="w-3.5 h-3.5 text-cyan-300" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FloatingChip({ topic, sx, sy, delay }) {
  const x = useTransform(sx, (v) => v * topic.depth * -1);
  const y = useTransform(sy, (v) => v * topic.depth * -1);
  return (
    <motion.div style={{ left: topic.x, top: topic.y, x, y }} className="absolute pointer-events-none">
      <motion.span
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
        className="block text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-indigo-100/60"
      >
        {topic.label}
      </motion.span>
    </motion.div>
  );
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, ...STRENGTH_LEVELS[score] };
}

const STRENGTH_LEVELS = [
  { label: "Too short", color: "bg-rose-500" },
  { label: "Weak", color: "bg-rose-500" },
  { label: "Okay", color: "bg-amber-500" },
  { label: "Good", color: "bg-emerald-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

const inputBase =
  "w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 font-medium transition focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function Login({ onLogin, initialMode = "login", onBackToLanding }) {
  const [mode, setMode] = useState(initialMode || "login");

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [role, setRole] = useState("student");
  const [subjectName, setSubjectName] = useState(""); // faculty signup
  const [facultyList, setFacultyList] = useState([]); // available faculty
  const [selectedFacultyId, setSelectedFacultyId] = useState(""); // student signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

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
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const checkCaps = (e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"));
  const strength = mode === "signup" && password ? passwordStrength(password) : null;

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 font-sans p-3 sm:p-4 lg:grid lg:grid-cols-[1.1fr_1fr] gap-4">
      <ShowcasePanel />

      {/* Form side */}
      <div className="relative flex flex-col min-h-[calc(100vh-1.5rem)] lg:min-h-0">
        <div className="flex items-center justify-between px-2 sm:px-6 pt-3">
          {onBackToLanding ? (
            <button
              type="button"
              onClick={onBackToLanding}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Home
            </button>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">
            {mode === "login" ? "New here?" : "Have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-2 sm:px-6 py-10">
          <motion.div
            key={shakeKey}
            animate={shakeKey ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            {/* Mobile brand (left panel is hidden below lg) */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">VCE AI Tutor</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {mode === "login" ? "Welcome back 👋" : "Create your account"}
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  {mode === "login"
                    ? "Log in to pick up where you left off."
                    : "Takes less than a minute. No email needed."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Log In / Sign Up switch */}
            <div className="flex bg-slate-200/60 rounded-xl p-1 mt-7 relative">
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg relative cursor-pointer transition-colors ${
                    mode === m ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="activeLoginTabPill"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{m === "login" ? "Log in" : "Sign up"}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {/* Role cards first on signup, so the rest of the form fits the choice */}
              <AnimatePresence initial={false}>
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-semibold text-slate-600 mb-2">I am a…</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "student", icon: User, title: "Student", desc: "Learn & practise" },
                        { id: "faculty", icon: Briefcase, title: "Faculty", desc: "Upload course notes" },
                      ].map(({ id, icon: Icon, title, desc }) => {
                        const active = role === id;
                        return (
                          <motion.button
                            key={id}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRole(id)}
                            className={`relative text-left p-3.5 rounded-xl border-2 transition-colors cursor-pointer ${
                              active ? "border-indigo-600 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            {active && (
                              <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-indigo-600" />
                            )}
                            <Icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                            <p className="text-sm font-semibold text-slate-900 mt-2">{title}</p>
                            <p className="text-[11px] text-slate-500">{desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. bhanuteja"
                    autoComplete="username"
                    required
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={checkCaps}
                    onKeyDown={checkCaps}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    className={`${inputBase} !pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1.5">Caps Lock is on</p>
                )}
                {strength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1 rounded-full transition-colors ${n <= strength.score ? strength.color : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 w-14 text-right">{strength.label}</span>
                  </div>
                )}
              </div>

              <AnimatePresence initial={false}>
                {mode === "signup" && role === "faculty" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject / course name</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="e.g. Natural Language Processing"
                        className={inputBase}
                      />
                    </div>
                  </motion.div>
                )}
                {mode === "signup" && role === "student" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden text-xs text-slate-500 flex gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    Register once — inside the portal you can switch between any professor's course.
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-rose-600 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" /> {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {/* Shine sweep on hover */}
                <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] translate-x-0 group-hover:translate-x-[400%] transition-transform duration-700" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "signup" ? "Creating account…" : "Logging in…"}
                  </>
                ) : (
                  <>
                    <span>{mode === "signup" ? "Create account" : "Log in"}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        <p className="text-center text-[11px] text-slate-400 pb-3">
          Answers only from your course notes · Page references on every answer
        </p>
      </div>
    </div>
  );
}
