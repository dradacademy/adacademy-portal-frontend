import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarDays, Trophy, TrendingUp, GraduationCap, Award, Users, Zap, Layers,
  Video, FileText, NotebookPen, MessageSquare, Phone, MapPin, CheckCircle2,
} from "lucide-react";
import EnrollNowPopup from "../../common/popup/EnrollNowPopup";

// New front page (2026-10-30) — built from the design Dr. Dinesh approved.
// Navy & gold, serif headings, a Tamil line, numbered cards, repeated
// "Reserve my seat" buttons (they open the existing enquiry popup, so every
// lead still reaches the admin "Enquiries" list).
//
// ► To change batch dates: edit BATCHES / NEXT_BATCH_AT below.

const NEXT_BATCH_AT = new Date("2027-03-15T09:00:00+05:30"); // March 2027, 3rd week
const WA = "919566818665";

export const BATCHES = [
  { exam: "GATE Civil", date: "March 2027 · 3rd week", confirmed: true, mode: "Online + Offline" },
  { exam: "TNPSC AE", date: "March 2027 · 3rd week", confirmed: true, mode: "Online + Offline" },
  { exam: "TNPSC JDO", date: "Tentative · dates soon", confirmed: false, mode: "Online + Offline" },
  { exam: "SSC JE / RRB JE", date: "Tentative · dates soon", confirmed: false, mode: "Online" },
];

const C = { navy: "#0f2a4a", navy2: "#16365e", navyDark: "#0a1e36", gold: "#c9971f", goldLight: "#e8b94a", cream: "#fbf7ec", bg: "#f6f3ea", line: "#e7e1d2", slate: "#5b6675", ink: "#1c2530" };
const GRID = { backgroundImage: "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)", backgroundSize: "48px 48px" };
const TAMIL = { fontFamily: "'Noto Sans Tamil', 'Latha', 'Nirmala UI', sans-serif" };
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

