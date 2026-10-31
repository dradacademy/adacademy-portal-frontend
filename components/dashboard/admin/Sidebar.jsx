import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Gauge, Users, Layers, FileText, ClipboardCheck, PenLine, Radio, Video, MessageCircleQuestion,
  Paperclip, UserCheck, IdCard, HelpCircle, Shield, TrendingUp, ListChecks, BarChart3,
  CalendarCheck, CalendarDays, Image, Gift, MessageSquare, LogOut, Menu, X, ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import logo from "../../../assets/images/common/logo.png";

// Admin/evaluator menu — 2026-10-29 "new look".
// The old menu was one long list of 23 links. It is now grouped into six
// sections (Overview · Tests · Classes · Students · Reports · Website) in
// the academy's navy & gold. Every page and route is unchanged.
//   ≥1280px: full menu with labels (can be collapsed to icons).
//   768–1279px: icon rail (hover shows the name).
//   <768px (phones): a bottom bar with the 4 most used pages + "Menu",
//     which opens the full grouped menu.

const NAVY = "#0f2a4a";
const GOLD = "#c9971f";
const GOLD_LIGHT = "#e8b94a";

const ADMIN_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { to: "/dashboard", label: "Exam Dashboard", icon: Gauge, exact: true },
      { to: "/dashboard/user-based", label: "User Dashboard", icon: Users },
    ],
  },
  {
    title: "TESTS",
    items: [
      { to: "/dashboard/create-subject", label: "Subjects", icon: Layers },
      { to: "/dashboard/exam", label: "Exams", icon: FileText },
      { to: "/dashboard/test-tracking", label: "Test Tracking", icon: ClipboardCheck },
      { to: "/dashboard/answer-sheets", label: "Answer Sheets", icon: PenLine },
    ],
  },
  {
    title: "CLASSES",
    items: [
      { to: "/dashboard/live-class", label: "Live Classes", icon: Radio },
      { to: "/dashboard/recorded-classes", label: "Recorded Classes", icon: Video },
      { to: "/dashboard/live-qa", label: "Live Q&A", icon: MessageCircleQuestion },
      { to: "/dashboard/attachments", label: "Materials", icon: Paperclip },
    ],
  },
  {
    title: "STUDENTS",
    items: [
      { to: "/dashboard/users", label: "Users", icon: UserCheck },
      { to: "/dashboard/student-profiles", label: "Student Profiles", icon: IdCard },
      { to: "/dashboard/doubts", label: "Doubts", icon: HelpCircle },
      { to: "/dashboard/controllers", label: "Controllers", icon: Shield },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { to: "/dashboard/student-progress", label: "Student Progress", icon: TrendingUp },
      { to: "/dashboard/video-tracker", label: "Video Tracker", icon: ListChecks },
      { to: "/dashboard/video-analytics", label: "Video Analytics", icon: BarChart3 },
      { to: "/dashboard/attendance-report", label: "Attendance", icon: CalendarCheck },
      { to: "/dashboard/study-tracker", label: "Study Tracker", icon: CalendarDays },
    ],
  },
  {
    title: "WEBSITE",
    items: [
      { to: "/dashboard/content", label: "Content", icon: Image },
      { to: "/dashboard/free-test", label: "Free Test Leads", icon: Gift },
    ],
  },
];

// Evaluators only review answers (Comment page), as before.
const EVALUATOR_GROUPS = [
  { title: "EVALUATION", items: [{ to: "/dashboard/comment", label: "Comment", icon: MessageSquare }] },
];

// Phone bottom bar shortcuts (admin).
const ADMIN_BOTTOM = [
  { to: "/dashboard", label: "Home", icon: Gauge, exact: true },
  { to: "/dashboard/exam", label: "Exams", icon: FileText },
  { to: "/dashboard/recorded-classes", label: "Classes", icon: Video },
  { to: "/dashboard/users", label: "Students", icon: UserCheck },
];

const isActive = (item, path) => {
  const clean = path.replace(/\/+$/, "") || "/";
  if (item.exact) return clean === item.to;
  return clean === item.to || clean.startsWith(`${item.to}/`);
};

const useWidth = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
};

const MenuLink = ({ item, active, compact, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      title={compact ? item.label : undefined}
      className={`flex items-center gap-3 rounded-xl transition-colors ${compact ? "justify-center p-2.5" : "px-3 py-[7px]"}`}
      style={
        active
          ? { backgroundColor: "rgba(232,185,74,0.16)", color: GOLD_LIGHT, fontWeight: 700 }
          : { color: "rgba(255,255,255,0.8)" }
      }
    >
      <Icon className="w-[19px] h-[19px] shrink-0" />
      {!compact && <span className="text-[14px] truncate">{item.label}</span>}
    </Link>
  );
};

