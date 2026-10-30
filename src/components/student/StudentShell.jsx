import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Clapperboard, FileText, BookOpen, User, LineChart, BarChart3, NotebookPen,
  CalendarCheck, IdCard, LogOut, ChevronDown,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import logo from "../../assets/images/common/logo.png";
import { getCategoryLabel } from "../../constants/examCategories";

// Student app layout (2026-10-29 "new look"): the same menu everywhere a
// student goes, in the academy's navy & gold.
//   Laptop (≥1024px): fixed navy menu on the left, grouped
//     Main · My Learning · Account.
//   Phone/tablet: a bottom tab bar (Home · Classes · Tests · Materials · Me)
//     like WhatsApp/YouTube — "Me" opens the full list of the rest.
// Rendered by Navbar.jsx for students, so every existing student page gets
// it without changing those pages. The page content keeps its own layout;
// <body> gets padding (index.css: body.ad-student-shell) so nothing hides
// behind the fixed menus.

export const STUDENT_SHELL_PATHS = [
  /^\/my\/?$/, /^\/me\/?$/, /^\/activities/, /^\/recorded-classes/, /^\/attachments/,
  /^\/progress/, /^\/notebook/, /^\/performance-analytics/, /^\/profile/,
];

const MAIN = [
  { to: "/my", label: "Home", icon: Home, match: /^\/my\/?$/ },
  { to: "/recorded-classes", label: "Classes", icon: Clapperboard, match: /^\/recorded-classes/ },
  { to: "/activities", label: "Tests", icon: FileText, match: /^\/activities/ },
  { to: "/attachments", label: "Materials", icon: BookOpen, match: /^\/attachments/ },
];

const LEARNING = [
  { to: "/progress", label: "My Progress", icon: LineChart, match: /^\/progress/ },
  { to: "/performance-analytics", label: "Performance", icon: BarChart3, match: /^\/performance-analytics/ },
  { to: "/notebook", label: "Notebook & Doubts", icon: NotebookPen, match: /^\/notebook/ },
];

const PAGE_TITLES = [
  [/^\/my\/?$/, "Home"],
  [/^\/me\/?$/, "Me"],
  [/^\/activities/, "Tests"],
  [/^\/recorded-classes/, "Classes"],
  [/^\/attachments/, "Materials"],
  [/^\/progress/, "My Progress"],
  [/^\/performance-analytics/, "Performance"],
  [/^\/notebook/, "Notebook & Doubts"],
  [/^\/profile/, "My Profile"],
];

const NAVY = "#0f2a4a";
const GOLD = "#c9971f";
const GOLD_LIGHT = "#e8b94a";

const SideLink = ({ item, active }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] transition-colors"
      style={
        active
          ? { backgroundColor: "rgba(232,185,74,0.16)", color: GOLD_LIGHT, fontWeight: 700 }
          : { color: "rgba(255,255,255,0.8)" }
      }
    >
      <Icon className="w-[18px] h-[18px]" />
      <span>{item.label}</span>
    </Link>
  );
};

const GroupLabel = ({ children }) => (
  <div className="text-[10.5px] font-bold tracking-widest px-3 mt-5 mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
    {children}
  </div>
);

