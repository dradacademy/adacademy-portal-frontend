import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import { MdClose, MdDelete, MdEdit } from "react-icons/md";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";

// Phase 3: lets the admin update the homepage's Achievers, Testimonials,
// Gallery, and Announcements sections without a code change / redeploy.
// All 4 sections share one backend model (type-tagged ContentItem) and this
// one admin page — see backend/controllers/contentController.js.

const TABS = [
  { type: "achiever", label: "Achievers" },
  { type: "testimonial", label: "Testimonials" },
  { type: "gallery", label: "Gallery" },
  { type: "announcement", label: "Announcements" },
];

// Which fields each type's form shows, and their labels/placeholders.
const TYPE_FIELDS = {
  achiever: [
    { name: "title", label: "Name", placeholder: "e.g. Priya Darsini A", required: true },
    { name: "subtitle", label: "Branch", placeholder: "e.g. Civil Engineering" },
    { name: "meta", label: "Exam", placeholder: 'e.g. "GATE 2026"' },
    { name: "badge", label: "Achievement Badge", placeholder: 'e.g. "GATE Qualified"' },
    {
      name: "body",
      label: "Story",
      placeholder: "e.g. Received an NIT offer in the first round of CCMT 2026 counselling.",
      multiline: true,
    },
    { name: "image", label: "Photo", type: "image" },
  ],
  testimonial: [
    { name: "title", label: "Student Name", placeholder: "e.g. Priya Darsini A", required: true },
    { name: "subtitle", label: "Detail", placeholder: 'e.g. "GATE 2026, Civil Engineering"' },
    { name: "body", label: "Quote", placeholder: "What the student said", multiline: true, required: true },
  ],
  gallery: [
    { name: "title", label: "Photo Title / Alt Text", placeholder: "e.g. Reception / Entrance", required: true },
    {
      name: "subtitle",
      label: "Category",
      placeholder: "e.g. Facility",
      list: [
        "Facility",
        "Classroom Sessions",
        "Faculty",
        "Students",
        "Test Sessions",
        "Workshops",
        "Events",
        "Achievers",
      ],
    },
    { name: "image", label: "Photo", type: "image", required: true },
  ],
  announcement: [
    {
      name: "title",
      label: "Title",
      placeholder: "e.g. GATE 2027 (Civil Engineering) — Batch 2 Enrollment Open",
      required: true,
    },
    {
      name: "subtitle",
      label: "Date / Status label",
      placeholder: 'e.g. "Admissions close Sept 15, 2026" or "Coming Soon"',
    },
    { name: "body", label: "Description", multiline: true },
    {
      name: "ctaLabel",
      label: "Button label (optional)",
      placeholder: 'e.g. "Call / WhatsApp +91 95668 18665"',
    },
    {
      name: "ctaHref",
      label: "Button link (optional)",
      placeholder: 'e.g. "tel:+919566818665"',
    },
  ],
};

const emptyForm = { title: "", subtitle: "", body: "", meta: "", badge: "", ctaLabel: "", ctaHref: "", image: "" };

