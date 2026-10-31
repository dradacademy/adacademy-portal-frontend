import axios from "axios";
import SubjectTopicPicker, { PartBadge } from "../../../../components/dashboard/admin/SubjectTopicPicker";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import {
  Youtube,
  Video,
  Trash2,
  Pencil,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  CalendarPlus,
  FolderTree,
  Sparkles,
} from "lucide-react";
import {
  NO_SUBJECT,
  NO_SUBTOPIC,
  listSubjects,
  listSubtopics,
  subjectKey,
  subtopicKey,
  suggestGroupings,
} from "../../../../utils/recordedClassGroups";
import AdminVideoPreviewDialog from "../../../../components/dashboard/admin/AdminVideoPreviewDialog";
import AvailabilityPicker from "../../../../components/dashboard/admin/AvailabilityPicker";
import {
  availabilityFromRecord,
  availabilityToPayload,
  daysLeft,
  defaultAvailability,
  formatIstDate,
} from "../../../../utils/classAvailability";
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
  recordedDate: (r) => (r.recordedDate ? new Date(r.recordedDate).getTime() : null),
  duration: (r) => r.durationSeconds ?? null,
  availableUntil: (r) =>
    r.effectiveAvailableUntil ? new Date(r.effectiveAvailableUntil).getTime() : Infinity,
  status: (r) => (r.active ? 1 : 0),
  // Subject A→Z, then subtopic, then class date — the student's browsing order.
  // "0"/"1" prefixes put missing subject/subtopic last (localeCompare
  // ignores the order of symbols like "~").
  group: (r) =>
    `${r.subject ? `0${r.subject.name.toLowerCase()}` : "1"}|${
      r.subtopic ? `0${r.subtopic.name.toLowerCase()}` : "1"
    }|${r.recordedDate ? String(new Date(r.recordedDate).getTime()).padStart(15, "0") : ""}`,
};

const ALL = "__all__";

const selectCls =
  "border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white text-sm disabled:opacity-60";

// Subject + Subtopic + Theory/Problems pickers — shared component (with
// "+ New subject / subtopic" right in the form), see SubjectTopicPicker.
const SubjectSubtopicFields = (props) => <SubjectTopicPicker {...props} />;

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
  subject: "",
  subtopic: "",
  part: "",
  availability: defaultAvailability(),
  // Only send availability on Edit when the admin actually changed it, so
  // fixing a title on an already-expired class doesn't trip the "date
  // can't be in the past" check.
  availabilityTouched: false,
};

