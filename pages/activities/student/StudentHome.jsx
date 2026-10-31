import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play, Radio, FileText, Clock, ChevronRight, Clapperboard, BookOpen, NotebookPen,
  CalendarCheck, LineChart, BarChart3, IdCard, ArrowRight,
} from "lucide-react";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { getCategoryLabel } from "../../../constants/examCategories";

// Student Home (2026-10-29 new look): everything a student needs today on
// one screen — overall progress, "continue watching", what's on today, and
// shortcuts to every other student page. Every number comes from existing
// APIs (same figures as My Progress / Classes / Tests), and each block
// simply hides itself if its data can't be loaded, so Home never breaks.

const NAVY = "#0f2a4a";
const NAVY2 = "#16365e";
const GOLD = "#c9971f";
const GOLD_LIGHT = "#e8b94a";
const INK = "#1c2530";
const SLATE = "#5b6675";
const LINE = "#e7e1d2";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const fmtYmd = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const Card = ({ children, className = "", style }) => (
  <div className={`bg-white rounded-2xl ${className}`} style={{ border: `1px solid ${LINE}`, boxShadow: "0 4px 16px rgba(15,42,74,0.06)", ...style }}>
    {children}
  </div>
);

const Ring = ({ pct, size = 84 }) => {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${GOLD} 0 ${p}%, #ece6d6 ${p}% 100%)` }}
    >
      <div className="rounded-full bg-white flex items-center justify-center font-poppins font-bold" style={{ width: size - 16, height: size - 16, color: NAVY, fontSize: size * 0.24 }}>
        {p}%
      </div>
    </div>
  );
};

const Tile = ({ icon: Icon, bg = "#f3ecd9", fg = NAVY, size = 38 }) => (
  <span className="flex items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: 12, backgroundColor: bg, color: fg }}>
    <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
  </span>
);

