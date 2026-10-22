import React, { useEffect, useState } from "react";
import {
  Brain,
  Network,
  BookMarked,
  ClipboardList,
  Target,
  Flame,
  Award,
  BarChart3,
  ArrowRight,
  BookOpen,
  MessageSquare,
  ChevronRight,
  X,
  HelpCircle,
} from "lucide-react";
import { api } from "../api";

/* Five-step student guide shown on the dashboard. Each step links to its tab. */
const GUIDE_STEPS = [
  { tab: "study", icon: Brain, title: "Ask a doubt", desc: "Type any question. Answers come only from your faculty's notes, with page numbers." },
  { tab: "mindmap", icon: Network, title: "See the big picture", desc: "Open a mind map to see how the topics of a unit connect. Click any topic to learn it." },
  { tab: "notes", icon: BookMarked, title: "Revise quickly", desc: "Get short revision notes for a unit — perfect the night before an exam." },
  { tab: "quiz", icon: ClipboardList, title: "Test yourself", desc: "Take a quiz or a timed mock exam. Your score updates your progress for that unit." },
  { tab: "insights", icon: Target, title: "Fix weak topics", desc: "See which topics need more work and get a day-by-day study plan." },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function masteryColor(pct) {
  if (pct >= 80) return "bg-success-500";
  if (pct >= 40) return "bg-warning-500";
  return "bg-danger-500";
}

export default function StudentDashboard({
  user,
  units,
  gamification,
  facultyId,
  subjectName,
  isDark,
  showGuide,
  onToggleGuide,
  onNavigate,
  onStudyUnit,
  onQuizUnit,
}) {
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    if (!facultyId) return;
    setRecent(null);
    api
      .getDoubtHistory(facultyId)
      .then((data) => setRecent(data?.items || []))
      .catch(() => setRecent([]));
  }, [facultyId]);

  const indexedUnits = (units || []).filter((u) => u && u.indexed);
  const masteredCount = indexedUnits.filter((u) => u.mastery_percent >= 80).length;

  // Continue with the weakest unit the student has started; otherwise the first unit.
  const started = indexedUnits.filter((u) => u.attempts > 0 && u.mastery_percent < 80);
  const continueUnit =
    started.sort((a, b) => a.mastery_percent - b.mastery_percent)[0] || indexedUnits[0] || null;

  const focusUnits = [...indexedUnits].sort((a, b) => a.mastery_percent - b.mastery_percent);

  const card = `vce-card p-5 ${isDark ? "!bg-surface-dark-secondary !border-slate-800" : ""}`;
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const strong = isDark ? "text-white" : "text-slate-900";
  const track = isDark ? "bg-slate-800" : "bg-slate-200";

  const stats = [
    { icon: Award, value: `${masteredCount}/${indexedUnits.length}`, label: "Units mastered", hint: "80%+ in quizzes", tone: "text-success-500" },
    { icon: BarChart3, value: `${Math.round(gamification?.accuracy_percent || 0)}%`, label: "Quiz average", hint: `${gamification?.total_quizzes_completed || 0} questions answered`, tone: "text-primary-500" },
    { icon: Flame, value: gamification?.streak_days || 0, label: "Day streak", hint: "Study daily to grow it", tone: "text-amber-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${strong}`}>
            {greeting()}, {user.name} 👋
          </h2>
          <p className={`text-sm mt-1 ${muted}`}>
            {subjectName ? `You're studying ${subjectName}. ` : ""}Here's where you left off.
          </p>
        </div>
        {!showGuide && (
          <button
            onClick={onToggleGuide}
            className={`vce-btn vce-btn-sm ${
              isDark ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" /> How it works
          </button>
        )}
      </div>

      {/* How it works guide */}
      {showGuide && (
        <div className={`${card} relative`}>
          <button
            onClick={onToggleGuide}
            title="Hide guide"
            className={`absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer ${isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className={`text-base font-bold ${strong}`}>How VCE AI Tutor works</h3>
          <p className={`text-xs mt-1 mb-4 ${muted}`}>
            Your faculty uploads the course notes. The AI only answers from those notes — so everything you learn here is in your syllabus. Follow these five steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {GUIDE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.tab}
                  onClick={() => onNavigate(step.tab)}
                  className={`text-left p-3.5 rounded-xl border transition cursor-pointer group ${
                    isDark ? "bg-slate-900/60 border-slate-800 hover:border-primary-500/50" : "bg-surface-tertiary border-slate-100 hover:border-primary-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <Icon className="h-4 w-4 text-primary-500" />
                  </div>
                  <p className={`text-sm font-semibold ${strong}`}>{step.title}</p>
                  <p className={`text-[11px] mt-1 leading-relaxed ${muted}`}>{step.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-500 opacity-0 group-hover:opacity-100 transition">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue learning + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className={`${card} lg:col-span-2 flex flex-col`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Continue learning</p>
          {continueUnit ? (
            <>
              <div className="flex items-start gap-3 mt-3">
                <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-base font-bold ${strong}`}>Unit {continueUnit.unit_number}</p>
                  <p className={`text-sm truncate ${muted}`}>{continueUnit.unit_name}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className={`w-full h-2 rounded-full overflow-hidden ${track}`}>
                  <div
                    className={`h-full rounded-full ${masteryColor(continueUnit.mastery_percent)}`}
                    style={{ width: `${Math.max(continueUnit.mastery_percent, 3)}%` }}
                  />
                </div>
                <p className={`text-[11px] mt-1.5 ${muted}`}>
                  {continueUnit.attempts > 0
                    ? `${continueUnit.mastery_percent}% mastered`
                    : "Not started yet — take a quiz to measure your level"}
                </p>
              </div>
              <div className="flex gap-2 mt-auto pt-4">
                <button onClick={() => onStudyUnit(continueUnit.unit_number)} className="vce-btn-primary vce-btn-sm">
                  Resume study <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onQuizUnit(continueUnit.unit_number)}
                  className={`vce-btn vce-btn-sm ${
                    isDark ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Quick quiz
                </button>
              </div>
            </>
          ) : (
            <p className={`text-sm mt-3 ${muted}`}>
              Your faculty hasn't uploaded any notes for this course yet. Check back soon.
            </p>
          )}
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={card}>
                <Icon className={`h-5 w-5 ${s.tone}`} />
                <p className={`text-3xl font-bold mt-3 ${strong}`}>{s.value}</p>
                <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{s.label}</p>
                <p className={`text-[11px] mt-0.5 ${muted}`}>{s.hint}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus areas + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${strong}`}>Focus areas</h3>
              <p className={`text-[11px] ${muted}`}>Weakest units first. Click a unit to practise it.</p>
            </div>
            <button onClick={() => onNavigate("insights")} className="text-xs font-semibold text-primary-500 hover:underline cursor-pointer">
              View all
            </button>
          </div>
          {focusUnits.length === 0 ? (
            <p className={`text-xs ${muted}`}>No units yet.</p>
          ) : (
            <div className="space-y-3">
              {focusUnits.slice(0, 5).map((u) => (
                <button
                  key={u.unit_number}
                  onClick={() => onQuizUnit(u.unit_number)}
                  className="w-full text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium truncate pr-3 group-hover:text-primary-500 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Unit {u.unit_number} · {u.unit_name}
                    </span>
                    <span className={`font-semibold flex-shrink-0 ${muted}`}>
                      {u.attempts > 0 ? `${u.mastery_percent}%` : "Not started"}
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${track}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${u.attempts > 0 ? masteryColor(u.mastery_percent) : ""}`}
                      style={{ width: `${u.attempts > 0 ? Math.max(u.mastery_percent, 3) : 0}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${strong}`}>Recent questions</h3>
              <p className={`text-[11px] ${muted}`}>Doubts you asked the AI tutor.</p>
            </div>
            <button onClick={() => onNavigate("history")} className="text-xs font-semibold text-primary-500 hover:underline cursor-pointer">
              View all
            </button>
          </div>
          {recent === null ? (
            <p className={`text-xs ${muted}`}>Loading…</p>
          ) : recent.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className={`h-8 w-8 mx-auto mb-2 ${muted}`} />
              <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No questions yet</p>
              <p className={`text-xs mt-1 mb-3 ${muted}`}>Ask your first doubt to get started.</p>
              <button onClick={() => onNavigate("study")} className="vce-btn-primary vce-btn-sm">
                Ask a question
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate("history")}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition cursor-pointer ${
                    isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500 flex-shrink-0">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.query}</p>
                    <p className={`text-[11px] ${muted}`}>
                      {item.unit_number ? `Unit ${item.unit_number} · ` : ""}
                      {item.created_at}
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 ${muted}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
