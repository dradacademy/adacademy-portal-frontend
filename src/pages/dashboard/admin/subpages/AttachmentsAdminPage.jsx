import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import {
  Paperclip,
  Trash2,
  Pencil,
  Upload,
  FileText,
  Presentation,
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
  title: (a) => (a.title || "").toLowerCase(),
  category: (a) => (getCategoryLabel(a.category) || "").toLowerCase(),
  type: (a) => (a.contentType === "application/pdf" ? "pdf" : a.fileName?.split(".").pop()?.toLowerCase() || ""),
  fileSize: (a) => a.fileSize ?? 0,
  createdAt: (a) => (a.createdAt ? new Date(a.createdAt).getTime() : null),
  status: (a) => (a.active ? 1 : 0),
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};

const isPreviewable = (contentType) => contentType === "application/pdf";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: EXAM_CATEGORY_OPTIONS[0].value,
};

// Admin management for study materials (PDF/PPT/Word). Deliberately a
// simple "upload from my side, students can view" provision — not a paid
// DRM/locking service, per the admin's own instruction. Students get an
// in-app, no-download-button viewer (see the student-facing
// AttachmentsStudent.jsx + AttachmentViewer.jsx); PDF is the only format
// with a guaranteed in-browser preview in this version — PPT/DOC/DOCX are
// still uploaded/stored/access-controlled the same way, but flagged here so
// the admin knows what students will actually be able to open in-app today.
const AttachmentsAdminPage = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const [openFormPopup, setOpenFormPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortedAttachments = useMemo(() => {
    if (!sort.key || !SORTERS[sort.key]) return attachments;
    const getValue = SORTERS[sort.key];
    const dirMultiplier = sort.dir === "asc" ? 1 : -1;
    return [...attachments].sort((a, b) => {
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
  }, [attachments, sort]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/attachments`,
        { params: activeCategory !== "all" ? { category: activeCategory } : {} }
      );
      setAttachments(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load attachments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleClosePopup = () => {
    setOpenFormPopup(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFile(null);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setOpenFormPopup(true);
  };

  const handleOpenEdit = (att) => {
    setEditingId(att._id);
    setForm({
      title: att.title,
      description: att.description || "",
      category: att.category,
    });
    setFile(null);
    setOpenFormPopup(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category) {
      toast.error("Please fill in the title and category.");
      return;
    }
    if (!editingId && !file) {
      toast.error("Please choose a PDF, PPT, or Word file to upload.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      if (file) formData.append("file", file);

      if (editingId) {
        await axios.patch(
          `${import.meta.env.VITE_APP_API_URL}/attachments/${editingId}`,
          formData
        );
        toast.success("Material updated.");
      } else {
        await axios.post(`${import.meta.env.VITE_APP_API_URL}/attachments`, formData);
        toast.success("Material uploaded — students in this category can now view it.");
      }

      handleClosePopup();
      fetchAttachments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save the material.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (att) => {
    try {
      const formData = new FormData();
      formData.append("active", (!att.active).toString());
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/attachments/${att._id}`,
        formData
      );
      toast.success(att.active ? "Material hidden from students." : "Material re-activated.");
      fetchAttachments();
    } catch (error) {
      toast.error("Failed to update material.");
    }
  };

  const handleDelete = async (att) => {
    if (!window.confirm(`Remove "${att.title}" permanently?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/attachments/${att._id}`);
      toast.success("Material removed.");
      fetchAttachments();
    } catch (error) {
      toast.error("Failed to remove material.");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-inter">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Attachments
          </h1>
          <p className="text-stone-400 font-medium">
            Upload PDF, PPT, or Word study material. Students can only view
            it in-app — there is no download link anywhere in the student
            view.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          <Upload className="h-4 w-4" /> Upload Material
        </button>
      </div>

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <SortableTh label="Title" sortKey="title" sort={sort} onSort={handleSort} />
              <SortableTh label="Category" sortKey="category" sort={sort} onSort={handleSort} />
              <SortableTh label="Type" sortKey="type" sort={sort} onSort={handleSort} />
              <SortableTh label="Size" sortKey="fileSize" sort={sort} onSort={handleSort} />
              <SortableTh label="Uploaded" sortKey="createdAt" sort={sort} onSort={handleSort} />
              <SortableTh label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  Loading…
                </td>
              </tr>
            ) : sortedAttachments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  No materials uploaded yet.
                </td>
              </tr>
            ) : (
              sortedAttachments.map((att) => (
                <tr key={att._id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isPreviewable(att.contentType) ? (
                        <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Presentation className="h-4 w-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{att.title}</p>
                        {att.description && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {att.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {getCategoryLabel(att.category)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {isPreviewable(att.contentType) ? (
                      "PDF"
                    ) : (
                      <span title="No guaranteed in-app preview yet — see the note below the table.">
                        {att.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatFileSize(att.fileSize)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(att.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        att.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {att.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(att)}
                        className="p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(att)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition duration-300 cursor-pointer ${
                          att.active
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {att.active ? "Hide" : "Re-activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(att)}
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

      <p className="text-xs text-gray-400 flex items-start gap-1.5">
        <Paperclip className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        PDFs render directly in the student's in-app viewer. PPT/DOC/DOCX
        files are stored and access-controlled the same way, but don't have a
        guaranteed in-browser preview yet in this version — students will see
        a note instead of the content for those file types until an in-app
        converter is added.
      </p>

      <Dialog open={openFormPopup} onClose={saving ? undefined : handleClosePopup}>
        <div className="flex flex-col gap-5 sm:min-w-[500px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                {editingId ? "Edit Material" : "Upload Material"}
              </h1>
              <p className="text-sm text-stone-500 font-work-sans">
                PDF, PPT, or Word — up to 30MB.
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
              placeholder="Title"
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
                {editingId ? "Replace file (optional)" : "File"}
              </label>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={saving}
                className="text-sm"
              />
              {file && (
                <p className="text-xs text-gray-500">
                  {file.name} ({formatFileSize(file.size)})
                </p>
              )}
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
              {saving ? "Saving…" : editingId ? "Save Changes" : "Upload"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AttachmentsAdminPage;
