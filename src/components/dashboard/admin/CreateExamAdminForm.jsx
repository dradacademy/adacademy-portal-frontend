import React from "react";
import Select from "react-select";
import { MdDelete } from "react-icons/md";
import { Box, IconButton, Radio, Checkbox } from "@mui/material";
import { MathText } from "../../../utils/mathText";
import "katex/dist/katex.min.css";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Lets any of the image upload spots below accept a pasted screenshot
// (Ctrl+V) in addition to browsing for a saved file — handy when the admin
// just took a screenshot (e.g. of a diagram from a PDF) and wants to drop
// it straight in without saving it to disk first. `onImage` receives the
// pasted File, exactly like a file-input's onChange would.
const handleImagePaste = (e, onImage) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        onImage(file);
        e.preventDefault();
      }
      return;
    }
  }
};

const CreateExamAdminForm = ({
  subjects,
  subtopics,
  formData,
  handleChange,
  newQuestions,
  handleDeleteQuestion,
  handleQuestionChange,
  handleImageChange,
  handleCorrectAnswerChange,
  handleMSQCorrectAnswerChange,
  handleOptionChange,
  handleOptionImageChange,
  handleDeleteOption,
  handleAddOption,
  setNewQuestions,
  handleDeleteKeyword,
  handleKeywordKeyDown,
  handleAnswerKeyChange,
  bulkRangeConfig,
  handleBulkRangeChange,
  handleApplyBulkRange,
}) => {
  return (
    <div className="flex flex-col gap-4 border border-stone-300 rounded-2xl p-3 bg-white">
      <h1 className=" text-2xl font-bold font-poppins text-stone-700">
        Configure the Questions
      </h1>
      <div className=" grid grid-cols-2 gap-2">
        <Select
          placeholder="Select the Subject"
          name="subject"
          value={
            subjects
              .map((subject) => ({ value: subject._id, label: subject.name }))
              .find((option) => option.value === formData.subject) || null
          }
          onChange={(selectedOption) =>
            handleChange({
              target: { name: "subject", value: selectedOption.value },
            })
          }
          options={subjects.map((subject) => ({
            value: subject._id,
            label: subject.name,
          }))}
          isSearchable={true}
          styles={{
            control: (base) => ({
              ...base,
              borderRadius: "8px",
              padding: "4px",
              borderColor: "#ccc",
              boxShadow: "none",
              "&:hover": { borderColor: "#888" },
            }),
          }}
        />
        <Select
          placeholder="Select the Subtopic"
          name="subTopic"
          value={
            subtopics
              .map((sub) => ({ value: sub._id, label: sub.name }))
              .find((option) => option.value === formData.subTopic) || null
          }
          onChange={(selectedOption) =>
            handleChange({
              target: { name: "subTopic", value: selectedOption.value },
            })
          }
          options={subtopics.map((sub) => ({
            value: sub._id,
            label: sub.name,
          }))}
          isSearchable={true}
          isDisabled={!formData.subject}
          styles={{
            control: (base, state) => ({
              ...base,
              borderRadius: "8px",
              padding: "4px",
              borderColor: state.isDisabled ? "#ccc" : "#888",
              backgroundColor: state.isDisabled ? "#fafafa" : "white",
              boxShadow: "none",
              "&:hover": { borderColor: state.isDisabled ? "#ccc" : "#555" },
            }),
          }}
        />
      </div>
      <div className=" grid grid-cols-2 gap-2 w-full">
        <Select
          name="status"
          value={
            [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ].find((option) => option.value === formData.status) || null
          }
          onChange={(selectedOption) =>
            handleChange({
              target: { name: "status", value: selectedOption.value },
            })
          }
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          isSearchable={false}
          styles={{
            control: (base) => ({
              ...base,
              borderRadius: "8px",
              padding: "4px",
              borderColor: "#ccc",
              boxShadow: "none",
              "&:hover": { borderColor: "#888" },
            }),
          }}
        />
        <input
          type="number"
          placeholder={`Enter the pass percentage (Only number)`}
          name="passPercentage"
          className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
          value={formData.passPercentage}
          onChange={handleChange}
          onWheel={(e) => e.target.blur()}
          inputMode="numeric"
          pattern="[0-9]*"
          max={100}
          min={1}
          required
        />
      </div>
      <div className=" flex flex-col gap-1 w-full sm:w-1/2 sm:pr-1">
        <label className="text-xs font-medium text-stone-500">
          Scheduled Test Date{" "}
          <span className="font-normal text-stone-400">
            (tentative — shown to students and admin; used to mark a
            completed attempt on-time vs late)
          </span>
        </label>
        <input
          type="date"
          name="scheduledDate"
          className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
          value={formData.scheduledDate || ""}
          onChange={handleChange}
        />
      </div>

      {newQuestions.length > 1 && bulkRangeConfig && (
        <div className="border border-indigo-200 bg-indigo-50/60 rounded-2xl p-4 flex flex-col gap-3">
          <h4 className="font-semibold text-indigo-700 text-sm">
            Bulk Apply — set Level / Marks / Negative Mark / Duration for a
            range of questions at once (e.g. Q1–6, then Q7–10 separately).
            Leave a field blank to leave it unchanged; individual question
            fields above can still be fine-tuned afterward.
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">From Q#</label>
              <input
                type="number"
                name="start"
                min={1}
                max={newQuestions.length}
                placeholder="1"
                className="border border-stone-300 py-[9px] px-3 focus:outline-none rounded-lg bg-white w-full"
                value={bulkRangeConfig.start}
                onChange={handleBulkRangeChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">To Q#</label>
              <input
                type="number"
                name="end"
                min={1}
                max={newQuestions.length}
                placeholder={`${newQuestions.length}`}
                className="border border-stone-300 py-[9px] px-3 focus:outline-none rounded-lg bg-white w-full"
                value={bulkRangeConfig.end}
                onChange={handleBulkRangeChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Level</label>
              <select
                name="level"
                className="border border-stone-300 py-[9px] px-2 focus:outline-none rounded-lg bg-white w-full text-sm"
                value={bulkRangeConfig.level}
                onChange={handleBulkRangeChange}
              >
                <option value="">— No change —</option>
                {[1, 2, 3, 4].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Marks</label>
              <input
                type="number"
                name="marks"
                placeholder="Unchanged"
                className="border border-stone-300 py-[9px] px-3 focus:outline-none rounded-lg bg-white w-full"
                value={bulkRangeConfig.marks}
                onChange={handleBulkRangeChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Negative Mark</label>
              <input
                type="number"
                name="negativeMark"
                placeholder="Unchanged"
                className="border border-stone-300 py-[9px] px-3 focus:outline-none rounded-lg bg-white w-full"
                value={bulkRangeConfig.negativeMark}
                onChange={handleBulkRangeChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Duration (s)</label>
              <input
                type="number"
                name="duration"
                placeholder="Unchanged"
                className="border border-stone-300 py-[9px] px-3 focus:outline-none rounded-lg bg-white w-full"
                value={bulkRangeConfig.duration}
                onChange={handleBulkRangeChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyBulkRange}
            className="self-start text-sm bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg cursor-pointer hover:opacity-85 duration-300"
          >
            Apply to Range
          </button>
        </div>
      )}

      {newQuestions.map((question, qIndex) => (
        <div
          key={qIndex}
          className=" border border-stone-300 rounded-2xl bg-stone-50 p-3 flex flex-col gap-1.5"
        >
          <div className=" flex justify-between items-center p-1">
            <h4 className=" font-medium text-stone-600">
              Question {qIndex + 1}
            </h4>
            <button
              className=" text-sm text-white bg-[#FF8383] disabled:opacity-70 font-medium py-1 pb-1.5 px-3 rounded-md cursor-pointer hover:opacity-85 duration-300"
              onClick={() => handleDeleteQuestion(qIndex)}
              disabled={newQuestions.length <= 1}
            >
              Delete
            </button>
          </div>
          <Select
            name="questionType"
            value={
              [
                { value: "MCQ", label: "MCQ" },
                { value: "MSQ", label: "MSQ" },
                { value: "Fill in the Blanks", label: "Fill in the Blanks" },
                { value: "Short Answer", label: "Short Answer" },
              ].find((option) => option.value === question.questionType) || null
            }
            onChange={(selectedOption) =>
              handleQuestionChange(qIndex, {
                target: { name: "questionType", value: selectedOption.value },
              })
            }
            options={[
              { value: "MCQ", label: "MCQ" },
              { value: "MSQ", label: "MSQ" },
              { value: "Fill in the Blanks", label: "Fill in the Blanks" },
              { value: "Short Answer", label: "Short Answer" },
            ]}
            isSearchable={false}
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: "8px",
                padding: "4px",
                borderColor: "#ccc",
                boxShadow: "none",
                "&:hover": { borderColor: "#888" },
              }),
            }}
          />
          <textarea
            type="text"
            placeholder="Question Text"
            name="questionText"
            className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
            value={question.questionText}
            onChange={(e) => handleQuestionChange(qIndex, e)}
            required
          />
          {question.questionText &&
            (question.questionText.includes("^") ||
              question.questionText.includes("\\")) && (
              <div className="text-sm text-stone-500 bg-white border border-dashed border-stone-300 rounded-lg px-4 py-2">
                <span className="text-xs text-stone-400 mr-2">Preview:</span>
                <MathText text={question.questionText} />
              </div>
            )}
          <div className=" grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">Level</label>
              <Select
                name="level"
                value={
                  [1, 2, 3, 4]
                    .map((lvl) => ({ value: lvl, label: `Level ${lvl}` }))
                    .find((option) => option.value === question.level) || null
                }
                onChange={(selectedOption) =>
                  handleQuestionChange(qIndex, {
                    target: { name: "level", value: selectedOption.value },
                  })
                }
                options={[1, 2, 3, 4].map((lvl) => ({
                  value: lvl,
                  label: `Level ${lvl}`,
                }))}
                isSearchable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    padding: "2px",
                    borderColor: "#ccc",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#888" },
                  }),
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">
                Marks (blank = default)
              </label>
              <input
                type="number"
                name="marks"
                placeholder="Auto"
                className=" border border-stone-300 py-[9px] px-4 focus:outline-none rounded-lg bg-white w-full"
                value={question.marks ?? ""}
                onChange={(e) => handleQuestionChange(qIndex, e)}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">
                Negative Mark (blank = default)
              </label>
              <input
                type="number"
                name="negativeMark"
                placeholder="Auto"
                className=" border border-stone-300 py-[9px] px-4 focus:outline-none rounded-lg bg-white w-full"
                value={question.negativeMark ?? ""}
                onChange={(e) => handleQuestionChange(qIndex, e)}
                onWheel={(e) => e.target.blur()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500">
                Duration secs (blank = default)
              </label>
              <input
                type="number"
                name="duration"
                placeholder="Auto"
                className=" border border-stone-300 py-[9px] px-4 focus:outline-none rounded-lg bg-white w-full"
                value={question.duration ?? ""}
                onChange={(e) => handleQuestionChange(qIndex, e)}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </div>
          <div className=" grid grid-cols-2 gap-3">
            {question.image ? (
              <img
                src={
                  typeof question.image === "string"
                    ? question.image
                    : URL.createObjectURL(question.image)
                }
                className=" max-h-40 flex items-center justify-center"
                alt=""
              />
            ) : (
              "No image"
            )}
            <div
              tabIndex={0}
              onPaste={(e) =>
                handleImagePaste(e, (file) =>
                  handleImageChange(qIndex, { target: { files: [file] } })
                )
              }
              className="flex flex-col gap-1 border-2 border-dashed border-stone-300 rounded-xl p-2 bg-white focus:outline-none focus:border-indigo-400"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(qIndex, e)}
                className=" w-full py-2 px-2 font-medium text-center flex items-center justify-center"
              />
              <span className="text-[10px] text-stone-400 text-center">
                or click here and paste (Ctrl+V) a screenshot
              </span>
            </div>
          </div>
          {(question.questionType === "MCQ" ||
            question.questionType === "MSQ") && (
            <>
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((optionObj, optIndex) => {
                  const optionText = typeof optionObj === "object" && optionObj !== null ? optionObj.text : optionObj;
                  const optionImage = typeof optionObj === "object" && optionObj !== null ? optionObj.image : null;

                  return (
                  <Box
                    key={optIndex}
                    sx={{ display: "flex", alignItems: "flex-start", mt: 1, gap: 1 }}
                  >
                    <div className="mt-2">
                    {question.questionType === "MCQ" ? (
                      <Radio
                        checked={question.correctAnswers[0] === optionText}
                        onChange={() =>
                          handleCorrectAnswerChange(qIndex, optionText)
                        }
                      />
                    ) : (
                      <Checkbox
                        checked={question.correctAnswers.includes(optionText)}
                        onChange={(e) =>
                          handleMSQCorrectAnswerChange(
                            qIndex,
                            optionText,
                            e.target.checked,
                          )
                        }
                      />
                    )}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <input
                        type="text"
                        placeholder={`Option ${optIndex + 1} Text`}
                        name="option"
                        className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                        value={optionText || ""}
                        onChange={(e) =>
                          handleOptionChange(qIndex, optIndex, e.target.value)
                        }
                        required
                      />
                      <div className="flex items-center gap-2">
                        <div
                          tabIndex={0}
                          onPaste={(e) =>
                            handleImagePaste(e, (file) =>
                              handleOptionImageChange(qIndex, optIndex, {
                                target: { files: [file] },
                              })
                            )
                          }
                          className="flex items-center gap-1 focus:outline-none"
                          title="Click here and paste (Ctrl+V) a screenshot"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOptionImageChange(qIndex, optIndex, e)}
                            className="text-xs"
                          />
                        </div>
                        {optionImage && (
                          <img
                            src={
                              typeof optionImage === "string"
                                ? optionImage
                                : URL.createObjectURL(optionImage)
                            }
                            alt={`Option ${optIndex + 1}`}
                            className="max-h-10 object-contain"
                          />
                        )}
                      </div>
                    </div>
                    <IconButton
                      onClick={() => handleDeleteOption(qIndex, optIndex)}
                      disabled={question.options.length <= 2}
                      className="mt-1"
                    >
                      <MdDelete />
                    </IconButton>
                  </Box>
                  );
                })}
              </div>

              <div className=" flex items-start justify-start">
                <button
                  className=" text-[13px] text-white bg-indigo-400 font-medium py-1 pb-1.5 px-3 rounded-md cursor-pointer hover:opacity-85 duration-300"
                  onClick={() => handleAddOption(qIndex)}
                  disabled={question.options.length >= 8}
                >
                  Add Option
                </button>
              </div>
            </>
          )}
          {question.questionType === "Fill in the Blanks" && (
            <>
              <input
                type="text"
                placeholder={`Correct Answers (Enter multiple correct answers, separated by commas)`}
                name="correctAnswers"
                className=" border border-stone-300 py-[10px] px-4 focus:outline-none rounded-lg bg-white w-full"
                value={question.correctAnswers.join(", ")}
                onChange={(e) => {
                  const answers = e.target.value
                    .split(",")
                    .map((ans) => ans.trim());
                  setNewQuestions((prev) => {
                    const updated = [...prev];
                    updated[qIndex].correctAnswers = answers;
                    return updated;
                  });
                }}
                required
              />
              <label className="flex items-center gap-2 text-sm text-stone-600 select-none">
                <Checkbox
                  checked={!!question.isNumericAnswer}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, {
                      target: {
                        name: "isNumericAnswer",
                        value: e.target.checked,
                      },
                    })
                  }
                />
                Numeric answer (NAT-style) — show students the on-screen
                number pad instead of a text box, and grade by value (so
                "2.3" and "2.30" both count as correct)
              </label>
            </>
          )}
          {question.questionType === "Short Answer" && (
            <div>
              <div className="flex items-center flex-wrap bg-white rounded-t-lg border border-stone-300 p-2 gap-2">
                {question.correctAnswers.map((keyword, kIndex) => (
                  <div
                    key={kIndex}
                    className="flex items-center bg-blue-100 focus:outline-none text-indigo-400 px-3 py-1 rounded-full text-sm font-medium gap-2 shadow-sm transition-all duration-200"
                  >
                    <span>{keyword}</span>
                    <button
                      onClick={() => handleDeleteKeyword(qIndex, kIndex)}
                      className="text-indigo-400 hover:text-[#FF8383] cursor-pointer font-medium transition-all duration-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add Keyword"
                className="border border-stone-300 py-2 px-4 focus:outline-none rounded-b-lg bg-white w-full text-stone-600"
                onKeyDown={(event) => handleKeywordKeyDown(qIndex, event)}
                required
              />
            </div>
          )}

          {/* Answer Key Section */}
          <div className="mt-4 border-t border-stone-200 pt-4">
            <h5 className="font-medium text-stone-600 mb-2">Answer Key (Optional)</h5>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Answer Key Explanation (Rich Text)</label>
                <div className="bg-white">
                  <ReactQuill 
                    theme="snow" 
                    value={question.answerKeyText || ""} 
                    onChange={(val) => handleAnswerKeyChange(qIndex, "answerKeyText", val)} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Answer Key Image</label>
                  <div
                    tabIndex={0}
                    onPaste={(e) =>
                      handleImagePaste(e, (file) =>
                        handleAnswerKeyChange(qIndex, "answerKeyImage", file)
                      )
                    }
                    className="flex flex-col gap-1 border-2 border-dashed border-stone-300 rounded-xl p-1 bg-white focus:outline-none focus:border-indigo-400"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAnswerKeyChange(qIndex, "answerKeyImage", e.target.files[0]);
                        }
                      }}
                      className="w-full py-1 px-3 font-medium text-center text-sm flex items-center justify-center cursor-pointer duration-300"
                    />
                    <span className="text-[10px] text-stone-400 text-center">
                      or click here and paste (Ctrl+V) a screenshot
                    </span>
                  </div>
                </div>
                {question.answerKeyImage ? (
                  <img
                    src={
                      typeof question.answerKeyImage === "string"
                        ? question.answerKeyImage
                        : URL.createObjectURL(question.answerKeyImage)
                    }
                    className="max-h-24 object-contain flex items-center justify-center border border-stone-200 rounded-lg p-1"
                    alt="Answer Key Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-xl h-24">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default CreateExamAdminForm;
