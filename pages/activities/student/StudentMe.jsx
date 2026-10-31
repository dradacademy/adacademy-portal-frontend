import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, BarChart3, NotebookPen, CalendarCheck, IdCard, LogOut, ChevronRight,
  Clapperboard, FileText, BookOpen,
} from "lucide-react";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import { getCategoryLabel } from "../../../constants/examCategories";

// "Me" tab (phones): every student page that isn't in the bottom tabs, in
// one list — so nothing is more than two taps away (2026-10-29 new look).

const NAVY = "#0f2a4a";
const GOLD = "#c9971f";
const LINE = "#e7e1d2";

const Row = ({ icon: Icon, title, sub, to, onClick, danger }) => {
  const content = (
    <>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: danger ? "#fee2e2" : "#f3ecd9", color: danger ? "#b91c1c" : NAVY }}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-semibold" style={{ color: danger ? "#b91c1c" : "#1c2530" }}>{title}</span>
        {sub && <span className="block text-xs" style={{ color: "#5b6675" }}>{sub}</span>}
      </span>
      <ChevronRight className="w-4 h-4" style={{ color: "#a0a7b1" }} />
    </>
  );
  const cls = "w-full flex items-center gap-3 p-3";
  return to ? <Link to={to} className={cls}>{content}</Link> : <button type="button" onClick={onClick} className={cls}>{content}</button>;
};

const Group = ({ title, children }) => (
  <div>
    <div className="text-[11px] font-bold tracking-wider px-1 mb-1.5" style={{ color: "#5b6675" }}>{title}</div>
    <div className="bg-white rounded-2xl overflow-hidden divide-y" style={{ border: `1px solid ${LINE}`, borderColor: LINE }}>
      {children}
    </div>
  </div>
);

const StudentMe = () => {
  const { userData, handleLogout } = useContext(AuthContext);
  const initials = (userData?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="p-3 sm:p-5">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl py-4 space-y-4">
        <div className="rounded-3xl p-5 text-white flex items-center gap-4" style={{ backgroundColor: NAVY }}>
          <span className="w-14 h-14 rounded-2xl flex items-center justify-center font-poppins font-bold text-xl" style={{ backgroundColor: GOLD, color: NAVY }}>
            {initials}
          </span>
          <div className="min-w-0">
            <div className="font-poppins font-bold text-lg truncate">{userData?.username}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
              {userData?.registerNumber ? `Reg. No. ${userData.registerNumber} · ` : ""}
              {getCategoryLabel(userData?.category)}
            </div>
            {userData?.batch && <div className="text-xs mt-0.5 font-semibold" style={{ color: "#e8b94a" }}>{userData.batch}</div>}
          </div>
        </div>

        <Group title="MY LEARNING">
          <Row icon={LineChart} title="My Progress" sub="Videos, tests and materials completed" to="/progress" />
          <Row icon={BarChart3} title="Performance" sub="Marks, speed, accuracy and rank" to="/performance-analytics" />
          <Row icon={NotebookPen} title="Notebook & Doubts" sub="Saved questions, notes and your doubts" to="/notebook" />
          {userData?.studyTracker && (
            <Row icon={CalendarCheck} title="Daily Update" sub="Today's study log" onClick={() => window.dispatchEvent(new Event("open-study-tracker"))} />
          )}
        </Group>

        <Group title="STUDY">
          <Row icon={Clapperboard} title="Classes" sub="Recorded and live classes" to="/recorded-classes" />
          <Row icon={FileText} title="Tests" sub="Available, attempted and completed" to="/activities" />
          <Row icon={BookOpen} title="Materials" sub="PDFs and study material" to="/attachments" />
        </Group>

        <Group title="ACCOUNT">
          <Row icon={IdCard} title="My Profile" sub="Personal and parent details" to="/profile" />
          <Row icon={LogOut} title="Logout" onClick={handleLogout} danger />
        </Group>
      </main>
    </div>
  );
};

export default StudentMe;