const StudentShell = () => {
  const { userData, handleLogout } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const profileLocked = !userData?.profileCompleted;
  const title = (PAGE_TITLES.find(([re]) => re.test(path)) || [null, "Dr. A.D. Academy"])[1];
  const initials = (userData?.username || "?").slice(0, 2).toUpperCase();

  // Make room for the fixed menus (see index.css).
  useEffect(() => {
    document.body.classList.add("ad-student-shell");
    return () => document.body.classList.remove("ad-student-shell");
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const openDailyUpdate = () => window.dispatchEvent(new Event("open-study-tracker"));

  return (
    <>
      {/* ---------- Laptop: left menu ---------- */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-40 p-4 overflow-y-auto"
        style={{ width: 240, backgroundColor: NAVY }}
      >
        <Link to="/my" className="flex items-center gap-2.5 px-1">
          <img src={logo} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-0.5" />
          <div style={{ lineHeight: 1.1 }}>
            <div className="text-white font-bold text-[15px] font-poppins">Dr. A.D. Academy</div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>of Excellence</div>
          </div>
        </Link>

        <nav className="mt-5 flex flex-col gap-0.5">
          {MAIN.map((item) => (
            <SideLink key={item.to} item={item} active={item.match.test(path)} />
          ))}
          <GroupLabel>MY LEARNING</GroupLabel>
          {LEARNING.map((item) => (
            <SideLink key={item.to} item={item} active={item.match.test(path)} />
          ))}
          {userData?.studyTracker && (
            <button
              type="button"
              onClick={openDailyUpdate}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] text-left"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              <CalendarCheck className="w-[18px] h-[18px]" />
              <span>Daily Update</span>
            </button>
          )}
          <GroupLabel>ACCOUNT</GroupLabel>
          <SideLink item={{ to: "/profile", label: "My Profile", icon: IdCard }} active={/^\/profile/.test(path)} />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] text-left"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </nav>

        <div className="mt-auto pt-4">
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}>
            {getCategoryLabel(userData?.category)}
            {userData?.batch ? <div className="font-semibold mt-0.5" style={{ color: GOLD_LIGHT }}>{userData.batch}</div> : null}
          </div>
        </div>
      </aside>

      {/* ---------- Top bar (all sizes) ---------- */}
      <header
        className="w-full bg-white rounded-2xl flex items-center gap-3 px-4 py-2.5"
        style={{ border: "1px solid #e7e1d2", boxShadow: "0 2px 10px rgba(15,42,74,0.05)" }}
      >
        <Link to="/my" className="lg:hidden flex items-center gap-2 shrink-0">
          <img src={logo} alt="" className="w-9 h-9 rounded-lg object-contain" />
        </Link>
        <h1 className="font-poppins font-bold text-lg truncate" style={{ color: NAVY }}>
          {title}
        </h1>
        <div className="flex-1" />
        <NotificationBell />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2"
            aria-label="Account menu"
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm font-poppins"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {initials}
            </span>
            <span className="hidden sm:block text-left" style={{ lineHeight: 1.15 }}>
              <span className="block text-sm font-semibold" style={{ color: "#1c2530" }}>{userData?.username}</span>
              <span className="block text-xs" style={{ color: "#5b6675" }}>{getCategoryLabel(userData?.category)}</span>
            </span>
            <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: "#5b6675" }} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl z-50 overflow-hidden"
              style={{ border: "1px solid #e7e1d2", boxShadow: "0 12px 30px rgba(15,42,74,0.15)" }}
            >
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: "#1c2530" }}>
                <IdCard className="w-4 h-4" /> My Profile
              </Link>
              <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: "#b91c1c" }}>
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {profileLocked && (
        <Link
          to={"/profile"}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl text-sm font-medium py-2 px-4"
          style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
        >
          Complete your student profile to unlock the rest of the portal — tap here to finish it
        </Link>
      )}

      {/* ---------- Phone/tablet: bottom tabs ---------- */}
      <nav
        className="lg:hidden fixed left-0 right-0 bottom-0 z-40 bg-white flex justify-around"
        style={{ borderTop: "1px solid #e7e1d2", padding: "6px 4px calc(8px + env(safe-area-inset-bottom))" }}
      >
        {[...MAIN, { to: "/me", label: "Me", icon: User, match: /^\/(me|progress|performance-analytics|notebook|profile)/ }].map((item) => {
          const Icon = item.icon;
          const active = item.match.test(path);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 w-16"
              style={{ color: active ? NAVY : "#8a93a0" }}
            >
              <span className="rounded-2xl px-3.5 py-1" style={{ backgroundColor: active ? "#f3ecd9" : "transparent" }}>
                <Icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className="text-[11px]" style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default StudentShell;
