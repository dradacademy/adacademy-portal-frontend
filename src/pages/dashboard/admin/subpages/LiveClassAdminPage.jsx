import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import {
  Megaphone,
  PlayCircle,
  Trash2,
  Pencil,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import {
  EXAM_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "../../../../constants/examCategories";

// Same click-to-sort column header used across the other admin tables.
const SortableTh = ({ label, sortKey, sort, onSort, className = "" }) => {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 uppercase tracking-wide font-semibold hover:text-indigo-600 duration-150 ${
          active ? "text-indigo-600" : ""
        }`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
};

const SORTERS = {
  title: (r) => (r.title || "").toLowerCase(),
  category: (r) => (getCategoryLabel(r.category) || "").toLowerCase(),
  startedAt: (r) => (r.startedAt ? new Date(r.startedAt).getTime() : null),
  endedAt: (r) => (r.endedAt ? new Date(r.endedAt).getTime() : null),
  status: (r) => (r.active ? 1 : 0),
};

const EMPTY_FORM = {
  title: "",
  category: EXAM_CATEGORY_OPTIONS[0].value,
  youtubeUrl: "",
};

const EMPTY_EDIT_FORM = {
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
  const [deleting, setDeleting] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortedHistory = useMemo(() => {
    if (!sort.key || !SORTERS[sort.key]) return history;
    const getValue = SORTERS[sort.key];
    const dirMultiplier = sort.dir === "asc" ? 1 : -1;
    return [...history].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      // Nulls/undefined always sink to the bottom, in either direction.
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb)) * dirMultiplier;
      }
      return (va - vb) * dirMultiplier;
    });
  }, [history, sort]);

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

  // Edit metadata on an existing entry — title, category, or swap the
  // YouTube link itself — without touching whether it's live/ended (that
  // stays owned by Go Live/End Live/Delete). Works on both a currently-live
  // entry and a past one, same as Recorded Classes' Edit.
  const handleOpenEdit = (liveClass) => {
    setEditingId(liveClass._id);
    setEditForm({
      title: liveClass.title,
      category: liveClass.category,
      youtubeUrl: `https://youtu.be/${liveClass.youtubeVideoId}`,
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title || !editForm.category || !editForm.youtubeUrl) {
      toast.error("Please fill in the title, category, and YouTube link.");
      return;
    }

    setEditSaving(true);
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/${editingId}`,
        editForm
      );
      toast.success("Live class updated.");
      handleCloseEdit();
      fetchHistory();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update the live class."
      );
    } finally {
      setEditSaving(false);
    }
  };

  // Permanently removes a live-class entry — from the admin's history table
  // AND from student view (if it happened to still be the live one). Unlike
  // "End Live" (which just marks it no longer ongoing but keeps the history
  // row), this deletes the record entirely — for cleaning up a duplicate or
  // mistaken entry, not the normal end-of-class flow.
  const handleDelete = async (liveClass) => {
    const confirmed = window.confirm(
      `Delete "${liveClass.title}" from the live class history? This can't be undone.${
        liveClass.active
          ? " It's currently LIVE — deleting it will immediately remove it from students' view too."
          : ""
      }`
    );
    if (!confirmed) return;

    setDeleting(liveClass._id);
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/${liveClass._id}`
      );
      toast.success("Deleted.");
      fetchHistory();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete the live class."
      );
    } finally {
      setDeleting(null);
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(lc)}
                  disabled={ending === lc._id || deleting === lc._id}
                  title="Edit"
                  className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEndLive(lc)}
                  disabled={ending === lc._id || deleting === lc._id}
                  className="bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {ending === lc._id ? "Ending…" : "End Live"}
                </button>
                <button
                  onClick={() => handleDelete(lc)}
                  disabled={deleting === lc._id || ending === lc._id}
                  title="Delete this entry entirely"
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
              <SortableTh label="Title" sortKey="title" sort={sort} onSort={handleSort} />
              <SortableTh label="Category" sortKey="category" sort={sort} onSort={handleSort} />
              <SortableTh label="Started" sortKey="startedAt" sort={sort} onSort={handleSort} />
              <SortableTh label="Ended" sortKey="endedAt" sort={sort} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : sortedHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  No live classes started yet.
                </td>
              </tr>
            ) : (
              sortedHistory.map((lc) => (
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(lc)}
                        disabled={deleting === lc._id}
                        title="Edit"
                        className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lc)}
                        disabled={deleting === lc._id}
                        title="Delete this entry entirely"
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 disabled:opacity-50"
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={editSaving ? undefined : handleCloseEdit}>
        <div className="flex flex-col gap-5 sm:min-w-[500px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                Edit Live Class
              </h1>
              <p className="text-sm text-stone-500 font-work-sans">
                Update the title, category, or YouTube link. Whether it's
                live or ended isn't changed here.
              </p>
            </div>
            {!editSaving && (
              <MdClose
                onClick={handleCloseEdit}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <div className="flex flex-col gap-2 font-inter">
            <input
              type="text"
              placeholder="Class Title"
              className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              disabled={editSaving}
            />
            <Select
              className="w-full"
              placeholder="Exam Category"
              options={EXAM_CATEGORY_OPTIONS}
              value={EXAM_CATEGORY_OPTIONS.find((opt) => opt.value === editForm.category)}
              onChange={(selectedOption) =>
                setEditForm({ ...editForm, category: selectedOption.value })
              }
              isDisabled={editSaving}
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
                value={editForm.youtubeUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, youtubeUrl: e.target.value })
                }
                disabled={editSaving}
              />
              <p className="text-xs text-gray-400">
                Only change this if you need to point students at a
                different YouTube video/stream for this entry.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={handleCloseEdit}
              disabled={editSaving}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LiveClassAdminPage;
