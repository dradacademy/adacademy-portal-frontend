import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "katex/dist/katex.min.css";
import { MathText } from "../../../utils/mathText";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  ImagePlus,
  KeyRound,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";

// Renders questionText with inline KaTeX whenever it looks like it contains
// LaTeX (only the LaTeX-looking substrings render as math — the rest stays
// plain text, since PDF-extracted text mixes prose and formulas with no
// delimiters between them).
const MathPreview = ({ text }) => {
  if (!text || (!text.includes("^") && !text.includes("\\"))) return null;

  return (
    <div className="mt-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
      <MathText text={text} />
    </div>
  );
};

const optionsToText = (options) =>
  Array.isArray(options)
    ? options.map((o) => (typeof o === "object" ? o.text : o)).join(", ")
    : "";

const textToOptions = (text) =>
  text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ text: t, image: null }));

const answersToText = (answers) => (Array.isArray(answers) ? answers.join(", ") : "");

const textToAnswers = (text) =>
  text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

// ---- Screenshot import helpers -------------------------------------------
const MAX_SCREENSHOTS = 40;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2400;

// Big screenshots / phone photos are shrunk in the browser (still sharp
// enough to read Tamil and English text) so many of them upload quickly.
// Small images are sent untouched.
const prepareImage = (file) =>
  new Promise((resolve) => {
    if (file.size < SHRINK_ABOVE_BYTES) return resolve(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) =>
          resolve(
            blob
              ? new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" })
              : file,
          ),
        "image/jpeg",
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

let imageIdCounter = 0;
const nextImageId = () => `shot-${Date.now()}-${imageIdCounter++}`;

// Lets an admin upload an arbitrary PDF question paper, have the AI extract
// structured draft questions, review/edit them, and only on explicit
// confirmation merge the selected ones into the exam builder's question
// list. Nothing here ever writes to the database directly — extraction is
// read-only and merging just appends to the parent's `newQuestions` state,
// exactly like the existing Excel import does.
const PdfQuestionImportAdmin = ({ onImportQuestions }) => {
  const [mode, setMode] = useState("pdf"); // "pdf" | "images"
  const [file, setFile] = useState(null);
  // Optional — only needed when the answer key was uploaded as its own PDF
  // rather than being embedded in (or alongside) the question paper. Left
  // unset, extraction behaves exactly as before (best-effort guess from
  // the question paper alone, or whatever answer key it can find inline).
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState(null); // null = no review in progress

  // Screenshots: [{ id, file, url }] in the order they will be read.
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef(null);
  const imagesRef = useRef([]);
  imagesRef.current = images;

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleAnswerKeyFileChange = (e) => {
    setAnswerKeyFile(e.target.files[0] || null);
  };

  const addImageFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming || []).filter((f) => f && ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (list.length === 0) {
      toast.error("No supported images found — use PNG, JPG or WebP screenshots.");
      return;
    }
    const room = MAX_SCREENSHOTS - imagesRef.current.length;
    if (room <= 0) {
      toast.error(`You can add at most ${MAX_SCREENSHOTS} screenshots at a time.`);
      return;
    }
    const accepted = list.slice(0, room);
    if (list.length > room) {
      toast.error(`Only ${room} more screenshot(s) fit — the limit is ${MAX_SCREENSHOTS}.`);
    }
    const prepared = await Promise.all(accepted.map(prepareImage));
    setImages((prev) => [
      ...prev,
      ...prepared.map((f) => ({ id: nextImageId(), file: f, url: URL.createObjectURL(f) })),
    ]);
  }, []);

  const clipboardImages = (clipboardData) =>
    Array.from(clipboardData?.items || [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item, i) => {
        const f = item.getAsFile();
        if (!f) return null;
        const ext = (item.type.split("/")[1] || "png").replace("jpeg", "jpg");
        return new File([f], `pasted-${Date.now()}-${i}.${ext}`, { type: f.type });
      })
      .filter(Boolean);

  // Ctrl+V while the screenshot box (or anything inside this card) is focused.
  const handlePasteOnPanel = (e) => {
    const pasted = clipboardImages(e.clipboardData);
    if (pasted.length === 0) return; // plain text paste — leave it alone
    e.preventDefault();
    addImageFiles(pasted);
  };

  // Ctrl+V anywhere on the page when nothing is focused — but never while the
  // admin is typing in a field or using one of the form's own paste-an-image
  // boxes (those take focus, so document.activeElement is not <body>).
  useEffect(() => {
    if (mode !== "images" || draftQuestions !== null) return undefined;
    const onDocPaste = (e) => {
      if (e.defaultPrevented || document.activeElement !== document.body) return;
      const pasted = clipboardImages(e.clipboardData);
      if (pasted.length === 0) return;
      e.preventDefault();
      addImageFiles(pasted);
    };
    document.addEventListener("paste", onDocPaste);
    return () => document.removeEventListener("paste", onDocPaste);
  }, [mode, draftQuestions, addImageFiles]);

  // Free the preview URLs when the component goes away.
  useEffect(
    () => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url)),
    [],
  );

  const handlePasteButton = async () => {
    try {
      const items = await navigator.clipboard.read();
      const files = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        const ext = (type.split("/")[1] || "png").replace("jpeg", "jpg");
        files.push(new File([blob], `pasted-${Date.now()}-${files.length}.${ext}`, { type }));
      }
      if (files.length === 0) {
        toast.error("No image found on the clipboard. Take a screenshot first (Win+Shift+S).");
        return;
      }
      addImageFiles(files);
    } catch (err) {
      toast.error("Your browser blocked clipboard access — click the box and press Ctrl+V instead.");
    }
  };

  const handleDropImages = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addImageFiles(e.dataTransfer?.files);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveImage = (index, delta) => {
    setImages((prev) => {
      const next = [...prev];
      const to = index + delta;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  };

  const clearImages = () => {
    imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  const applyExtracted = (data) => {
    const extracted = (data.draftQuestions || []).map((q) => ({
      ...q,
      answerKeyText: q.answerKeyText || "",
      answerKeyImage: q.answerKeyImage || null,
      selected: true,
    }));

    setDraftQuestions(extracted);
    toast.success(data.message || `Extracted ${extracted.length} question(s).`, {
      duration: 6000,
    });
  };

  const handleExtract = async () => {
    const formData = new FormData();
    let endpoint;

    if (mode === "images") {
      if (images.length === 0) {
        toast.error("Please add at least one screenshot first!");
        return;
      }
      images.forEach((img) => formData.append("images", img.file, img.file.name));
      endpoint = "extract-from-images";
    } else {
      if (!file) {
        toast.error("Please choose a PDF file first!");
        return;
      }
      formData.append("file", file);
      if (answerKeyFile) {
        formData.append("answerKeyFile", answerKeyFile);
      }
      endpoint = "extract-from-pdf";
    }

    setIsExtracting(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/question-import/${endpoint}`,
        formData,
      );
      applyExtracted(data);
    } catch (error) {
      console.error("Question extraction failed:", error);
      toast.error(
        error?.response?.data?.message ||
          (error?.response?.data?.error) ||
          (mode === "images"
            ? "Failed to extract questions from the screenshots."
            : "Failed to extract questions from the PDF."),
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const updateDraft = (index, field, value) => {
    setDraftQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeDraft = (index) => {
    setDraftQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSelected = (index) => {
    setDraftQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const handleConfirmImport = () => {
    const selected = (draftQuestions || []).filter((q) => q.selected);
    if (selected.length === 0) {
      toast.error("Select at least one question to import!");
      return;
    }

    const cleaned = selected.map(({ selected: _s, ...q }) => q);
    onImportQuestions(cleaned);
    toast.success(`${cleaned.length} question(s) added to the exam!`);
    setDraftQuestions(null);
    setFile(null);
    setAnswerKeyFile(null);
    clearImages();
  };

  const handleCancelReview = () => {
    setDraftQuestions(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Import Questions from PDF or Screenshots</h3>
            <p className="text-sm text-gray-600">
              Upload a question paper PDF, or paste any number of screenshots —
              AI extracts and structures the questions for you to review before
              adding them.
            </p>
          </div>
        </div>
      </div>

      {draftQuestions === null ? (
        <div>
          <div className="flex gap-2 px-4 pt-3">
            {[
              { key: "pdf", label: "PDF", Icon: FileText },
              { key: "images", label: "Screenshots", Icon: ImagePlus },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                disabled={isExtracting}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                  mode === key
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === "images" && images.length > 0 && (
                  <span className="ml-1 text-[11px] bg-white/25 rounded-full px-1.5">
                    {images.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {mode === "pdf" ? (
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div
              className={`relative flex-1 border-2 border-dashed rounded-xl p-3 transition-all duration-300 ${
                file
                  ? "border-purple-300 bg-purple-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    file ? "bg-purple-500" : "bg-gray-400"
                  }`}
                >
                  {file ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <FileText className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  {file ? (
                    <>
                      <p className="font-semibold text-purple-700">{file.name}</p>
                      <p className="text-sm text-purple-600">Ready to extract</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-700">
                        Drop a question paper PDF here
                      </p>
                      <p className="text-sm text-gray-500">Max 15MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExtract}
              disabled={!file || isExtracting}
              className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                file && !isExtracting
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting…</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Extract Questions</span>
                </>
              )}
            </button>
          </div>

          {/* Optional separate answer key PDF. When the answer key is a
              distinct document rather than being embedded in (or absent
              from) the question paper above, uploading it here lets
              extraction cross-reference the two by question number instead
              of falling back to a best-effort guess. */}
          <div
            className={`relative mt-2 border-2 border-dashed rounded-xl p-2.5 transition-all duration-300 ${
              answerKeyFile
                ? "border-indigo-300 bg-indigo-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
            }`}
          >
            {!answerKeyFile && (
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleAnswerKeyFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  answerKeyFile ? "bg-indigo-500" : "bg-gray-400"
                }`}
              >
                <KeyRound className="h-4 w-4 text-white" />
              </div>
              {answerKeyFile ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-indigo-700 truncate">
                      {answerKeyFile.name}
                    </p>
                    <p className="text-xs text-indigo-600">
                      Separate answer key — will be matched by question number
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnswerKeyFile(null)}
                    className="p-1 text-indigo-400 hover:text-indigo-700 shrink-0"
                    title="Remove answer key PDF"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Optional: upload a separate answer key PDF
                  </p>
                  <p className="text-xs text-gray-400">
                    Only needed if the answer key isn't already in the file
                    above — otherwise it's extracted from there automatically
                  </p>
                </div>
              )}
            </div>
          </div>

          {isExtracting && (
            <p className="text-xs text-gray-500 mt-2">
              This can take up to a minute for longer papers — please don't
              close this tab.
            </p>
          )}
        </div>
          ) : (
            <div className="px-4 py-4" onPaste={handlePasteOnPanel}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImageFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              <div
                tabIndex={0}
                role="button"
                aria-label="Screenshot drop zone. Press Ctrl+V to paste screenshots."
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDropImages}
                className={`border-2 border-dashed rounded-xl p-4 text-center outline-none transition-all duration-300 focus:border-purple-400 focus:bg-purple-50 ${
                  isDragging
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <ImagePlus className="h-7 w-7 mx-auto text-gray-400" />
                <p className="mt-1 font-semibold text-gray-700">
                  Click here, then press Ctrl+V to paste screenshots
                </p>
                <p className="text-xs text-gray-500">
                  Paste one at a time or many — they are read in the order shown
                  below. You can also drag &amp; drop images. Up to{" "}
                  {MAX_SCREENSHOTS} screenshots (PNG, JPG, WebP).
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteButton}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    Paste from clipboard
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Choose images
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Tip: on Windows press Win+Shift+S to snip part of the screen,
                  then paste here. Keep the text large and fully visible.
                </p>
              </div>

              {images.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {images.length} screenshot{images.length !== 1 ? "s" : ""} — read in this order
                    </p>
                    <button
                      type="button"
                      onClick={clearImages}
                      className="text-xs text-gray-500 hover:text-red-600 underline"
                    >
                      Remove all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                    {images.map((img, index) => (
                      <div
                        key={img.id}
                        className="relative border border-gray-200 rounded-lg overflow-hidden bg-white"
                      >
                        <span className="absolute top-1 left-1 z-10 text-[11px] font-bold bg-purple-600 text-white rounded px-1.5">
                          {index + 1}
                        </span>
                        <img
                          src={img.url}
                          alt={`Screenshot ${index + 1}`}
                          className="h-24 w-full object-cover object-top"
                        />
                        <div className="flex items-center justify-between px-1 py-0.5 bg-gray-50 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            className="p-0.5 text-gray-500 hover:text-purple-700 disabled:opacity-30"
                            title="Move earlier"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="p-0.5 text-gray-400 hover:text-red-500"
                            title="Remove this screenshot"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === images.length - 1}
                            className="p-0.5 text-gray-500 hover:text-purple-700 disabled:opacity-30"
                            title="Move later"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleExtract}
                disabled={images.length === 0 || isExtracting}
                className={`mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  images.length > 0 && !isExtracting
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Reading screenshots…</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>
                      Extract Questions from {images.length || ""} Screenshot
                      {images.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </button>
              {isExtracting && (
                <p className="text-xs text-gray-500 mt-2">
                  Many screenshots can take a few minutes — please don't close
                  this tab.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Review {draftQuestions.length} extracted question
              {draftQuestions.length !== 1 ? "s" : ""} — uncheck or edit any
              before adding them to the exam.
            </p>
            <button
              type="button"
              onClick={handleCancelReview}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Start over
            </button>
          </div>

          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {draftQuestions.map((q, index) => (
              <div
                key={index}
                className={`border rounded-xl p-3 transition-colors ${
                  q.selected
                    ? "border-purple-200 bg-purple-50/40"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={q.selected}
                    onChange={() => toggleSelected(index)}
                    className="mt-1.5 h-4 w-4 accent-purple-600"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={q.questionType}
                        onChange={(e) =>
                          updateDraft(index, "questionType", e.target.value)
                        }
                        className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="MSQ">MSQ</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                        <option value="Short Answer">Short Answer</option>
                      </select>
                      <span className="text-xs text-gray-400">
                        Question {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDraft(index)}
                        className="ml-auto text-gray-400 hover:text-red-500"
                        title="Remove this question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      value={q.questionText}
                      onChange={(e) =>
                        updateDraft(index, "questionText", e.target.value)
                      }
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      placeholder="Question text"
                    />
                    <MathPreview text={q.questionText} />

                    {(q.questionType === "MCQ" || q.questionType === "MSQ") && (
                      <input
                        type="text"
                        value={optionsToText(q.options)}
                        onChange={(e) =>
                          updateDraft(index, "options", textToOptions(e.target.value))
                        }
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                        placeholder="Options, comma separated"
                      />
                    )}

                    <input
                      type="text"
                      value={answersToText(q.correctAnswers)}
                      onChange={(e) =>
                        updateDraft(
                          index,
                          "correctAnswers",
                          textToAnswers(e.target.value),
                        )
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      placeholder="Correct answer(s), comma separated"
                    />

                    <div>
                      <label className="text-[11px] text-gray-500 flex items-center gap-1">
                        <KeyRound className="h-3 w-3" />
                        Answer key explanation
                        {answerKeyFile || q.answerKeyText ? "" : " (optional)"}
                      </label>
                      <textarea
                        value={q.answerKeyText || ""}
                        onChange={(e) =>
                          updateDraft(index, "answerKeyText", e.target.value)
                        }
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                        placeholder="Step-by-step explanation — auto-filled when found in the PDF(s); edit or add one manually, or leave blank and fill it in later from the exam builder"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        A diagram in the answer key still needs to be pasted
                        in manually afterward via the exam builder's Answer
                        Key Image field — same as before.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-500">Level</label>
                        <select
                          value={q.level ?? 2}
                          onChange={(e) =>
                            updateDraft(index, "level", parseInt(e.target.value, 10))
                          }
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1"
                        >
                          {[1, 2, 3, 4].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500">Marks</label>
                        <input
                          type="number"
                          value={q.marks ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              index,
                              "marks",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          placeholder="Auto"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500">Negative</label>
                        <input
                          type="number"
                          value={q.negativeMark ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              index,
                              "negativeMark",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          placeholder="Auto"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500">
                          Duration (s)
                        </label>
                        <input
                          type="number"
                          value={q.duration ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              index,
                              "duration",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          placeholder="Auto"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {draftQuestions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No questions left to review — start over to extract again.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={draftQuestions.every((q) => !q.selected)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-colors ${
              draftQuestions.some((q) => q.selected)
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>
              Add {draftQuestions.filter((q) => q.selected).length} Question
              {draftQuestions.filter((q) => q.selected).length !== 1 ? "s" : ""} to
              Exam
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfQuestionImportAdmin;