const GroupedMenu = ({ groups, path, compact, onNavigate, grid }) => (
  <>
    {groups.map((g, gi) => (
      <div key={g.title}>
        {compact ? (
          gi > 0 && <div className="mx-3 my-2" style={{ height: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
        ) : (
          <div className="text-[10.5px] font-bold tracking-widest px-3 mt-3 mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {g.title}
          </div>
        )}
        <div className={grid ? "grid grid-cols-2 gap-1" : "flex flex-col gap-0.5"}>
          {g.items.map((item) => (
            <MenuLink key={item.to} item={item} active={isActive(item, path)} compact={compact} onClick={onNavigate} />
          ))}
        </div>
      </div>
    ))}
  </>
);

const Sidebar = () => {
  const { userData, handleLogout } = useContext(AuthContext);
  const location = useLocation();
  const path = location.pathname;
  const width = useWidth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groups = userData?.role === "admin" ? ADMIN_GROUPS : EVALUATOR_GROUPS;
  const isPhone = width < 768;
  const compact = !isPhone && (isCollapsed || width < 1280);

  // Close the phone menu after navigating.
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Phones: room for the bottom bar (index.css: body.ad-admin-shell).
  useEffect(() => {
    if (!isPhone) return undefined;
    document.body.classList.add("ad-admin-shell");
    return () => document.body.classList.remove("ad-admin-shell");
  }, [isPhone]);

  /* ------------------------- phones ------------------------- */
  if (isPhone) {
    const bottom = userData?.role === "admin" ? ADMIN_BOTTOM : EVALUATOR_GROUPS[0].items;
    return (
      <>
        <nav
          className="fixed left-0 right-0 bottom-0 z-40 bg-white flex justify-around"
          style={{ borderTop: "1px solid #e7e1d2", padding: "6px 4px calc(8px + env(safe-area-inset-bottom))" }}
        >
          {[...bottom, { label: "Menu", icon: Menu, menu: true }].map((item) => {
            const Icon = item.icon;
            const active = item.menu ? drawerOpen : isActive(item, path);
            const inner = (
              <>
                <span className="rounded-2xl px-3.5 py-1" style={{ backgroundColor: active ? "#f3ecd9" : "transparent" }}>
                  <Icon className="w-[21px] h-[21px]" />
                </span>
                <span className="text-[11px]" style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </>
            );
            const cls = "flex flex-col items-center gap-0.5 w-16";
            const style = { color: active ? NAVY : "#8a93a0" };
            return item.menu ? (
              <button key="menu" type="button" className={cls} style={style} onClick={() => setDrawerOpen(true)}>
                {inner}
              </button>
            ) : (
              <Link key={item.to} to={item.to} className={cls} style={style}>
                {inner}
              </Link>
            );
          })}
        </nav>

        {drawerOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,30,54,0.5)" }} onClick={() => setDrawerOpen(false)} />
            <div className="absolute top-0 bottom-0 left-0 overflow-y-auto p-4" style={{ width: "min(340px, 88vw)", backgroundColor: NAVY }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="" className="w-9 h-9 rounded-lg bg-white object-contain p-0.5" />
                  <div style={{ lineHeight: 1.1 }}>
                    <div className="text-white font-bold text-sm font-poppins">Dr. A.D. Academy</div>
                    <div className="text-[10px] font-bold tracking-widest" style={{ color: GOLD_LIGHT }}>
                      {userData?.role === "admin" ? "ADMIN" : "EVALUATOR"}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ color: "#fff" }}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <GroupedMenu groups={groups} path={path} compact={false} onNavigate={() => setDrawerOpen(false)} />
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ color: "#fca5a5", backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <LogOut className="w-[18px] h-[18px]" /> Logout
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  /* --------------------- tablets & laptops --------------------- */
  return (
    <aside
      className="ad-admin-menu flex flex-col rounded-3xl h-[95vh] sticky top-5 overflow-y-auto transition-all duration-300 shrink-0"
      style={{ width: compact ? 78 : 264, backgroundColor: NAVY, padding: compact ? "16px 10px" : "18px 14px" }}
    >
      <div className={`flex items-center ${compact ? "justify-center" : "justify-between"} gap-2`}>
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <img src={logo} alt="" className="w-10 h-10 rounded-xl bg-white object-contain p-0.5 shrink-0" />
          {!compact && (
            <div style={{ lineHeight: 1.1 }} className="min-w-0">
              <div className="text-white font-bold text-[15px] font-poppins truncate">Dr. A.D. Academy</div>
              <div className="text-[10px] font-bold tracking-widest" style={{ color: GOLD_LIGHT }}>
                {userData?.role === "admin" ? "ADMIN" : "EVALUATOR"}
              </div>
            </div>
          )}
        </Link>
        {width >= 1280 && !compact && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse menu"
            className="p-1 rounded-lg"
            style={{ color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {width >= 1280 && isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand menu"
          className="mt-3 mx-auto p-1 rounded-lg"
          style={{ color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <nav className={compact ? "mt-3" : "mt-1"}>
        <GroupedMenu groups={groups} path={path} compact={compact} />
      </nav>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={handleLogout}
          title={compact ? "Logout" : undefined}
          className={`w-full flex items-center gap-3 rounded-xl ${compact ? "justify-center p-2.5" : "px-3 py-2"}`}
          style={{ color: "#fca5a5", backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <LogOut className="w-[19px] h-[19px]" />
          {!compact && <span className="text-[14px]">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
