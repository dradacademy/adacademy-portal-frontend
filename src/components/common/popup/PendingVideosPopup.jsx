import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { AuthContext } from "../../../context/AuthContext";

// Pending Videos popup (2026-10-28).
// Shown to a student every time they open the app (a new login, or opening
// the site/app again after closing it). It lists every recorded class they
// haven't finished yet. For each one they must pick the date they will
// finish it by — the app stays locked behind this popup until every
// video without a date (or whose promised date has passed) has a new date.
// When all videos already have future dates, the popup is just a reminder
// with a Continue button.
//
// The admin can switch this off from Dashboard → Video Tracker.
// Data: GET/POST /api/video-commitments/me (backend computes the list).
//
// Colours are plain hex (not Tailwind palette colours) so the buttons stay
// visible on old phones/laptops whose browsers don't understand oklch().

// Never interrupt an exam in progress or the profile form.
const SKIP_PATHS = [/^\/attend-exam\//, /^\/profile/, /^\/login/, /^\/signup/];

const formatDate = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (seconds) => {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

// A date the student must (re)choose: no date yet, or their date passed.
const needsNewDate = (item) => item.status === "no_date" || item.status === "missed";

const sessionKey = (userId) => {
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
  } catch {
    /* storage blocked */
  }
  return `pendingVideosSeen:${userId}:${token.slice(-16)}`;
};

const markSeen = (userId) => {
  try {
    sessionStorage.setItem(sessionKey(userId), "1");
  } catch {
    /* storage blocked — the popup may show again on reload, that's fine */
  }
};

const wasSeen = (userId) => {
  try {
    return sessionStorage.getItem(sessionKey(userId)) === "1";
  } catch {
    return false;
  }
};

const StatusBadge = ({ item }) => {
  if (item.status === "missed") {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#b91c1c]">
        Date missed{item.targetDate ? ` (${formatDate(item.targetDate)})` : ""}
      </span>
    );
  }
  if (item.status === "no_date") {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">
        Pick a date
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534]">
      Planned: {formatDate(item.targetDate)}
    </span>
  );
};