/* ---------- small building blocks ---------- */
const Eyebrow = ({ children, light, center }) => (
  <div className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase ${center ? "justify-center" : ""}`} style={{ color: light ? C.goldLight : C.gold }}>
    <span className="w-6 h-0.5" style={{ background: "currentColor" }} />
    {children}
    {center && <span className="w-6 h-0.5" style={{ background: "currentColor" }} />}
  </div>
);
const Title = ({ children, light, center, className = "" }) => (
  <h2 className={`font-newsreader font-semibold text-3xl sm:text-4xl lg:text-[46px] leading-[1.1] tracking-tight mt-3 ${center ? "text-center" : ""} ${className}`} style={{ color: light ? "#fff" : C.navy }}>
    {children}
  </h2>
);
const Em = ({ children, light }) => <em style={{ color: light ? C.goldLight : C.gold }}>{children}</em>;
const Num = ({ n, light }) => <span className="font-newsreader text-3xl font-semibold" style={{ color: light ? C.goldLight : C.gold }}>{n}</span>;
const Section = ({ id, bg = "#fff", dark, children, className = "" }) => (
  <section id={id} className={`relative overflow-hidden rounded-3xl py-14 sm:py-20 ${className}`} style={{ background: bg }}>
    {dark && <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={GRID} />}
    <div className="container mx-auto px-4 sm:px-6 relative">{children}</div>
  </section>
);

const btnBase = "inline-flex items-center justify-center gap-2 font-semibold rounded-full whitespace-nowrap transition-opacity hover:opacity-90 cursor-pointer";
const GoldBtn = ({ children, onClick, small, href, to }) => {
  const cls = `${btnBase} ${small ? "text-sm px-4 py-2" : "text-[15px] px-6 py-3"}`;
  const st = { background: C.gold, color: C.navy };
  if (to) return <Link to={to} className={cls} style={st}>{children}</Link>;
  if (href) return <a href={href} className={cls} style={st}>{children}</a>;
  return <button type="button" onClick={onClick} className={cls} style={st}>{children}</button>;
};
const NavyBtn = ({ children, onClick, small, to }) => {
  const cls = `${btnBase} ${small ? "text-sm px-4 py-2" : "text-[15px] px-6 py-3"}`;
  if (to) return <Link to={to} className={cls} style={{ background: C.navy, color: "#fff" }}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls} style={{ background: C.navy, color: "#fff" }}>{children}</button>;
};
const GhostBtn = ({ children, light, small, to, href }) => {
  const cls = `${btnBase} ${small ? "text-sm px-4 py-2" : "text-[15px] px-6 py-3"}`;
  const st = { border: `1.5px solid ${light ? "rgba(255,255,255,.5)" : C.navy}`, color: light ? "#fff" : C.navy };
  if (to) return <Link to={to} className={cls} style={st}>{children}</Link>;
  return <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls} style={st}>{children}</a>;
};
const WaBtn = ({ children, small, text }) => (
  <a href={waLink(text || "Hi, I would like to know about the next batch at Dr. A.D. Academy")} target="_blank" rel="noreferrer" className={`${btnBase} ${small ? "text-sm px-4 py-2" : "text-[15px] px-6 py-3"}`} style={{ background: "#25D366", color: "#fff" }}>
    {children}
  </a>
);

/* ---------- countdown ---------- */
const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, target.getTime() - now);
  return {
    done: ms === 0,
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  };
};
const CountBox = ({ v, l }) => (
  <div className="flex-1 rounded-xl text-center py-2 px-1 sm:px-3" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)" }}>
    <div className="font-newsreader text-2xl sm:text-3xl font-semibold leading-none text-white tabular-nums">{String(v).padStart(2, "0")}</div>
    <div className="text-[10px] font-bold tracking-widest mt-1" style={{ color: C.goldLight }}>{l}</div>
  </div>
);

/* ---------- 1. HERO ---------- */
export const HeroNew = ({ onReserve }) => {
  const cd = useCountdown(NEXT_BATCH_AT);
  return (
    <section className="relative overflow-hidden rounded-3xl" style={{ background: `radial-gradient(1200px 600px at 85% 15%, ${C.navy2} 0%, ${C.navy} 45%, ${C.navyDark} 100%)` }}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={GRID} />
      <div aria-hidden="true" className="absolute hidden lg:block rounded-full pointer-events-none" style={{ right: -140, top: 40, width: 560, height: 560, border: "1px solid rgba(232,185,74,.18)" }} />
      <div className="container mx-auto px-4 sm:px-6 relative grid lg:grid-cols-2 gap-10 py-12 sm:py-16 lg:py-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold" style={{ background: "rgba(232,185,74,.14)", color: C.goldLight, border: "1px solid rgba(232,185,74,.35)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.goldLight }} />
            Admissions open — GATE & TNPSC AE · March 2027 (3rd week)
          </div>
          <h1 className="font-newsreader font-semibold text-white text-[42px] sm:text-6xl xl:text-7xl leading-[1.02] tracking-tight mt-6">
            Build your rank.
            <br />
            <em style={{ color: C.goldLight }}>Engineer</em> your future.
          </h1>
          <div className="text-base sm:text-lg mt-3" style={{ ...TAMIL, color: "rgba(255,255,255,.72)" }}>
            தமிழ்நாட்டின் சிவில் இன்ஜினியரிங் தேர்வு வெற்றிக்கான அகாடமி
          </div>
          <p className="text-base sm:text-lg mt-5 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,.75)" }}>
            Clear concepts, real exam-pattern tests and personal mentoring for GATE, ESE, TNPSC AE, TNPSC JDO, SSC JE & RRB JE — from Dr. A. Dinesh, Ph.D.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <GoldBtn onClick={onReserve}>Reserve my seat <ArrowRight className="w-4 h-4" /></GoldBtn>
            <GhostBtn light to="/free-test">Take a free test</GhostBtn>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-9 max-w-lg">
            {[["6 months", "to GATE qualified"], ["1000+", "students mentored"], ["12+", "years teaching"]].map(([a, b]) => (
              <div key={b}>
                <div className="font-newsreader text-2xl sm:text-4xl font-semibold" style={{ color: C.goldLight }}>{a}</div>
                <div className="text-xs sm:text-sm" style={{ color: "rgba(255,255,255,.6)" }}>{b}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-5 sm:p-6" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(6px)" }}>
            {!cd.done && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em]" style={{ color: C.goldLight }}>NEXT BATCH STARTS IN</span>
                  <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: "#dc2626", color: "#fff" }}>Limited seats</span>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4">
                  <CountBox v={cd.d} l="DAYS" />
                  <CountBox v={cd.h} l="HRS" />
                  <CountBox v={cd.m} l="MINS" />
                  <CountBox v={cd.s} l="SECS" />
                </div>
              </>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
              {BATCHES.map((b) => (
                <div key={b.exam} className="rounded-xl p-3" style={{ background: b.confirmed ? "rgba(232,185,74,.12)" : "rgba(255,255,255,.05)", border: `1px solid ${b.confirmed ? "rgba(232,185,74,.4)" : "rgba(255,255,255,.1)"}` }}>
                  <div className="text-white font-semibold text-sm">{b.exam}</div>
                  <div className="text-[11px] sm:text-xs mt-0.5" style={{ color: b.confirmed ? C.goldLight : "rgba(255,255,255,.55)" }}>
                    {b.confirmed ? "📅 " : "⏳ "}
                    {b.date}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <GoldBtn small onClick={onReserve}>Reserve my seat <ArrowRight className="w-4 h-4" /></GoldBtn>
              <WaBtn small>WhatsApp us</WaBtn>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-white flex items-center gap-4" style={{ boxShadow: "0 20px 40px rgba(0,0,0,.3)" }}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#fdf3dc", color: C.gold }}>
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="font-newsreader text-lg sm:text-xl font-semibold" style={{ color: C.navy }}>GATE qualified in 6 months</div>
              <div className="text-sm" style={{ color: C.slate }}>Our students cleared GATE with just 6 months of preparation.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- 2. EXAM STRIP ---------- */
export const ExamStrip = () => (
  <div className="rounded-3xl py-5 px-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2" style={{ background: C.cream, border: `1px solid ${C.line}` }}>
    <span className="text-[11px] font-bold tracking-[0.2em] w-full sm:w-auto text-center" style={{ color: C.slate }}>WE PREPARE YOU FOR</span>
    {["GATE Civil", "IES / ESE", "TNPSC AE", "TNPSC JDO", "SSC JE", "RRB JE"].map((t) => (
      <span key={t} className="font-newsreader text-lg sm:text-xl font-semibold" style={{ color: C.navy }}>{t}</span>
    ))}
  </div>
);

/* ---------- 3. THE PROBLEM ---------- */
export const ProblemSection = () => (
  <Section>
    <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-center">
      <div className="lg:col-span-2">
        <Eyebrow>The real problem</Eyebrow>
        <Title>Studying hard — but <Em>marks not improving?</Em></Title>
        <div className="mt-3 text-base" style={{ ...TAMIL, color: C.slate }}>கடினமாகப் படிக்கிறீர்கள் — ஆனால் மதிப்பெண் உயரவில்லையா?</div>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.slate }}>
          It's not effort that's missing. It's the right order, the right practice and someone to correct you. That's exactly what we fix.
        </p>
      </div>
      <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
        {[
          ["01", "Can't finish the syllabus", "Too many topics, no clear plan or order."],
          ["02", "Practice doesn't match the exam", "Random questions, not real exam pattern & marking."],
          ["03", "Doubts stay unclear", "No one to ask when a concept doesn't click."],
          ["04", "No one tracks your progress", "You don't know your weak topics until the exam."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <Num n={n} />
            <div className="font-semibold mt-1" style={{ color: C.navy }}>{t}</div>
            <div className="text-sm mt-1" style={{ color: C.slate }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

/* ---------- 4. SELF-CHECK (interactive) ---------- */
const QUESTIONS = [
  "Have you solved the last 10 years' PYQs?",
  "Do you revise every topic at least twice?",
  "Do you take full-length mock tests every week?",
  "Do you know your 3 weakest topics right now?",
  "Do you have someone to clear your doubts quickly?",
];
const LEVELS = [
  { name: "Beginner", range: "0–30%", color: "#ef4444" },
  { name: "Building", range: "31–55%", color: "#f59e0b" },
  { name: "Exam-ready", range: "56–75%", color: "#3b82f6" },
  { name: "Rank-ready", range: "76%+", color: "#22c55e" },
];
export const SelfCheck = () => {
  const [ans, setAns] = useState({});
  const answered = Object.keys(ans).length;
  const yes = Object.values(ans).filter(Boolean).length;
  const no = answered - yes;
  const level = answered < QUESTIONS.length ? null : yes <= 1 ? 0 : yes <= 2 ? 1 : yes <= 3 ? 2 : 3;
  const msg =
    level === null
      ? null
      : level <= 1
      ? `${no} × NO — you're at "${LEVELS[level].name}" level. You need a structured plan.`
      : level === 2
      ? `${no} × NO — you're close to "Exam-ready". Fix the gaps with timed tests.`
      : `Great — you're "Rank-ready". Push your rank with full-length mocks.`;

  return (
    <Section bg={C.navy} dark>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <Eyebrow light>Quick self-check · 30 seconds</Eyebrow>
          <Title light>Are you <Em light>exam-ready?</Em> Answer honestly.</Title>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,.7)" }}>
            3 or more "No" answers? You need a structured plan — take our free test and see your exact level.
          </p>
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LEVELS.map((l, i) => (
              <div key={l.name} className="rounded-xl p-3 transition-all" style={{ background: level === i ? "rgba(232,185,74,.14)" : "rgba(255,255,255,.06)", border: `1px solid ${level === i ? C.goldLight : "rgba(255,255,255,.1)"}` }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <div className="text-white font-semibold text-sm mt-2">{l.name}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,.55)" }}>Free test score {l.range}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 sm:p-6">
          {QUESTIONS.map((q, i) => (
            <div key={q} className="flex items-center gap-2 sm:gap-3 py-3" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <span className="font-newsreader text-xl font-semibold w-5 shrink-0" style={{ color: C.gold }}>{i + 1}</span>
              <span className="flex-1 text-sm sm:text-[15px]" style={{ color: C.ink }}>{q}</span>
              {[true, false].map((v) => {
                const on = ans[i] === v;
                const st = on ? (v ? { background: "#dcfce7", color: "#166534", borderColor: "#86efac" } : { background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }) : { background: C.bg, color: C.slate, borderColor: C.line };
                return (
                  <button key={String(v)} type="button" onClick={() => setAns((a) => ({ ...a, [i]: v }))} className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border cursor-pointer" style={st} aria-pressed={on}>
                    {v ? "YES" : "NO"}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="mt-4 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: "#fef3c7" }}>
            <div>
              <div className="font-semibold" style={{ color: "#92400e" }}>
                {msg || `Tap YES or NO for all 5 (${answered}/5 done)`}
              </div>
              <div className="text-sm" style={{ color: "#92400e" }}>A free test will show your exact weak topics.</div>
            </div>
            <NavyBtn small to="/free-test">Take free test <ArrowRight className="w-4 h-4" /></NavyBtn>
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ---------- 5. RESULTS (numbers) ---------- */
export const ResultsStats = () => (
  <Section bg={C.cream} id="results">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <Eyebrow>Real results</Eyebrow>
        <Title>Results that speak — <Em>every batch.</Em></Title>
      </div>
      <GhostBtn small href="#achievers">See our achievers <ArrowRight className="w-4 h-4" /></GhostBtn>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-10">
      {[
        ["6 months", "of preparation → GATE qualified", TrendingUp],
        ["M.Tech", "admissions secured by our GATE students", GraduationCap],
        ["TNPSC AE", "selections from our test series", Award],
        ["1000+", "students mentored", Users],
      ].map(([a, b, I]) => (
        <div key={b} className="rounded-3xl p-4 sm:p-6 bg-white" style={{ border: `1px solid ${C.line}` }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#fdf3dc", color: C.gold }}>
            <I className="w-6 h-6" />
          </div>
          <div className="font-newsreader text-2xl sm:text-4xl font-semibold mt-4" style={{ color: C.navy }}>{a}</div>
          <div className="text-xs sm:text-sm mt-1" style={{ color: C.slate }}>{b}</div>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------- 6. COURSES ---------- */
const TRACKS = [
  { t: "National Elite Services", e: [["GATE Civil", "gate"], ["IES / ESE", "ese"]], d: "Conceptual depth, MSQ & NAT mastery, PYQ analysis.", I: Zap, batch: "March 2027 · 3rd week" },
  { t: "State Engineering Services", e: [["TNPSC AE", "tnpsc-ae"], ["TNPSC JDO", "tnpsc-jdo"]], d: "High-speed objective accuracy, IS Code provisions, state syllabus.", I: Award, batch: "AE: March 2027 · JDO: tentative" },
  { t: "Central Technical Services", e: [["SSC JE", "ssc-je"], ["RRB JE", "rrb-je"]], d: "CBT pattern drills, technical + general studies integration.", I: Layers, batch: "Tentative · dates soon" },
];
export const CoursesNew = () => (
  <Section bg={C.bg} id="courses">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <Eyebrow>Courses</Eyebrow>
        <Title>Three tracks. One goal — <Em>your selection.</Em></Title>
      </div>
      <p className="text-[15px] max-w-sm" style={{ color: C.slate }}>Live classes, recorded lectures, study material and an exam-pattern test series — all inside one app.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-5 sm:gap-6 mt-10">
      {TRACKS.map(({ t, e, d, I, batch }, i) => {
        const dark = i === 0;
        return (
          <div key={t} className="rounded-3xl p-6 sm:p-7 flex flex-col" style={dark ? { background: C.navy, color: "#fff", boxShadow: "0 30px 60px rgba(15,42,74,.25)" } : { background: "#fff", border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: dark ? C.gold : "#f3ecd9", color: C.navy }}>
                <I className="w-6 h-6" />
              </div>
              {dark && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(232,185,74,.18)", color: C.goldLight }}>MOST CHOSEN</span>}
            </div>
            <div className="font-newsreader text-2xl sm:text-[26px] font-semibold mt-5" style={{ color: dark ? "#fff" : C.navy }}>{t}</div>
            <p className="text-[15px] mt-2 leading-relaxed" style={{ color: dark ? "rgba(255,255,255,.75)" : C.slate }}>{d}</p>
            <div className="mt-4 rounded-xl px-3 py-2 text-sm flex items-start gap-2" style={{ background: dark ? "rgba(255,255,255,.08)" : C.bg, color: dark ? "#fff" : C.ink }}>
              <CalendarDays className="w-4 h-4 shrink-0 mt-0.5" style={{ color: dark ? C.goldLight : C.gold }} />
              <span>Next batch: <b>{batch}</b></span>
            </div>
            <div className="mt-auto pt-5">
              <div className="pt-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,.12)" : C.line}` }}>
                {e.map(([name, slug]) => (
                  <Link key={slug} to={`/exams/${slug}`} className="flex items-center justify-between text-sm font-semibold" style={{ color: dark ? C.goldLight : C.navy }}>
                    {name} — course & syllabus <ArrowRight className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </Section>
);

/* ---------- 7. WHAT YOU GET ---------- */
export const WhatYouGetNew = () => (
  <Section id="why-us">
    <div className="text-center">
      <Eyebrow center>What you get</Eyebrow>
      <Title center>Everything you need — <Em>in one app.</Em></Title>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10">
      {[
        ["01", Video, "Live + recorded classes", "Miss a class? Watch it again — any time, any device."],
        ["02", FileText, "Topic → full-length tests", "Topic-wise, subject-wise, mixed and full mocks — real exam pattern, negative marking and rank."],
        ["03", NotebookPen, "Notes & PYQ material", "Topic-wise notes and 10+ years of solved PYQs."],
        ["04", MessageSquare, "Doubt clearing", "Ask in live class or the app — answered quickly."],
        ["05", TrendingUp, "Progress tracking", "See weak topics, attendance and your video plan."],
        ["06", Users, "Personal mentoring", "Direct guidance from Dr. A. Dinesh, Ph.D."],
      ].map(([n, I, t, d]) => (
        <div key={n} className="rounded-3xl p-5 sm:p-6 flex gap-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <div className="shrink-0"><Num n={n} /></div>
          <div>
            <div className="flex items-center gap-2 font-semibold text-base sm:text-lg" style={{ color: C.navy }}>
              <I className="w-5 h-5" style={{ color: C.gold }} />
              {t}
            </div>
            <div className="text-sm mt-1" style={{ color: C.slate }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------- 8. UPCOMING BATCHES ---------- */
export const BatchesSection = ({ onReserve }) => (
  <Section bg={C.cream} id="batches">
    <div className="text-center">
      <Eyebrow center>Upcoming batches</Eyebrow>
      <Title center>Reserve your seat — <Em>limited seats per batch.</Em></Title>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10">
      {BATCHES.map((b) => (
        <div key={b.exam} className="rounded-3xl p-6 flex flex-col bg-white" style={b.confirmed ? { border: `2px solid ${C.gold}`, boxShadow: "0 20px 40px rgba(201,151,31,.15)" } : { border: `1px solid ${C.line}` }}>
          <span className="self-start text-[11px] font-bold px-2.5 py-1 rounded-full" style={b.confirmed ? { background: "#dcfce7", color: "#166534" } : { background: "#f1f0ec", color: C.slate }}>
            {b.confirmed ? "● Confirmed" : "◌ Dates announced soon"}
          </span>
          <div className="font-newsreader text-2xl font-semibold mt-4" style={{ color: C.navy }}>{b.exam}</div>
          <div className="flex items-center gap-2 mt-2 text-[15px]" style={{ color: C.ink }}>
            <CalendarDays className="w-4 h-4" style={{ color: C.gold }} />
            {b.confirmed ? b.date : "Tentative"}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: C.slate }}>
            <MapPin className="w-4 h-4" style={{ color: C.gold }} />
            {b.mode} · Coimbatore
          </div>
          <div className="mt-auto pt-5">
            {b.confirmed ? (
              <GoldBtn small onClick={onReserve}>Reserve my seat <ArrowRight className="w-4 h-4" /></GoldBtn>
            ) : (
              <GhostBtn small href={waLink(`Hi, please tell me when the ${b.exam} batch dates are announced.`)}>Notify me</GhostBtn>
            )}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------- 9. HOW TO JOIN ---------- */
export const StepsSection = () => (
  <Section id="how-to-join">
    <div className="text-center">
      <Eyebrow center>How to join</Eyebrow>
      <Title center>3 simple steps</Title>
    </div>
    <div className="grid md:grid-cols-3 gap-5 sm:gap-6 mt-10">
      {[
        ["1", "Take a free test or demo class", "See your level and how we teach — no cost.", "/free-test"],
        ["2", "Talk to us", "Call or WhatsApp — we suggest the right course & batch.", null],
        ["3", "Join the batch", "Get your login and start learning in the app the same day.", null],
      ].map(([n, t, d, to]) => (
        <div key={n} className="rounded-3xl p-6 sm:p-7 text-center" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-newsreader text-3xl font-semibold" style={{ background: C.navy, color: C.goldLight }}>{n}</div>
          <div className="mt-4 font-semibold text-lg" style={{ color: C.navy }}>{t}</div>
          <div className="text-sm mt-1" style={{ color: C.slate }}>{d}</div>
          <div className="mt-4">
            {to ? (
              <Link to={to} className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.gold }}>Start the free test <ArrowRight className="w-4 h-4" /></Link>
            ) : n === "2" ? (
              <a href="tel:+919566818665" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.gold }}><Phone className="w-4 h-4" /> +91 95668 18665</a>
            ) : (
              <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.gold }}><CheckCircle2 className="w-4 h-4" /> Same-day access</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------- 10. FINAL CALL TO ACTION ---------- */
export const FinalCTA = ({ onReserve }) => (
  <section className="rounded-3xl px-6 sm:px-14 py-10 sm:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6" style={{ background: `linear-gradient(120deg, ${C.gold}, ${C.goldLight})` }}>
    <div>
      <div className="font-newsreader text-3xl sm:text-[44px] font-semibold leading-tight" style={{ color: C.navy }}>
        Your rank needs a plan — <em>not just more hours.</em>
      </div>
      <div className="text-base sm:text-lg mt-1" style={{ color: C.navy }}>March 2027 batch · GATE & TNPSC AE · limited seats.</div>
    </div>
    <div className="flex flex-wrap gap-3">
      <NavyBtn onClick={onReserve}>Reserve my seat <ArrowRight className="w-4 h-4" /></NavyBtn>
      <WaBtn>WhatsApp us</WaBtn>
    </div>
  </section>
);

/* ---------- shared popup hook for the page ---------- */
export const useReserve = () => {
  const [open, setOpen] = useState(false);
  const popup = <EnrollNowPopup open={open} onClose={() => setOpen(false)} />;
  return [() => setOpen(true), popup];
};
