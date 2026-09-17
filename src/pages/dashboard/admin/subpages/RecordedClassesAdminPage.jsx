import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import { UploadCloud, Video, Trash2, RefreshCw } from "lucide-react";
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

const StatusPill = ({ status, active }) => {
  if (!active) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
        Retired
      </span>
    );
  }
  const map = {
    ready: "bg-emerald-100 text-emerald-700",
    processing: "bg-amber-100 text-amber-700",
    uploading: "bg-sky-100 text-sky-700",
    error: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

// Admin management for the in-app recorded-class video system (Cloudflare
// Stream). Upload goes STRAIGHT from the admin's browser to Cloudflare
// (never through our own server) — essential for multi-hour class
// recordings; see requestUploadUrl in recordedClassController.js for why.
const RecordedClassesAdminPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const [openUploadPopup, setOpenUploadPopup] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: EXAM_CATEGORY_OPTIONS[0].value,
    recordedDate: new Date().toISOString().slice(0, 10),
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [retentionDays, setRetentionDays] = useState("");
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [sweepRunning, setSweepRunning] = useState(false);

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

  const fetchRetentionSetting = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/settings/retention`
      );
      const days = response.data?.data?.videoRetentionDays;
      setRetentionDays(days ? String(days) : "");
    } catch (error) {
      // Non-fatal — settings panel just stays blank/default.
    }
  };

  useEffect(() => {
    fetchRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    fetchRetentionSetting();
  }, []);

  const handleCloseUploadPopup = () => {
    setOpenUploadPopup(false);
    setVideoFile(null);
    setUploadProgress(0);
    setUploadForm({
      title: "",
      description: "",
      category: EXAM_CATEGORY_OPTIONS[0].value,
      recordedDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.category || !uploadForm.recordedDate) {
      toast.error("Please fill in the title, category, and recorded date.");
      return;
    }
    if (!videoFile) {
      toast.error("Please choose a video file to upload.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // 1. Ask our backend for a one-time Cloudflare Stream direct-upload
      //    URL + create the metadata row.
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/upload-url`,
        uploadForm
      );

      // 2. Upload the actual file STRAIGHT to Cloudflare — bypasses our own
      //    server entirely, so a multi-hour recording never hits our
      //    backend's request size/timeout limits. Uses a bare axios
      //    instance (not the shared `axios` import) so our own Bearer
      //    token — set as a global default header for calls to our own
      //    API — is never sent along to Cloudflare's URL.
      const formData = new FormData();
      formData.append("file", videoFile);

      const uploadClient = axios.create();
      await uploadClient.post(data.uploadUrl, formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      toast.success(
        "Upload complete. Cloudflare is now processing the video — it will show as \"ready\" here once done."
      );
      handleCloseUploadPopup();
      fetchRecordings();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Upload failed. If Cloudflare Stream isn't configured yet, an admin needs to complete that setup first."
      );
    } finally {
      setUploading(false);
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
        `Permanently delete "${recording.title}" from Cloudflare Stream storage? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/${recording._id}`
      );
      toast.success("Recording deleted from storage.");
      fetchRecordings();
    } catch (error) {
      toast.error("Failed to delete recording.");
    }
  };

  const handleSaveRetention = async () => {
    setRetentionLoading(true);
    try {
      const value = retentionDays ? Number(retentionDays) : null;
      await axios.patch(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/settings/retention`,
        { videoRetentionDays: value }
      );
      toast.success(
        value
          ? `Recordings older than ${value} days will now be auto-deleted from storage.`
          : "Automatic deletion disabled — recordings are kept forever."
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update retention setting");
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleRunSweepNow = async () => {
    setSweepRunning(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/recorded-classes/settings/retention/run-now`
      );
      const result = response.data?.data;
      if (result?.skipped) {
        toast("No retention window configured — nothing to delete.", { icon: "ℹ️" });
      } else {
        toast.success(
          `Sweep complete: ${result.deleted.length} deleted${
            result.failed?.length ? `, ${result.failed.length} failed` : ""
          }.`
        );
      }
      fetchRecordings();
    } catch (error) {
      toast.error("Failed to run retention sweep.");
    } finally {
      setSweepRunning(false);
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
            Upload and manage in-app recorded classes. Students can only
            stream these (no download) and only while their course
            enrollment is active.
          </p>
        </div>
        <button
          onClick={() => setOpenUploadPopup(true)}
          className="flex items-center gap-2 text-nowrap bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-2xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          <UploadCloud className="h-4 w-4" /> Upload Recording
        </button>
      </div>

      {/* Retention / cost-control settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">
            Auto-delete recordings after (days)
          </label>
          <input
            type="number"
            min="1"
            placeholder="Never (kept forever)"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-indigo-400"
          />
        </div>
        <button
          onClick={handleSaveRetention}
          disabled={retentionLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:opacity-85 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={handleRunSweepNow}
          disabled={sweepRunning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-indigo-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${sweepRunning ? "animate-spin" : ""}`} />
          Run sweep now
        </button>
        <p className="text-xs text-gray-400 w-full">
          Leave blank to keep every recording forever. Deletion removes the
          video from Cloudflare Stream storage permanently — it cannot be undone.
        </p>
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
                  No recordings uploaded yet.
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
                    <StatusPill status={rec.status} active={rec.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                        title="Delete forever"
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

      {/* Upload dialog */}
      <Dialog open={openUploadPopup} onClose={uploading ? undefined : handleCloseUploadPopup}>
        <div className="flex flex-col gap-5 sm:min-w-[500px] p-5">
          <div className="flex items-start justify-between gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-stone-700 font-poppins">
                Upload Recording
              </h1>
              <p className="text-sm text-stone-500 font-work-sans">
                Uploads directly from your browser to Cloudflare Stream —
                large multi-hour files are fine.
              </p>
            </div>
            {!uploading && (
              <MdClose
                onClick={handleCloseUploadPopup}
                className="text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
              />
            )}
          </div>
          <div className="flex flex-col gap-2 font-inter">
            <input
              type="text"
              placeholder="Class Title"
              className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              disabled={uploading}
            />
            <textarea
              placeholder="Description (optional)"
              className="border border-stone-300 py-[10px] px-4 focus:outline-stone-300 rounded-2xl bg-white resize-none"
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              disabled={uploading}
            />
            <Select
              className="w-full"
              placeholder="Exam Category"
              options={EXAM_CATEGORY_OPTIONS}
              value={EXAM_CATEGORY_OPTIONS.find((opt) => opt.value === uploadForm.category)}
              onChange={(selectedOption) =>
                setUploadForm({ ...uploadForm, category: selectedOption.value })
              }
              isDisabled={uploading}
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
                value={uploadForm.recordedDate}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, recordedDate: e.target.value })
                }
                disabled={uploading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-stone-500 font-medium">
                Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="text-sm"
              />
            </div>
            {uploading && (
              <div className="flex flex-col gap-1">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={handleCloseUploadPopup}
              disabled={uploading}
              className="border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RecordedClassesAdminPage;