const StudentHome = () => {
  const { userData } = useContext(AuthContext);
  const [progress, setProgress] = useState(null);
  const [videos, setVideos] = useState(null);
  const [plan, setPlan] = useState({});
  const [live, setLive] = useState([]);
  const [tests, setTests] = useState(null);

  useEffect(() => {
    if (!userData?._id) return;
    const safe = (p) => p.then((r) => r.data).catch(() => null);
    safe(api.get("/student-progress/me")).then((d) => setProgress(d?.data || null));
    safe(api.get("/videos/available")).then((d) => setVideos(d?.data || []));
    safe(api.get("/video-commitments/me")).then((d) => {
      const map = {};
      (d?.data?.items || []).forEach((it) => {
        map[String(it.videoId)] = it;
      });
      setPlan(map);
    });
    safe(api.get("/live-classes/current")).then((d) => setLive(d?.data || []));
    safe(api.get(`/exam-function/eligible-exam/${userData._id}`)).then((d) => setTests(Array.isArray(d) ? d : null));
  }, [userData?._id]);

  // Unfinished videos (same 75% rule as everywhere else), newest first.
  const pending = useMemo(
    () => (videos || []).filter((v) => v.durationSeconds > 0 && (v.percentWatched || 0) < 75),
    [videos]
  );
  const continueVideo = useMemo(
    () => pending.find((v) => v.percentWatched > 0) || pending[0] || null,
    [pending]
  );
  const dueSoon = useMemo(() => {
    const dated = Object.values(plan).filter((it) => it.targetDate);
    dated.sort((a, b) => String(a.targetDate).localeCompare(String(b.targetDate)));
    return dated;
  }, [plan]);
  const missed = Object.values(plan).filter((it) => it.status === "missed").length;

  const firstName = (userData?.username || "").split(/\s+/)[0] || "there";
  const overall = progress?.overallProgress ?? null;

  const shortcuts = [
    { to: "/recorded-classes", label: "Classes", icon: Clapperboard },
    { to: "/activities", label: "Tests", icon: FileText },
    { to: "/attachments", label: "Materials", icon: BookOpen },
    { to: "/notebook", label: "Notebook & Doubts", icon: NotebookPen },
    ...(userData?.studyTracker ? [{ event: "open-study-tracker", label: "Daily Update", icon: CalendarCheck }] : []),
    { to: "/progress", label: "My Progress", icon: LineChart },
    { to: "/performance-analytics", label: "Performance", icon: BarChart3 },
    { to: "/profile", label: "My Profile", icon: IdCard },
  ];

  const todayRows = [];
  live.forEach((lc) =>
    todayRows.push({
      key: `live-${lc._id || lc.title}`,
      icon: Radio, bg: "#fee2e2", fg: "#b91c1c",
      title: `Live now: ${lc.title}`,
      sub: "Tap to join the class",
      to: "/recorded-classes",
      action: "Join",
    })
  );
  if (tests && tests.length > 0) {
    todayRows.push({
      key: "tests",
      icon: FileText, bg: "#dbeafe", fg: "#1d4ed8",
      title: `${tests.length} test${tests.length === 1 ? "" : "s"} ready for you`,
      sub: [tests[0]?.subjectName, tests[0]?.subTopicName].filter(Boolean).join(" · ") || "Open Tests",
      to: "/activities",
    });
  }
  if (pending.length > 0) {
    todayRows.push({
      key: "videos",
      icon: Clock,
      bg: missed ? "#fee2e2" : "#fef3c7",
      fg: missed ? "#b91c1c" : "#b45309",
      title: `${pending.length} video${pending.length === 1 ? "" : "s"} to finish`,
      sub: missed
        ? `${missed} past the date you planned`
        : dueSoon[0]
          ? `Next planned: ${fmtYmd(dueSoon[0].targetDate)}`
          : "Plan a date for each one",
      to: "/recorded-classes",
    });
  }

  return (
    <div className="p-3 sm:p-5">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Greeting */}
        <div
          className="rounded-3xl px-5 py-6 sm:px-8 sm:py-8 text-white flex flex-col sm:flex-row sm:items-end gap-4 justify-between"
          style={{ background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY2} 100%)` }}
        >
          <div>
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl">
              {greeting()}, {firstName} 👋
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
              {getCategoryLabel(userData?.category)}
              {userData?.batch ? ` · ${userData.batch}` : ""}
              {overall !== null ? ` · ${Math.round(overall)}% of your course done` : ""}
            </p>
          </div>
          {continueVideo && (
            <Link
              to="/recorded-classes"
              className="inline-flex items-center gap-2 font-semibold rounded-xl px-4 py-2.5 self-start sm:self-auto"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              <Play className="w-4 h-4" fill={NAVY} /> Continue watching
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Progress */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Ring pct={overall ?? 0} />
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: SLATE }}>My overall progress</div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  {[
                    ["Videos", progress?.videos],
                    ["Tests", progress?.exams],
                    ["Materials", progress?.attachments],
                  ].map(([label, v]) => (
                    <div key={label} className="rounded-lg py-1.5" style={{ backgroundColor: "#fbf7ec" }}>
                      <div className="font-poppins font-bold text-sm" style={{ color: NAVY }}>
                        {v ? `${v.completed}/${v.total}` : "–"}
                      </div>
                      <div className="text-[10.5px]" style={{ color: SLATE }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/progress" className="mt-4 flex items-center justify-between text-sm font-semibold" style={{ color: GOLD }}>
              See full progress <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>

          {/* Continue watching */}
          <div className="rounded-2xl p-5 text-white flex flex-col" style={{ backgroundColor: NAVY }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider" style={{ color: GOLD_LIGHT }}>CONTINUE WATCHING</span>
              {continueVideo && plan[String(continueVideo._id)]?.targetDate && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(232,185,74,0.18)", color: GOLD_LIGHT }}>
                  Finish by {fmtYmd(plan[String(continueVideo._id)].targetDate)}
                </span>
              )}
            </div>
            {continueVideo ? (
              <Link to="/recorded-classes" className="flex items-center gap-3 mt-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: GOLD, color: NAVY }}>
                  <Play className="w-5 h-5" fill={NAVY} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold truncate">{continueVideo.title}</span>
                  <span className="block text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {[continueVideo.subject?.name, continueVideo.subtopic?.name].filter(Boolean).join(" · ") || "Recorded class"}
                    {" · "}
                    {Math.round(continueVideo.percentWatched || 0)}% watched
                  </span>
                </span>
              </Link>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                {videos ? "You're all caught up — no pending videos. 🎉" : "Loading your classes…"}
              </p>
            )}
            {continueVideo && (
              <div className="mt-4 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, continueVideo.percentWatched || 0)}%`, backgroundColor: GOLD_LIGHT }} />
              </div>
            )}
          </div>

          {/* Today */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-poppins font-semibold" style={{ color: NAVY }}>Today</span>
              <span className="text-xs" style={{ color: SLATE }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
            {todayRows.length === 0 ? (
              <p className="text-sm py-3" style={{ color: SLATE }}>Nothing urgent today. Keep going! 💪</p>
            ) : (
              todayRows.map((row, i) => (
                <Link key={row.key} to={row.to} className="flex items-center gap-3 py-2.5" style={i ? { borderTop: `1px solid ${LINE}` } : undefined}>
                  <Tile icon={row.icon} bg={row.bg} fg={row.fg} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: INK }}>{row.title}</span>
                    <span className="block text-xs truncate" style={{ color: SLATE }}>{row.sub}</span>
                  </span>
                  {row.action ? (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: NAVY }}>{row.action}</span>
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: SLATE }} />
                  )}
                </Link>
              ))
            )}
          </Card>
        </div>

        {/* Pending videos with planned dates (laptop shows more) */}
        {pending.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-poppins font-semibold" style={{ color: NAVY }}>Pending videos — your plan</span>
              <Link to="/recorded-classes" className="text-xs font-semibold" style={{ color: GOLD }}>View all classes →</Link>
            </div>
            {pending.slice(0, 5).map((v, i) => {
              const it = plan[String(v._id)];
              const tag = it?.status === "missed"
                ? { t: "Date missed", bg: "#fee2e2", fg: "#b91c1c" }
                : it?.targetDate
                  ? { t: `Due ${fmtYmd(it.targetDate)}`, bg: "#fef3c7", fg: "#b45309" }
                  : null;
              return (
                <Link key={v._id} to="/recorded-classes" className="flex items-center gap-3 py-2.5" style={i ? { borderTop: `1px solid ${LINE}` } : undefined}>
                  <span className="w-14 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, color: GOLD_LIGHT }}>
                    <Play className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: INK }}>{v.title}</span>
                    <span className="flex items-center gap-2 mt-1">
                      <span className="flex-1 h-1 rounded-full" style={{ backgroundColor: "#ece6d6", maxWidth: 200 }}>
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, v.percentWatched || 0)}%`, backgroundColor: GOLD }} />
                      </span>
                      <span className="text-[11px]" style={{ color: SLATE }}>{Math.round(v.percentWatched || 0)}%</span>
                    </span>
                  </span>
                  {tag && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: tag.bg, color: tag.fg }}>{tag.t}</span>
                  )}
                </Link>
              );
            })}
          </Card>
        )}

        {/* Everything for you */}
        <div>
          <div className="font-poppins font-semibold mb-2 px-1" style={{ color: NAVY }}>Everything for you</div>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {shortcuts.map((s) => {
              const inner = (
                <>
                  <Tile icon={s.icon} size={38} />
                  <span className="text-[11px] sm:text-xs font-medium text-center leading-tight" style={{ color: INK }}>{s.label}</span>
                </>
              );
              const cls = "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl bg-white";
              const style = { border: `1px solid ${LINE}` };
              return s.event ? (
                <button key={s.label} type="button" className={cls} style={style} onClick={() => window.dispatchEvent(new Event(s.event))}>
                  {inner}
                </button>
              ) : (
                <Link key={s.label} to={s.to} className={cls} style={style}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentHome;
