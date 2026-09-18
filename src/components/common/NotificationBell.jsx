import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bell, Video, FileText, Paperclip, Megaphone } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const TYPE_ICON = {
  video: Video,
  test: FileText,
  attachment: Paperclip,
  announcement: Megaphone,
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// A shared notification bell (Navbar) — new recorded classes, new tests,
// new attachments, and admin announcements all surface here, fetched from
// GET /api/notifications. Unread is a rolling watermark, not a per-item
// read receipt (see notificationModel.js): opening this panel marks
// everything currently listed as "seen" going forward, so the badge only
// ever reflects what's genuinely new since the student last checked.
const NotificationBell = () => {
  const { userData } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/notifications`
      );
      setNotifications(response.data?.data || []);
    } catch (error) {
      // Silent — a notification-fetch failure shouldn't interrupt the rest
      // of the page.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.isNew).length;

  const handleToggle = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      try {
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/notifications/mark-seen`
        );
        setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
      } catch (error) {
        // Best-effort — badge just won't clear until next successful call.
      }
    }
  };

  if (!userData?._id) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-400 py-8 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Nothing yet.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <div
                    key={n._id}
                    className={`px-4 py-3 border-b border-gray-50 last:border-0 flex items-start gap-3 ${
                      n.isNew ? "bg-indigo-50/60" : ""
                    }`}
                  >
                    <div className="mt-0.5 h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
