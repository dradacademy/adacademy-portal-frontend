import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { X, Sparkles } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

// A prominent, dismissible "N new updates" banner for the student's own
// front page (StudentActivities.jsx) — the admin specifically asked for
// new content to be visible there the first time a student sees it, not
// just tucked away in the notification bell. Shows only while there's at
// least one unseen notification (new video/test/attachment/announcement);
// dismissing it marks everything seen, same watermark the bell dropdown
// uses, so it won't reappear until something genuinely new is posted.
const NewUpdatesBanner = () => {
  const { userData } = useContext(AuthContext);
  const [newItems, setNewItems] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userData?._id) return;
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/notifications`)
      .then((response) => {
        const items = (response.data?.data || []).filter((n) => n.isNew);
        setNewItems(items);
      })
      .catch(() => {
        // Silent — a missed banner isn't worth surfacing an error for.
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

  if (dismissed || newItems.length === 0) return null;

  const preview = newItems.slice(0, 3);

  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-white border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">
          {newItems.length} new update{newItems.length === 1 ? "" : "s"} since your last visit
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {preview.map((item) => (
            <li key={item._id} className="text-xs text-gray-600 truncate">
              • {item.title}
            </li>
          ))}
          {newItems.length > preview.length && (
            <li className="text-xs text-gray-400">
              and {newItems.length - preview.length} more…
            </li>
          )}
        </ul>
      </div>
      <button
        onClick={handleDismiss}
        className="text-gray-400 hover:text-gray-600 shrink-0"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NewUpdatesBanner;
