import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Megaphone, X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

// A prominent, scrolling marquee bar for admin announcements specifically —
// separate from the generic "N new updates" banner (NewUpdatesBanner.jsx),
// which covers all four notification types (video/test/attachment/
// announcement) as a quiet preview list. The admin's own words for this
// one: "an important notification should be available to the students as
// scrolling or something visible in front page... visible to them until
// they see it and i post the next new announcement." Both halves of that
// are already satisfied by the same rolling-watermark model the rest of
// the notification system uses (see notificationController.js /
// User.lastSeenNotificationsAt): an announcement counts as "new" from the
// moment it's posted until the student dismisses it, and a FRESH
// announcement posted after that becomes new again on its own — no extra
// state needed. Dismissing this ticker advances the same shared watermark
// the bell dropdown uses, so it also clears the bell's badge; that
// coupling is a deliberate simplicity tradeoff (one rolling watermark
// rather than a separate per-type read-state), consistent with the rest
// of this notification system.
const AnnouncementTicker = () => {
  const { userData } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userData?._id) return;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/notifications`)
      .then((response) => {
        const items = (response.data?.data || []).filter(
          (n) => n.type === "announcement" && n.isNew
        );
        setAnnouncements(items);
      })
      .catch(() => {
        // Silent — a missed ticker isn't worth surfacing an error for.
      });
  }, [userData]);

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await axios.post(`${import.meta.env.VITE_APP_API_URL}/notifications/mark-seen`);
    } catch (error) {
      // Best-effort — worst case it shows again next visit.
    }
  };

  if (dismissed || announcements.length === 0) return null;

  const tickerText = announcements
    .map((a) => (a.message ? `${a.title} — ${a.message}` : a.title))
    .join("    •    ");

  return (
    <div className="mb-4 bg-rose-600 text-white rounded-2xl overflow-hidden flex items-center">
      <div className="flex items-center gap-2 bg-rose-700 px-4 py-2.5 shrink-0">
        <Megaphone className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Announcement
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative py-2.5">
        <div className="whitespace-nowrap animate-marquee text-sm font-medium px-4">
          {tickerText}
          <span className="px-12" />
          {tickerText}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="px-3 py-2.5 hover:bg-rose-700 shrink-0"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee-scroll 18s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementTicker;
