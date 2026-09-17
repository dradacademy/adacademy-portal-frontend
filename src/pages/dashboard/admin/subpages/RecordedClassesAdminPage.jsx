import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import { Youtube, Video, Trash2, Pencil } from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: EXAM_CATEGORY_OPTIONS[0].value,
  recordedDate: new Date().toISOString().slice(0, 10),
  youtubeUrl: "",
  durationMinutes: "",
};

// Admin management for the in-app recorded-class list. The admin uploads
// the actual class recording to their own YouTube account (as Unlisted —
// not publicly searchable) and pastes the link here; this page only ever
// stores the video ID + metadata, never a file. Playback/access is still
// gated in-app by category + course enrollment (see videoPlaybackController
// on the backend) — what changed from the earlier Cloudflare Stream design
// is that once a student presses play it's an ordinary YouTube embed, with
// no true anti-download protection.
const RecordedClassesAdminPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const [openFormPopup, setOpenFormPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes`,
        { params: activeCategory !== "all" ? { category: activeCategory } : {} }
      );
      setRecordings(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load recorded classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleClosePopup = () => {
    setOpenFormPopup(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpenFormPopup(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingId(rec._id);
    setForm({
      title: rec.title,
      description: rec.description || "",
      category: rec.category,
      recordedDate: rec.recordedDate
        ? new Date(rec.recordedDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      youtubeUrl: `https://youtu.be/${rec.youtubeVideoId}`,
      durationMinutes: rec.durationSeconds
        ? String(Math.round(rec.durationSeconds / 60))
        : "",
    });
    setOpenFormPopup(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category || !form.recordedDate || !form.youtubeUrl) {
      toast.error("Please fill in the title, category, recorded date, and YouTube link.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        recordedDate: form.recordedDate,
        youtubeUrl: form.youtubeUrl,
        durationSeconds: form.durationMinutes
          ? Number(form.durationMinutes) * 60
          : null,
      };

      if (editingId) {
        await axios.patch(
          `${import.meta.env.VITE_APP_API_URL}/recorded-classes/${editingId}`,
          payload
        );
        toast.success("Recording updated.");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/recorded-classes`,
          payload
        );
        toast.success("Recording added — students in this category can now see it.");
      }

      handleClosePopup();
      fetchRecordings();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save the recording."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (recording) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/${recording._id}`,
        { active: !recording.active }
      );
      toast.success(recording.active ? "Recording retired." : "Recording re-activated.");
      fetchRecordings();
    } catch (error) {
      toast.error("Failed to update recording.");
    }
  };

  const handleDelete = async (recording) => {
    if (
      !window.confirm(
        `Remove "${recording.title}" from the app? The video itself stays on YouTube — this only removes it from here.`
      )
    ) {
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/${recording._id}`
      );
      toast.success("Recording removed.");
      fetchRecordings();
    } catch (error) {
      toast.error("Failed to remove recording.");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-inter">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Recorded Classes
          </h1>
          <p className="text-stone-400 font-medium">
            Upload the class recording to YouTube as Unlisted, then paste
            the link here. Students only see it while their course
            enrollment is active.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          <Youtube className="h-4 w-4" /> Add Recording
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
            activeCategory === "all"
              ? "bg-indigo-500 text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          All Categories
        </button>
        {EXAM_CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveCategory(opt.value)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
              activeCategory === opt.value
                ? "bg-indigo-500 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Recordings list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Recorded Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : recordings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  No recordings added yet.
                </td>
              </tr>
            ) : (
              recordings.map((rec) => (
                <tr key={rec._id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">{rec.title}</p>
                        {rec.description && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {rec.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {getCategoryLabel(rec.category)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(rec.recordedDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rec.durationSeconds
                      ? `${Math.floor(rec.durationSeconds / 60)}m ${
                          rec.durationSeconds % 60
                        }s`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {rec.active ? "Active" : "Retired"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(rec)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition duration-300 cursor-pointer ${
                          rec.active
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {rec.active ? "Retire" : "Re-activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/edit dialog */}
      <Dialog open={openFormPopup} onClose={saving ? undefined : handleClosePopup}>
        <div className="flex flex-col gap-5 sm:min-w-[500px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                {editingId ? "Edit Recording" : "Add Recording"}
              </h1>
              <p className="text-sm text-stone-500 font-work-sans">
                Upload the class to YouTube as Unlisted first, then paste
                its link below.
              </p>
            </div>
            {!saving && (
              <MdClose
                onClick={handleClosePopup}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <div className="flex flex-col gap-2 font-inter">
            <input
              type="text"
              placeholder="Class Title"
              className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={saving}
            />
            <textarea
              placeholder="Description (optional)"
              className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <label className="text-sm text-stone-500 font-medium">
                Recorded Date
              </label>
              <input
                type="date"
                className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
                value={form.recordedDate}
                onChange={(e) => setForm({ ...form, recordedDate: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-stone-500 font-medium">
                YouTube Link
              </label>
              <input
                type="text"
                placeholder="https://youtu.be/VIDEOID or the full watch link"
                className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                disabled={saving}
              />
              <p className="text-xs text-gray-400">
                Upload as <span className="font-medium">Unlisted</span> on
                YouTube (not Public) so it doesn't show up in search or on
                your channel — the in-app enrollment check is what actually
                controls who can watch it here.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-stone-500 font-medium">
                Duration in minutes (optional — fills in "% watched" analytics)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 180 for a 3-hour class"
                className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={handleClosePopup}
              disabled={saving}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Recording"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RecordedClassesAdminPage;