const ContentManagementAdminPage = () => {
  const [activeType, setActiveType] = useState("achiever");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fields = TYPE_FIELDS[activeType];

  const fetchItems = async (type) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/content/admin/${type}`
      );
      setItems(res.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeType);
  }, [activeType]);

  const handleLoadStarterContent = async () => {
    setSeeding(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/content/admin/seed-defaults`
      );
      const seeded = res.data?.data || {};
      const addedTypes = Object.entries(seeded).filter(([, n]) => n > 0);
      if (addedTypes.length === 0) {
        toast.success("All sections already have content — nothing to load.");
      } else {
        toast.success(
          `Loaded starter content for: ${addedTypes
            .map(([t, n]) => `${n} ${t}${n > 1 ? "s" : ""}`)
            .join(", ")}.`
        );
      }
      fetchItems(activeType);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load starter content");
    } finally {
      setSeeding(false);
    }
  };

  const openAddForm = () => {
    setEditingItem(null);
    setFormState(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setOpenForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormState({
      title: item.title || "",
      subtitle: item.subtitle || "",
      body: item.body || "",
      meta: item.meta || "",
      badge: item.badge || "",
      ctaLabel: item.ctaLabel || "",
      ctaHref: item.ctaHref || "",
      image: item.image || "",
    });
    setImageFile(null);
    setImagePreview(item.image || "");
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditingItem(null);
  };

  const handleFieldChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME);
    // A fresh axios instance without the app's default Authorization header —
    // Cloudinary's unsigned-upload endpoint doesn't expect (and will reject
    // a request carrying) our own API's Bearer token.
    const cloudinaryAxios = axios.create({
      headers: { "Content-Type": "multipart/form-data" },
    });
    delete cloudinaryAxios.defaults.headers.common["Authorization"];
    const res = await cloudinaryAxios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
      data
    );
    return res.data.url;
  };

  const handleSubmit = async () => {
    const requiredMissing = fields.some(
      (f) => f.required && f.type !== "image" && !formState[f.name]?.toString().trim()
    );
    if (requiredMissing) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const needsImage = fields.some((f) => f.type === "image" && f.required);
    if (needsImage && !imageFile && !formState.image) {
      toast.error("Please choose a photo.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formState.image || null;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const payload = { ...formState, image: imageUrl, type: activeType };

      if (editingItem) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/content/admin/${editingItem._id}`,
          payload
        );
        toast.success("Updated.");
      } else {
        await axios.post(`${import.meta.env.VITE_APP_API_URL}/content/admin`, payload);
        toast.success("Added.");
      }
      closeForm();
      fetchItems(activeType);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await axios.put(`${import.meta.env.VITE_APP_API_URL}/content/admin/${item._id}`, {
        active: !item.active,
      });
      fetchItems(activeType);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    }
  };

  const handleReorder = async (item, direction) => {
    const idx = items.findIndex((i) => i._id === item._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];
    try {
      await Promise.all([
        axios.put(`${import.meta.env.VITE_APP_API_URL}/content/admin/${item._id}`, {
          order: other.order,
        }),
        axios.put(`${import.meta.env.VITE_APP_API_URL}/content/admin/${other._id}`, {
          order: item.order,
        }),
      ]);
      fetchItems(activeType);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reorder");
    }
  };

  const confirmDelete = (item) => {
    setDeleteTarget(item);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/content/admin/${deleteTarget._id}`
      );
      toast.success("Deleted.");
      setOpenDelete(false);
      setDeleteTarget(null);
      fetchItems(activeType);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-start justify-between gap-6 flex-wrap font-inter">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Content Management
          </h1>
          <p className="text-stone-400 font-medium max-w-2xl">
            Update the Achievers, Testimonials, Gallery, and Announcements
            sections on the front page — no code change or redeploy needed.
            Changes show up on the live site within a few seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadStarterContent}
            disabled={seeding}
            className="flex items-center gap-2 text-sm border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="For any of the 4 sections that has zero items, this loads the same real content that's currently hardcoded on the live homepage — a one-time starting point you can then edit freely. Safe to click again; it never touches a section that already has items."
          >
            {seeding ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Load Current Homepage Content
          </button>
          <button
            onClick={openAddForm}
            className="text-nowrap bg-indigo-400 text-stone-50 font-medium py-2 px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            + Add New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-inter">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveType(tab.type)}
            className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
              activeType === tab.type
                ? "bg-indigo-500 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400">
          <LoaderCircle className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-stone-500 font-inter">
            No {TABS.find((t) => t.type === activeType)?.label.toLowerCase()} yet.
          </p>
          <button
            onClick={openAddForm}
            className="text-sm bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            + Add the first one
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div
              key={item._id}
              className={`flex items-start gap-4 p-4 rounded-xl border ${
                item.active ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-stone-700">{item.title}</h3>
                  {item.badge && (
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-gold bg-gold/10 rounded-full px-2 py-0.5">
                      {item.badge}
                      {item.meta ? ` · ${item.meta}` : ""}
                    </span>
                  )}
                  {!item.active && (
                    <span className="text-[11px] font-medium uppercase text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
                      Hidden
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-xs text-stone-400 mt-0.5">{item.subtitle}</p>
                )}
                {item.body && (
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2">{item.body}</p>
                )}
                {item.ctaLabel && (
                  <p className="text-xs text-indigo-400 mt-1">{item.ctaLabel}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleReorder(item, "up")}
                  disabled={idx === 0}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(item, "down")}
                  disabled={idx === items.length - 1}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(item)}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 cursor-pointer"
                  title={item.active ? "Hide from the site" : "Show on the site"}
                >
                  {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditForm(item)}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-indigo-500 cursor-pointer"
                  title="Edit"
                >
                  <MdEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => confirmDelete(item)}
                  className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-red-500 cursor-pointer"
                  title="Delete"
                >
                  <MdDelete className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      <Dialog open={openForm} onClose={closeForm} maxWidth="sm" fullWidth>
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                {editingItem ? "Edit" : "Add"} {TABS.find((t) => t.type === activeType)?.label.replace(/s$/, "")}
              </h1>
            </div>
            <MdClose
              onClick={closeForm}
              className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className="flex flex-col gap-3 font-inter">
            {fields.map((field) => {
              if (field.type === "image") {
                return (
                  <div key={field.name} className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-600">
                      {field.label}
                      {field.required && " *"}
                    </label>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <label className="text-sm border border-stone-300 py-2 px-4 rounded-xl cursor-pointer hover:bg-stone-50">
                        Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              }
              return (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-stone-600">
                    {field.label}
                    {field.required && " *"}
                  </label>
                  {field.multiline ? (
                    <textarea
                      placeholder={field.placeholder}
                      className="border border-stone-300 py-[10px] px-4 focus:outline-none rounded-xl bg-white min-h-[90px]"
                      value={formState[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        list={field.list ? `${field.name}-options` : undefined}
                        className="border border-stone-300 py-[10px] px-4 focus:outline-none rounded-xl bg-white"
                        value={formState[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      />
                      {field.list && (
                        <datalist id={`${field.name}-options`}>
                          {field.list.map((opt) => (
                            <option key={opt} value={opt} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={closeForm}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {editingItem ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <div className="flex flex-col gap-6 sm:min-w-[400px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                Confirm Delete
              </h1>
              <p className="text-sm text-stone-500">
                Are you sure you want to delete "{deleteTarget?.title}"? This can't be undone.
              </p>
            </div>
            <MdClose
              onClick={() => setOpenDelete(false)}
              className="text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setOpenDelete(false)}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ContentManagementAdminPage;