// "Available until" cell: the last day students can watch (IST), with a
// status label — Never expires / Expired / Expires today / Expires in N
// days / Active — and a quick "+7 days" extend button.
const AvailabilityCell = ({ rec, onExtend, extending }) => {
  if (rec.availabilityMode === "never" || !rec.effectiveAvailableUntil) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
        Never expires
      </span>
    );
  }
  const left = daysLeft(rec.effectiveAvailableUntil);
  let badge;
  if (rec.isExpired) badge = { text: "Expired", cls: "bg-rose-100 text-rose-700" };
  else if (left === 0) badge = { text: "Expires today", cls: "bg-amber-100 text-amber-700" };
  else if (left <= 2) badge = { text: `Expires in ${left} day${left === 1 ? "" : "s"}`, cls: "bg-amber-100 text-amber-700" };
  else badge = { text: "Available", cls: "bg-emerald-100 text-emerald-700" };
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-gray-700">{formatIstDate(rec.effectiveAvailableUntil)}</span>
      <div className="flex items-center gap-1.5">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.cls}`}>
          {badge.text}
        </span>
        <button
          type="button"
          onClick={() => onExtend(rec)}
          disabled={extending}
          title="Extend by 7 days (from today if already expired)"
          className="flex items-center gap-0.5 text-[11px] font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          <CalendarPlus className="h-3 w-3" />
          +7 days
        </button>
      </div>
    </div>
  );
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
  const [preview, setPreview] = useState(null);
  const [backfilling, setBackfilling] = useState(false);

  // Subject → Subtopic grouping.
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [subtopicFilter, setSubtopicFilter] = useState(ALL);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupValue, setGroupValue] = useState({ subject: "", subtopic: "", part: null });
  const [groupSaving, setGroupSaving] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestPicked, setSuggestPicked] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/subjects/get`)
      .then((res) => setAllSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Couldn't load subjects."));
  }, []);

  // A subject added/changed from the form ("+ New") — update the list in place.
  const upsertSubject = (subj) =>
    setAllSubjects((prev) =>
      prev.some((s) => String(s._id) === String(subj._id))
        ? prev.map((s) => (String(s._id) === String(subj._id) ? subj : s))
        : [...prev, subj]
    );

  const subjectsForCategory = (category) =>
    allSubjects
      .filter((s) => s.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));

  // One click: add every already-ended live class that isn't in Recorded
  // Classes yet (new ones are added automatically by End Live). Safe to
  // click again — anything already here is skipped.
  const handleBackfillFromLive = async () => {
    const confirmed = window.confirm(
      "Add all past (already ended) live classes that aren't in Recorded Classes yet?\n\nAnything already here (same video) is skipped. Older ones keep their original class date, so their availability may already be over — use \"+7 days\" or Edit to show them to students again."
    );
    if (!confirmed) return;
    setBackfilling(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/live-classes/backfill-recordings`
      );
      if (data.created > 0) {
        toast.success(
          `Added ${data.created} past live class(es) to Recorded Classes. ${data.skipped} were already here.`
        );
      } else {
        toast.success(`Nothing to add — all ${data.totalEnded} past live classes are already here.`);
      }
      if (data.failed > 0) toast.error(`${data.failed} couldn't be added — add them with Add Recording.`);
      fetchRecordings();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add past live classes.");
    } finally {
      setBackfilling(false);
    }
  };

  const [openFormPopup, setOpenFormPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // Row checkboxes + bulk availability.
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAvailability, setBulkAvailability] = useState(defaultAvailability());
  const [bulkSaving, setBulkSaving] = useState(false);

  const toggleSelected = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const sendBulk = async (ids, body, successText) => {
    const { data } = await axios.patch(
      `${import.meta.env.VITE_APP_API_URL}/recorded-classes/bulk-availability`,
      { ids, ...body }
    );
    toast.success(successText(data));
    if (data?.skippedNeverExpires) {
      toast(`${data.skippedNeverExpires} already never expire — left as they are.`);
    }
    fetchRecordings();
    return data;
  };

  const handleExtend = async (ids) => {
    setBulkSaving(true);
    try {
      await sendBulk(ids, { extendDays: 7 }, (d) =>
        d.updated === 1 ? "Extended by 7 days." : `Extended ${d.updated} recordings by 7 days.`
      );
      setSelectedIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to extend.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleApplyBulk = async () => {
    const payload = availabilityToPayload(bulkAvailability);
    if (payload.error) {
      toast.error(payload.error);
      return;
    }
    setBulkSaving(true);
    try {
      await sendBulk(selectedIds, payload, () =>
        `Updated availability for ${selectedIds.length} recording${selectedIds.length === 1 ? "" : "s"}.`
      );
      setBulkOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update availability.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortedRecordings = useMemo(() => {
    if (!sort.key || !SORTERS[sort.key]) return recordings;
    const getValue = SORTERS[sort.key];
    const dirMultiplier = sort.dir === "asc" ? 1 : -1;
    return [...recordings].sort((a, b) => {
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
  }, [recordings, sort]);

  // Filter dropdowns list only subjects/subtopics that have recordings in
  // the current category tab.
  const subjectOptions = useMemo(() => listSubjects(recordings), [recordings]);
  const activeSubject = subjectOptions.some((s) => s.key === subjectFilter) ? subjectFilter : ALL;
  const subtopicOptions = useMemo(
    () =>
      activeSubject === ALL || activeSubject === NO_SUBJECT
        ? []
        : listSubtopics(recordings.filter((r) => subjectKey(r) === activeSubject)),
    [recordings, activeSubject]
  );
  const activeSubtopic = subtopicOptions.some((t) => t.key === subtopicFilter) ? subtopicFilter : ALL;

  const visibleRecordings = useMemo(
    () =>
      sortedRecordings.filter(
        (r) =>
          (activeSubject === ALL || subjectKey(r) === activeSubject) &&
          (activeSubtopic === ALL || subtopicKey(r) === activeSubtopic)
      ),
    [sortedRecordings, activeSubject, activeSubtopic]
  );

  const ungroupedCount = recordings.filter((r) => !r.subject).length;
  const noSubtopicCount = recordings.filter((r) => r.subject && !r.subtopic).length;

  // Categories of the checked rows — the bulk Group dialog offers subjects
  // from these categories only.
  const selectedCategories = [
    ...new Set(recordings.filter((r) => selectedIds.includes(r._id)).map((r) => r.category)),
  ];

  const handleBulkGroup = async () => {
    setGroupSaving(true);
    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/bulk-group`,
        {
          ids: selectedIds,
          subject: groupValue.subject || null,
          subtopic: groupValue.subtopic || null,
          ...(groupValue.part === null || groupValue.part === undefined ? {} : { part: groupValue.part }),
        }
      );
      toast.success(
        groupValue.subject
          ? `Grouped ${data.updated} recording${data.updated === 1 ? "" : "s"}.`
          : `Removed grouping from ${data.updated} recording${data.updated === 1 ? "" : "s"}.`
      );
      if (data.skippedOtherCategory) {
        toast(`${data.skippedOtherCategory} skipped — they're in a different exam category than that subject.`);
      }
      setGroupOpen(false);
      setSelectedIds([]);
      fetchRecordings();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to group recordings.");
    } finally {
      setGroupSaving(false);
    }
  };

  const openSuggestions = () => {
    const found = suggestGroupings(recordings, allSubjects);
    if (found.length === 0) {
      toast("No subject or subtopic names found in the titles of ungrouped recordings. Use the checkboxes and \"Group into subject…\" instead.");
      return;
    }
    setSuggestions(found);
    setSuggestPicked(found.map((f) => f.rec._id));
    setSuggestOpen(true);
  };

  const applySuggestions = async () => {
    const picked = suggestions.filter((f) => suggestPicked.includes(f.rec._id));
    if (picked.length === 0) {
      setSuggestOpen(false);
      return;
    }
    // One bulk call per (subject, subtopic) pair.
    const batches = new Map();
    picked.forEach((f) => {
      const key = `${f.subject._id}|${f.subtopic?._id || ""}`;
      const batch = batches.get(key) || { subject: f.subject._id, subtopic: f.subtopic?._id || null, ids: [] };
      batch.ids.push(f.rec._id);
      batches.set(key, batch);
    });
    setGroupSaving(true);
    let done = 0;
    try {
      for (const batch of batches.values()) {
        const { data } = await axios.patch(
          `${import.meta.env.VITE_APP_API_URL}/recorded-classes/bulk-group`,
          batch
        );
        done += data.updated || 0;
      }
      toast.success(`Grouped ${done} recording${done === 1 ? "" : "s"}.`);
      setSuggestOpen(false);
    } catch (error) {
      toast.error(
        `${done ? `Grouped ${done}, then stopped: ` : ""}${
          error?.response?.data?.message || "Failed to apply suggestions."
        }`
      );
    } finally {
      setGroupSaving(false);
      fetchRecordings();
    }
  };

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
    setSelectedIds([]);
    setSubjectFilter(ALL);
    setSubtopicFilter(ALL);
    fetchRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Changing the subject/subtopic filter clears ticks on rows now hidden.
  useEffect(() => {
    setSelectedIds([]);
  }, [activeSubject, activeSubtopic]);

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
      subject: rec.subject?._id || "",
      subtopic: rec.subtopic?._id || "",
      part: rec.part || "",
      availability: availabilityFromRecord(rec),
      availabilityTouched: false,
    });
    setOpenFormPopup(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category || !form.recordedDate || !form.youtubeUrl) {
      toast.error("Please fill in the title, category, recorded date, and YouTube link.");
      return;
    }

    const sendAvailability = !editingId || form.availabilityTouched;
    const availabilityPayload = sendAvailability
      ? availabilityToPayload(form.availability)
      : {};
    if (availabilityPayload.error) {
      toast.error(availabilityPayload.error);
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
        subject: form.subject || null,
        subtopic: form.subtopic || null,
        part: form.part || "",
        ...availabilityPayload,
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
            Live classes are added here automatically when you press End
            Live. To add any other video, upload it to YouTube as Unlisted
            and use Add Recording. Students only see it while their course
            enrollment is active.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={handleBackfillFromLive}
            disabled={backfilling}
            className="flex items-center gap-2 text-nowrap border border-indigo-400 text-indigo-500 font-medium py-2 px-4 rounded-2xl font-poppins cursor-pointer hover:bg-indigo-50 duration-300 disabled:opacity-50"
          >
            {backfilling ? "Adding…" : "Add Past Live Classes"}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            <Youtube className="h-4 w-4" /> Add Recording
          </button>
        </div>
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

      {/* Subject → Subtopic filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
          Subject
          <select
            className="border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm text-stone-700 min-w-[200px]"
            value={activeSubject}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setSubtopicFilter(ALL);
            }}
          >
            <option value={ALL}>All subjects ({recordings.length})</option>
            {subjectOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.key === NO_SUBJECT ? "Not grouped yet" : s.name} ({s.count})
              </option>
            ))}
          </select>
        </label>
        {subtopicOptions.length > 0 && (
          <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
            Subtopic
            <select
              className="border border-stone-300 py-2 px-3 rounded-xl bg-white text-sm text-stone-700 min-w-[200px]"
              value={activeSubtopic}
              onChange={(e) => setSubtopicFilter(e.target.value)}
            >
              <option value={ALL}>All subtopics</option>
              {subtopicOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.key === NO_SUBTOPIC ? "No subtopic yet" : t.name} ({t.count})
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => setSort({ key: "group", dir: "asc" })}
          className="text-sm text-indigo-600 font-medium hover:underline pb-2"
          title="Sort by subject, then subtopic, then class date"
        >
          Order by subject → subtopic → date
        </button>
      </div>

      {(ungroupedCount > 0 || noSubtopicCount > 0) && (
        <div className="flex flex-wrap items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm">
          <FolderTree className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">
            {ungroupedCount > 0 && (
              <>
                <b>{ungroupedCount}</b> recording{ungroupedCount === 1 ? " has" : "s have"} no subject
              </>
            )}
            {ungroupedCount > 0 && noSubtopicCount > 0 && " · "}
            {noSubtopicCount > 0 && (
              <>
                <b>{noSubtopicCount}</b> {noSubtopicCount === 1 ? "has" : "have"} a subject but no subtopic
              </>
            )}
            . Students see these under "Other classes" / "General".
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {ungroupedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSubjectFilter(NO_SUBJECT);
                  setSubtopicFilter(ALL);
                }}
                className="border border-amber-400 text-amber-700 font-medium py-1.5 px-3 rounded-xl hover:bg-amber-100"
              >
                Show ungrouped
              </button>
            )}
            <button
              type="button"
              onClick={openSuggestions}
              className="flex items-center gap-1.5 bg-amber-500 text-white font-medium py-1.5 px-3 rounded-xl hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Suggest from titles
            </button>
          </div>
        </div>
      )}

      {/* Bulk actions for checked rows */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => {
              setBulkAvailability(defaultAvailability());
              setBulkOpen(true);
            }}
            className="bg-indigo-500 text-white text-sm font-medium py-1.5 px-4 rounded-xl hover:opacity-85"
          >
            Set availability…
          </button>
          <button
            onClick={() => {
              setGroupValue({ subject: "", subtopic: "", part: null });
              setGroupOpen(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-500 text-white text-sm font-medium py-1.5 px-4 rounded-xl hover:opacity-85"
          >
            <FolderTree className="h-4 w-4" />
            Group into subject…
          </button>
          <button
            onClick={() => handleExtend(selectedIds)}
            disabled={bulkSaving}
            className="border border-indigo-400 text-indigo-600 text-sm font-medium py-1.5 px-4 rounded-xl hover:bg-indigo-100 disabled:opacity-50"
          >
            Extend +7 days
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-stone-500 hover:underline ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Recordings list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1120px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="pl-4 py-3 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={
                    visibleRecordings.length > 0 &&
                    selectedIds.length === visibleRecordings.length
                  }
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? visibleRecordings.map((r) => r._id) : [])
                  }
                />
              </th>
              <SortableTh label="Title" sortKey="title" sort={sort} onSort={handleSort} />
              <SortableTh label="Category" sortKey="category" sort={sort} onSort={handleSort} />
              <SortableTh label="Subject / Subtopic" sortKey="group" sort={sort} onSort={handleSort} />
              <SortableTh label="Recorded Date" sortKey="recordedDate" sort={sort} onSort={handleSort} />
              <SortableTh label="Duration" sortKey="duration" sort={sort} onSort={handleSort} />
              <SortableTh label="Available Until" sortKey="availableUntil" sort={sort} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : visibleRecordings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-10">
                  {recordings.length === 0
                    ? "No recordings added yet."
                    : "No recordings match this subject / subtopic."}
                </td>
              </tr>
            ) : (
              visibleRecordings.map((rec) => (
                <tr key={rec._id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="pl-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${rec.title}`}
                      checked={selectedIds.includes(rec._id)}
                      onChange={() => toggleSelected(rec._id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {rec.title}
                          {rec.sourceLiveClassId && (
                            <span className="ml-2 align-middle px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-semibold">
                              FROM LIVE
                            </span>
                          )}
                        </p>
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
                  <td className="px-4 py-3">
                    {rec.subject ? (
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">{rec.subject.name}</span>
                        <span className={`text-xs ${rec.subtopic ? "text-gray-500" : "text-amber-600"}`}>
                          {rec.subtopic ? rec.subtopic.name : "No subtopic"}
                        </span>
                        {rec.part && <PartBadge part={rec.part} className="self-start mt-1" />}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        Not grouped
                      </span>
                    )}
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
                  <td className="px-4 py-3 text-gray-600">
                    <AvailabilityCell
                      rec={rec}
                      onExtend={(r) => handleExtend([r._id])}
                      extending={bulkSaving}
                    />
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
                        onClick={() => setPreview(rec)}
                        className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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

      <AdminVideoPreviewDialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        videoId={preview?.youtubeVideoId}
        title={preview?.title}
        subtitle={
          preview
            ? `${getCategoryLabel(preview.category)}${preview.description ? ` · ${preview.description}` : ""}`
            : ""
        }
      />

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
                setForm({
                  ...form,
                  category: selectedOption.value,
                  // Subjects belong to one category — reset on change.
                  ...(selectedOption.value !== form.category ? { subject: "", subtopic: "" } : {}),
                })
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
            <SubjectSubtopicFields
              subjects={subjectsForCategory(form.category)}
              category={form.category}
              onSubjectSaved={upsertSubject}
              value={{ subject: form.subject, subtopic: form.subtopic, part: form.part }}
              onChange={(v) => setForm({ ...form, ...v })}
              disabled={saving}
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
            <AvailabilityPicker
              value={form.availability}
              onChange={(availability) =>
                setForm({ ...form, availability, availabilityTouched: true })
              }
              classDate={form.recordedDate}
              disabled={saving}
            />
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

      {/* Bulk availability dialog */}
      <Dialog open={bulkOpen} onClose={bulkSaving ? undefined : () => setBulkOpen(false)}>
        <div className="flex flex-col gap-5 sm:min-w-[460px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                Set availability
              </h1>
              <p className="text-sm text-stone-500 font-work-sans">
                For {selectedIds.length} selected recording
                {selectedIds.length === 1 ? "" : "s"}. "Number of days" counts
                from each class's own date.
              </p>
            </div>
            {!bulkSaving && (
              <MdClose
                onClick={() => setBulkOpen(false)}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <AvailabilityPicker
            value={bulkAvailability}
            onChange={setBulkAvailability}
            classDate={
              selectedIds.length === 1
                ? recordings.find((r) => r._id === selectedIds[0])?.recordedDate?.slice(0, 10)
                : undefined
            }
            showDaysPreview={selectedIds.length === 1}
            disabled={bulkSaving}
          />
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setBulkOpen(false)}
              disabled={bulkSaving}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyBulk}
              disabled={bulkSaving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {bulkSaving ? "Saving…" : "Apply"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Bulk group dialog */}
      <Dialog open={groupOpen} onClose={groupSaving ? undefined : () => setGroupOpen(false)}>
        <div className="flex flex-col gap-5 sm:min-w-[520px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">Group into subject</h1>
              <p className="text-sm text-stone-500 font-work-sans">
                For {selectedIds.length} selected recording{selectedIds.length === 1 ? "" : "s"}.
                Students will find them under this subject and subtopic, listed by class date.
                Choose "Not grouped" to remove grouping.
              </p>
            </div>
            {!groupSaving && (
              <MdClose
                onClick={() => setGroupOpen(false)}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <SubjectSubtopicFields
            subjects={allSubjects
              .filter((s) => selectedCategories.includes(s.category))
              .sort((a, b) => a.name.localeCompare(b.name))}
            value={groupValue}
            onChange={setGroupValue}
            disabled={groupSaving}
            showCategory={selectedCategories.length > 1}
            category={selectedCategories.length === 1 ? selectedCategories[0] : null}
            onSubjectSaved={upsertSubject}
            keepPartOption
          />
          {selectedCategories.length > 1 && (
            <p className="text-xs text-amber-600 -mt-2">
              Your selection mixes exam categories. Only recordings in the chosen
              subject's category will be grouped; the rest are skipped.
            </p>
          )}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setGroupOpen(false)}
              disabled={groupSaving}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkGroup}
              disabled={groupSaving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {groupSaving ? "Saving…" : "Apply"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Suggestions from titles */}
      <Dialog
        open={suggestOpen}
        onClose={groupSaving ? undefined : () => setSuggestOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">Suggested groups</h1>
              <p className="text-sm text-stone-500 font-work-sans">
                Found by matching your subject and subtopic names inside each
                recording's title. Untick anything that looks wrong, then Apply.
                Recordings not listed here can be grouped with the checkboxes.
              </p>
            </div>
            {!groupSaving && (
              <MdClose
                onClick={() => setSuggestOpen(false)}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <div className="max-h-[55vh] overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
            {suggestions.map((f) => (
              <label key={f.rec._id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={suggestPicked.includes(f.rec._id)}
                  onChange={() =>
                    setSuggestPicked((prev) =>
                      prev.includes(f.rec._id) ? prev.filter((x) => x !== f.rec._id) : [...prev, f.rec._id]
                    )
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800 font-medium truncate">{f.rec.title}</p>
                  <p className="text-xs text-stone-500">
                    {formatDateTime(f.rec.recordedDate)} · {getCategoryLabel(f.rec.category)}
                  </p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="text-indigo-700 font-medium">{f.subject.name}</p>
                  <p className="text-xs text-stone-500">{f.subtopic ? f.subtopic.name : "No subtopic"}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-stone-500">
              {suggestPicked.length} of {suggestions.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSuggestOpen(false)}
                disabled={groupSaving}
                className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins hover:opacity-85 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={applySuggestions}
                disabled={groupSaving || suggestPicked.length === 0}
                className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins hover:opacity-85 disabled:opacity-50"
              >
                {groupSaving ? "Applying…" : `Apply ${suggestPicked.length}`}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RecordedClassesAdminPage;
