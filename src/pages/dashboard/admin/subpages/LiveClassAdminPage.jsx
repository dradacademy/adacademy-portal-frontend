import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import { Megaphone, PlayCircle } from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

const EMPTY_FORM = {
  title: "",
  category: EXAM_CATEGORY_OPTIONS[0].value,
  youtubeUrl: "",
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Admin control for "Live Now": start/end which YouTube Live stream (if
// any) students in a category currently see as joinable in-app. This is
// deliberately independent from Recorded Classes (recordedClassModel) —
// a live session and an on-demand recording have different lifecycles
// (transient/manual vs. durable/scheduled visibility window) — though the
// same class is often added to Recorded Classes separately once it ends,
// same as before this feature existed.
const LiveClassAdminPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/live-classes`
      );
      setHistory(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load live class history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const activeLiveClasses = history.filter((lc) => lc.active);

  const handleGoLive = async () => {
    if (!form.title || !form.category || !form.youtubeUrl) {
      toast.error("Please fill in the title, category, and YouTube Live link.");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${import.meta.env.VITE_APP_API_URL}/live-classes`, form);
      toast.success("You're live — students in this category can now join.");
      setForm(EMPTY_FORM);
      fetchHistory();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to start the live class."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEndLive = async (liveClass) => {
    setEnding(liveClass._id);
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/${liveClass._id}/end`
      );
      toast.success("Live class ended.");
      fetchHistory();
    } catch (error) {
      toast.error("Failed to end the live class.");
    } finally {
      setEnding(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-inter">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-stone-700 font-bold font-poppins">
          Live Class
        </h1>
        <p className="text-stone-400 font-medium">
          Start your YouTube Live stream as usual, then paste its watch link
          here so students in that category can join it from inside the
          app. Once the class ends, add it to Recorded Classes separately if
          you want it kept on-demand.
        </p>
      </div>

      {/* Currently live */}
      {activeLiveClasses.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeLiveClasses.map((lc) => (
            <div
              key={lc._id}
              className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
                <div>
                  <p className="font-medium text-gray-800">{lc.title}</p>
                  <p className="text-xs text-gray-500">
                    {getCategoryLabel(lc.category)} · started {formatTime(lc.startedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEndLive(lc)}
                disabled={ending === lc._id}
                className="bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {ending === lc._id ? "Ending…" : "End Live"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Go live form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 max-w-xl">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-rose-500" />
          Go Live
        </h2>
        <input
          type="text"
          placeholder="Class Title"
          className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          disabled={saving}
        />
        <Select
          className="w-full"
          placeholder="Exam Category"
          options={EXAM_CATEGORY_OPTIONS}
          value={EXAM_CATEGORY_OPTIONS.find((opt) => opt.value === form.category)}
          onChange={(selectedOption) =>
            setForm({ ...form, category: selectedOption.value })
          }
          isDisabled={saving}
          isSearchable={false}
          styles={{
            control: (base) => ({
              ...base,
              borderRadius: "15px",
              padding: "4px",
              borderColor: "#ccc",
              boxShadow: "none",
              "&:hover": { borderColor: "#888" },
            }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
          menuPortalTarget={document.body}
          menuPosition="absolute"
        />
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="YouTube Live watch link (e.g. https://youtube.com/watch?v=VIDEOID)"
            className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
            value={form.youtubeUrl}
            onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
            disabled={saving}
          />
          <p className="text-xs text-gray-400">
            Start the broadcast on YouTube first (Unlisted recommended),
            then paste its watch link here. Starting a new live class for a
            category automatically ends any other one already live in that
            same category.
          </p>
        </div>
        <button
          onClick={handleGoLive}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <PlayCircle className="h-4 w-4" />
          {saving ? "Starting…" : "Go Live"}
        </button>
      </div>

      {/* Recent history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Ended</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No live classes started yet.
                </td>
              </tr>
            ) : (
              history.map((lc) => (
                <tr key={lc._id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{lc.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {getCategoryLabel(lc.category)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatTime(lc.startedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatTime(lc.endedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lc.active
                          ? "bg-rose-100 text-rose-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {lc.active ? "Live" : "Ended"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveClassAdminPage;