const PendingVideosPopup = () => {
  const { userData, handleLogout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState({});
  const [allDate, setAllDate] = useState("");
  const [saving, setSaving] = useState(false);

  const isStudent =
    userData?.role === "student" &&
    userData?.accountType !== "free_trial" &&
    userData?.profileCompleted;
  const userId = userData?._id;
  const skipHere = SKIP_PATHS.some((re) => re.test(location.pathname));

  // Logged out (or another student logged in on this tab) — start fresh.
  useEffect(() => {
    setData(null);
    setOpen(false);
  }, [userId]);

  // Load once per app opening (per login + per browser tab session).
  useEffect(() => {
    if (!isStudent || !userId || skipHere || open || data) return;
    let cancelled = false;
    api
      .get("/video-commitments/me")
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data;
        if (!d?.enabled || !d.items?.length) {
          markSeen(userId);
          return;
        }
        // Already seen in this session and nothing to fix — don't nag again.
        if (!d.needsDates && wasSeen(userId)) return;
        setData(d);
        const initial = {};
        d.items.forEach((it) => {
          initial[it.videoId] = needsNewDate(it) ? "" : it.targetDate || "";
        });
        setDates(initial);
        setOpen(true);
      })
      .catch(() => {
        /* never block the app because of this popup failing to load */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, userId, skipHere]);

  // Stop the page behind from scrolling while the popup is open.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = data?.items || [];
  const missingCount = useMemo(
    () => items.filter((it) => needsNewDate(it) && !dates[it.videoId]).length,
    [items, dates]
  );
  const changed = useMemo(
    () =>
      items.filter((it) => dates[it.videoId] && dates[it.videoId] !== (needsNewDate(it) ? "" : it.targetDate)),
    [items, dates]
  );

  if (!open || !data || skipHere) return null;

  const missedCount = items.filter((it) => it.status === "missed").length;
  const noDateCount = items.filter((it) => it.status === "no_date").length;
  const blocking = items.some(needsNewDate);

  const applyAll = () => {
    if (!allDate) {
      toast.error("Pick a date first.");
      return;
    }
    const next = { ...dates };
    let clipped = 0;
    items.forEach((it) => {
      if (!needsNewDate(it) && dates[it.videoId]) return; // keep planned ones
      let d = allDate < it.minDate ? it.minDate : allDate;
      if (d > it.maxDate) {
        d = it.maxDate;
        clipped += 1;
      }
      next[it.videoId] = d;
    });
    setDates(next);
    if (clipped) {
      toast(`${clipped} video(s) close earlier, so their date was set to their last day.`, { icon: "ℹ️" });
    }
  };

  // Returns true when the popup was closed.
  const save = async () => {
    if (missingCount > 0) {
      toast.error(`Pick a date for ${missingCount} more video(s).`);
      return false;
    }
    const payload = changed.map((it) => ({ videoId: it.videoId, date: dates[it.videoId] }));
    if (payload.length === 0) {
      markSeen(userId);
      setOpen(false);
      return true;
    }
    try {
      setSaving(true);
      const res = await api.post("/video-commitments/me", { items: payload });
      const d = res.data?.data;
      if (d?.needsDates) {
        // Something changed meanwhile (e.g. a new video) — show the new list.
        setData(d);
        toast.error("Please pick a date for the remaining videos.");
        return false;
      }
      toast.success("Thank you! Your plan is saved.");
      markSeen(userId);
      setOpen(false);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const doLogout = () => {
    setOpen(false);
    if (typeof handleLogout === "function") handleLogout();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(17, 24, 39, 0.65)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-videos-title"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#e5e7eb]">
          <h2 id="pending-videos-title" className="text-xl font-bold text-[#111827]">
            📺 You have {items.length} pending video{items.length === 1 ? "" : "s"}
          </h2>
          <p className="text-sm text-[#4b5563] mt-1">
            {blocking
              ? "Tell us the date by which you will finish each video. You can continue after saving."
              : "Here is your plan. Keep watching to finish on time!"}
          </p>
          {(missedCount > 0 || noDateCount > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {missedCount > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#fee2e2] text-[#b91c1c]">
                  🔴 {missedCount} date{missedCount === 1 ? "" : "s"} missed — pick a new date
                </span>
              )}
              {noDateCount > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#fef3c7] text-[#92400e]">
                  🟠 {noDateCount} without a date
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick fill */}
        {blocking && items.length > 1 && (
          <div className="px-5 py-3 bg-[#eef2ff] flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#3730a3] font-medium">Same date for all:</span>
            <input
              type="date"
              value={allDate}
              min={data.today}
              onChange={(e) => setAllDate(e.target.value)}
              className="border border-[#c7d2fe] rounded-lg px-2 py-1 bg-white text-[#111827]"
            />
            <button
              type="button"
              onClick={applyAll}
              className="px-3 py-1 rounded-lg bg-[#4f46e5] text-white font-medium"
            >
              Apply
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.map((it) => {
            const value = dates[it.videoId] || "";
            const missing = needsNewDate(it) && !value;
            return (
              <div
                key={it.videoId}
                className={`border rounded-xl p-3 ${
                  missing ? "border-[#fca5a5] bg-[#fff7f7]" : "border-[#e5e7eb] bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827] break-words">{it.title}</p>
                    <p className="text-xs text-[#6b7280]">
                      {[it.subject, it.subtopic].filter(Boolean).join(" › ") || "Recorded class"}
                      {it.durationSeconds ? ` · ${formatDuration(it.durationSeconds)}` : ""}
                    </p>
                  </div>
                  <StatusBadge item={it} />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6366f1]"
                      style={{ width: `${Math.min(100, it.percentWatched || 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#4b5563] w-20 text-right">
                    {it.percentWatched > 0 ? `${Math.round(it.percentWatched)}% watched` : "Not started"}
                  </span>
                </div>

                <label className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <span className="text-[#374151]">I will finish by:</span>
                  <input
                    type="date"
                    value={value}
                    min={it.minDate}
                    max={it.maxDate}
                    onChange={(e) => setDates((prev) => ({ ...prev, [it.videoId]: e.target.value }))}
                    className={`border rounded-lg px-2 py-1 bg-white text-[#111827] ${
                      missing ? "border-[#ef4444]" : "border-[#d1d5db]"
                    }`}
                  />
                  <span className="text-xs text-[#6b7280]">(last day: {formatDate(it.maxDate)})</span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={doLogout} className="text-sm text-[#6b7280] underline">
            Logout
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                save().then((closed) => {
                  if (closed) navigate("/recorded-classes");
                });
              }}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-[#4f46e5] text-[#4f46e5] font-semibold bg-white"
            >
              ▶ Save & watch now
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-xl font-semibold text-white"
              style={{ backgroundColor: missingCount > 0 ? "#a5b4fc" : "#4f46e5" }}
            >
              {saving ? "Saving..." : missingCount > 0 ? `Pick ${missingCount} more date${missingCount === 1 ? "" : "s"}` : blocking || changed.length ? "Save & continue" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingVideosPopup;
