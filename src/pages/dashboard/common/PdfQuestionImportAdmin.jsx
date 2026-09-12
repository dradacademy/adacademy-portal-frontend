import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "katex/dist/katex.min.css";
import { MathText } from "../../utils/mathText";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
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

// Lets an admin upload an arbitrary PDF question paper, have the AI extract
// structured draft questions, review/edit them, and only on explicit
// confirmation merge the selected ones into the exam builder's question
// list. Nothing here ever writes to the database directly — extraction is
// read-only and merging just appends to the parent's `newQuestions` state,
// exactly like the existing Excel import does.
const PdfQuestionImportAdmin = ({ onImportQuestions }) => {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState(null); // null = no review in progress

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error("Please choose a PDF file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsExtracting(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/question-import/extract-from-pdf`,
        formData,
      );

      const extracted = (data.draftQuestions || []).map((q) => ({
        ...q,
        answerKeyText: q.answerKeyText || "",
        answerKeyImage: q.answerKeyImage || null,
        selected: true,
      }));

      setDraftQuestions(extracted);
      toast.success(data.message || `Extracted ${extracted.length} question(s).`);
    } catch (error) {
      console.error("PDF extraction failed:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to extract questions from the PDF.",
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
            <h3 className="font-bold text-gray-900">Import Questions from PDF</h3>
            <p className="text-sm text-gray-600">
              Upload any question paper PDF — AI extracts and structures the
              questions for you to review before adding them.
            </p>
          </div>
        </div>
      </div>

      {draftQuestions === null ? (
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
          {isExtracting && (
            <p className="text-xs text-gray-500 mt-2">
              This can take up to a minute for longer papers — please don't
              close this tab.
            </p>
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
