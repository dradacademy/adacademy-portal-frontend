import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TbBuildingPlus } from "react-icons/tb";
import { IoIosArrowBack } from "react-icons/io";
import * as XLSX from "xlsx";
import CreateExamAdminForm from "../../../../components/dashboard/admin/CreateExamAdminForm";
import QuestionSetManager from "../../../../components/dashboard/admin/QuestionSetManager";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Target,
  Upload,
  Zap,
} from "lucide-react";
import BulkQuestionUploadAdmin from "../../common/BulkQuestionUploadAdmin";
import PdfQuestionImportAdmin from "../../common/PdfQuestionImportAdmin";
import { useContext } from "react";
import { ExamContext } from "../../../../context/ExamContext";
import { EXAM_CATEGORY_OPTIONS } from "../../../../constants/examCategories";
import Select from "react-select";

const sampleExcelData = [
  ["Subject", "SubTopic", "Status", "PassPercentage"],
  ["", "", "active", 90],
  [],
  [
    "QuestionType",
    "QuestionText",
    "Options",
    "CorrectAnswers",
    "Image",
    "Level",
    "Marks",
    "NegativeMark",
    "Duration",
  ],
  ["MCQ", "ques 1", ["1", "2"], ["1"], null, 1, "", "", ""],
  ["MSQ", "ques 2", ["1", "2", "3"], ["2", "3"], null, 2, "", "", ""],
  ["Fill in the Blanks", "ques 3", null, ["true", "yes"], null, 1, "", "", ""],
  ["Short Answer", "ques 4", null, ["one ", "two", "three"], null, 3, "", "", ""],
];

const CreateExamAdminPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [excelTemplateData, setExcelTemplateData] = useState([
    ...sampleExcelData.map((row) => [...row]),
  ]);
  const [fileData, setFileData] = useState(null);
  const subject = searchParams.get("subjectId") || "";
  const subTopic = searchParams.get("subTopicId") || "";
  // Explicit examId decides create-vs-edit now that an exam's position in
  // its subject+subTopic sequence (`order`) is auto-assigned, not chosen
  // by the admin the way `level` used to be.
  const examId = searchParams.get("examId") || null;

  const [formData, setFormData] = useState({
    subject: "",
    subTopic: "",
    status: "active",
    passPercentage: null,
    questions: [],
  });

  // Question Set State
  const [questionSets, setQuestionSets] = useState([]); // Initialize empty, Manager will fill default
  const [activeQuestionSetIndex, setActiveQuestionSetIndex] = useState(0);

  // Deprecated state (kept for compatibility in case of revert, but unused effectively)
  const [questionSelection, setQuestionSelection] = useState({
    MCQ: { startIndex: 0, count: 0 },
    MSQ: { startIndex: 0, count: 0 },
    "Fill in the Blanks": { startIndex: 0, count: 0 },
    "Short Answer": { startIndex: 0, count: 0 },
  });

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      subject: subject,
      subTopic: subTopic,
    }));
  }, [subject, subTopic]);

  const [newQuestions, setNewQuestions] = useState([
    {
      questionType: "MCQ",
      questionText: "",
      level: 2,
      marks: null,
      negativeMark: null,
      duration: null,
      options: [{ text: "", image: null }, { text: "", image: null }],
      correctAnswers: [],
      image: null,
      answerKeyText: "",
      answerKeyImage: null,
    },
  ]);

  const { subjects } = useContext(ExamContext);
  const [subtopics, setSubtopics] = useState([]);
  const [allExams, setAllExams] = useState([]);

  // Category-aware subject filtering — "GATE has a separate way to input
  // questions": the admin picks (or arrives via ?category=) the exam
  // category first, and the Subject dropdown below only ever lists
  // subjects belonging to that category, so a GATE exam can never
  // accidentally get built under a TNPSC subject or vice versa.
  const categoryFromUrl = searchParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  // If editing an existing exam, infer the category from its subject once
  // subjects/exam data are loaded (covers deep-links that only pass
  // subjectId/subTopicId, without a category param).
  useEffect(() => {
    if (selectedCategory || !formData.subject) return;
    const matchedSubject = subjects.find((s) => s._id === formData.subject);
    if (matchedSubject?.category) {
      setSelectedCategory(matchedSubject.category);
    }
  }, [selectedCategory, formData.subject, subjects]);

  const categoryFilteredSubjects = selectedCategory
    ? subjects.filter((s) => s.category === selectedCategory)
    : subjects;

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/exams/getAll`)
      .then((examsRes) => {
        setAllExams(examsRes.data);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  useEffect(() => {
    if (formData.subject) {
      const subtopicsDataForSubject = subjects
        .filter((sub) => sub._id === formData.subject)
        .map((sub) => sub.subtopics)
        .flat();

      setSubtopics(subtopicsDataForSubject);

      if (subtopicsDataForSubject.some((sub) => sub._id === subTopic)) {
        setFormData((prevData) => ({
          ...prevData,
          subTopic: subTopic,
        }));
      }
    }
  }, [formData.subject, subTopic, subjects]);

  useEffect(() => {
    if (!formData.subject || !formData.subTopic) return;

    const existingExam = examId
      ? allExams.find((exam) => exam._id === examId)
      : null;

    if (existingExam) {
      setFormData((prev) => ({
        ...prev,
        questions:
          existingExam.poolQuestions && existingExam.poolQuestions.length > 0
            ? existingExam.poolQuestions
            : existingExam.questions,
        passPercentage: existingExam.passPercentage,
      }));

      const sourceQuestions = (
        existingExam.poolQuestions && existingExam.poolQuestions.length > 0
          ? existingExam.poolQuestions
          : existingExam.questions
      ).map(q => ({
        ...q,
        level: q.level ?? 2,
        marks: q.marks ?? null,
        negativeMark: q.negativeMark ?? null,
        duration: q.duration ?? null,
        options: q.options ? q.options.map(opt => typeof opt === "string" ? { text: opt, image: null } : opt) : q.options,
        answerKeyText: q.answerKeyText || "",
        answerKeyImage: q.answerKeyImage || null,
      }));
      setNewQuestions(sourceQuestions);

      // Load Question Sets
      if (existingExam.questionSets && existingExam.questionSets.length > 0) {
        // Transform backend question sets (which have ObjectIds in questions array) to indices
        // This requires mapping IDs back to indices in sourceQuestions
        // NOTE: sourceQuestions is array of Question Objects

        const questionIdToIndexMap = new Map();
        sourceQuestions.forEach((q, idx) => {
          if (q._id) questionIdToIndexMap.set(q._id.toString(), idx);
        });

        const transformedSets = existingExam.questionSets.map((set) => {
          if (set.selectionType === "manual" && Array.isArray(set.questions)) {
            // set.questions are IDs (strings or objects)
            const indices = set.questions
              .map((qId) => {
                const idStr =
                  typeof qId === "object"
                    ? qId._id?.toString() || qId.toString()
                    : qId;
                return questionIdToIndexMap.get(idStr);
              })
              .filter((idx) => idx !== undefined);
            return { ...set, questions: indices };
          }
          return set;
        });

        setQuestionSets(transformedSets);

        // Determine active set index
        if (existingExam.activeQuestionSetId) {
          const activeIndex = existingExam.questionSets.findIndex(
            (s) => s._id === existingExam.activeQuestionSetId,
          );
          setActiveQuestionSetIndex(activeIndex !== -1 ? activeIndex : 0);
        } else {
          setActiveQuestionSetIndex(0);
        }
      } else {
        // Legacy Exam: Create ad-hoc Default Set with all questions selected manually
        // This mimics the 'legacy' behavior where all questions were active.
        // OR should we use questionSelection?
        // questionSelection was ranges.
        // Ideally we convert ranges to indices.
        // But simpler: just select all. User can edit.

        // Check if we have questionSelection to mimic ranges?
        // Maybe too complex. "Select All Manual" is safest default.
        // It ensures nothing is hidden.
        setQuestionSets([
          {
            name: "Legacy Default Set",
            selectionType: "manual",
            questions: existingExam.questions.map((_, i) => i),
            config: {
              MCQ: { count: 0 },
              MSQ: { count: 0 },
              "Fill in the Blanks": { count: 0 },
              "Short Answer": { count: 0 },
            },
          },
        ]);
        setActiveQuestionSetIndex(0);
      }

      const updatedExcelData = [...sampleExcelData.map((row) => [...row])];
      updatedExcelData[1][0] = formData.subject;
      updatedExcelData[1][1] = formData.subTopic;

      existingExam?.questions?.forEach((question, index) => {
        while (updatedExcelData.length <= index + 4) {
          updatedExcelData.push(["", "", "", "", "", "", "", "", ""]);
        }

        updatedExcelData[index + 4][0] = question.questionType;
        updatedExcelData[index + 4][1] = question.questionText;

        if (
          question.questionType === "MCQ" ||
          question.questionType === "MSQ"
        ) {
          updatedExcelData[index + 4][2] = question.options?.map(o => typeof o === "object" ? o.text : o).join(",");
          updatedExcelData[index + 4][3] = question.correctAnswers?.join(",");
        } else {
          updatedExcelData[index + 4][2] = null;
          updatedExcelData[index + 4][3] = question.correctAnswers;
        }

        updatedExcelData[index + 4][4] = question.image;
        updatedExcelData[index + 4][5] = question.level ?? 2;
        updatedExcelData[index + 4][6] = question.marks ?? "";
        updatedExcelData[index + 4][7] = question.negativeMark ?? "";
        updatedExcelData[index + 4][8] = question.duration ?? "";
      });

      setExcelTemplateData(updatedExcelData);
    } else {
      setNewQuestions([
        {
          questionType: "MCQ",
          questionText: "",
          level: 2,
          marks: null,
          negativeMark: null,
          duration: null,
          options: [{ text: "", image: null }, { text: "", image: null }],
          correctAnswers: [],
          image: null,
          answerKeyText: "",
          answerKeyImage: null,
        },
      ]);

      // Reset sets for new exam
      setQuestionSets([
        {
          name: "Default Set",
          selectionType: "manual",
          questions: [0], // Auto-select the first dummy question
          config: {
            MCQ: { count: 0 },
            MSQ: { count: 0 },
            "Fill in the Blanks": { count: 0 },
            "Short Answer": { count: 0 },
          },
        },
      ]);
      setActiveQuestionSetIndex(0);
    }

    const updatedData = [...excelTemplateData];
    updatedData[1] = [formData.subject, formData.subTopic, "active", 90];
    setExcelTemplateData(updatedData);
  }, [formData.subject, formData.subTopic, examId, allExams]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      questions: newQuestions,
    }));
  }, [newQuestions]);

  // Removed old Auto-update question selection logic

  // Can Rollback
  // const downloadTemplate = () => {
  //   const headerRow = [
  //     "Subject",
  //     "SubTopic",
  //     "Level",
  //     "Status",
  //     "PassPercentage",
  //   ];

  //   const detailsRow = [
  //     formData.subject,
  //     formData.subTopic,
  //     formData.level,
  //     formData.status,
  //     formData.passPercentage,
  //   ];

  //   const questionHeaderRow = [
  //     "QuestionText",
  //     "QuestionType",
  //     "Options",
  //     "CorrectAnswers",
  //     "Image",
  //   ];

  //   const questionRows = newQuestions.map((q) => [
  //     q.questionText,
  //     q.questionType,
  //     q.options?.join(",") || "",
  //     q.correctAnswers.join(","),
  //     q.image,
  //   ]);

  //   const excelData = [
  //     headerRow,
  //     detailsRow,
  //     [],
  //     questionHeaderRow,
  //     ...questionRows,
  //   ];

  //   const ws = XLSX.utils.aoa_to_sheet(excelData);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Exam Template");

  //   XLSX.writeFile(wb, "Exam_Template.xlsx");
  // };
  const downloadTemplate = () => {
    const headerRow = ["Subject", "SubTopic", "Status", "PassPercentage"];

    const detailsRow = [
      formData.subject,
      formData.subTopic,
      formData.status,
      formData.passPercentage,
    ];

    const questionHeaderRow = [
      "QuestionText",
      "QuestionType",
      "Options",
      "CorrectAnswers",
      "Image",
      "Level",
      "Marks",
      "NegativeMark",
      "Duration",
    ];

    const sampleQuestions = [
      ["What is 2 + 2?", "MCQ", "1,2,3,4", "4", "", 1, "", "", ""],
      [
        "Which of the following are prime numbers?",
        "MSQ",
        "2,3,4,5,6",
        "2,3,5",
        "",
        2,
        "",
        "",
        "",
      ],
      ["The capital of France is ____.", "Fill in the Blanks", "", "Paris", "", 1, "", "", ""],
      [
        "Explain the water cycle briefly.",
        "Short Answer",
        "",
        "evaporation,condensation,precipitation",
        "",
        3,
        "",
        "",
        "",
      ],
    ];

    const excelData = [
      headerRow,
      detailsRow,
      [], // empty row separator
      questionHeaderRow,
      ...sampleQuestions,
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Template");

    XLSX.writeFile(wb, "Exam_Template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    setFileData(file);
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = (e) => {
      const bufferArray = e.target.result;
      const wb = XLSX.read(bufferArray, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Get raw rows as arrays (no header inference)
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      processExcelData(rawRows);
    };
  };

  const processExcelData = (rawRows) => {
    // Row 0: ["Subject","SubTopic","Level","Status","PassPercentage"]
    // Row 1: [subjectId, subTopicId, level, status, passPercentage]
    // Row 2: [] (empty)
    // Row 3: ["QuestionText","QuestionType","Options","CorrectAnswers","Image"]
    // Row 4+: question data

    const detailsRow = rawRows[1] || [];
    const status = detailsRow[3] || "active";
    const passPercentage = detailsRow[4] || 90;

    // Find the question header row (look for "QuestionText" anywhere)
    const questionHeaderRowIndex = rawRows.findIndex((row) =>
      row.some(
        (cell) =>
          typeof cell === "string" &&
          cell.trim().toLowerCase() === "questiontext",
      ),
    );

    if (questionHeaderRowIndex === -1) {
      toast.error(
        'Invalid template format. Could not find "QuestionText" header row.',
      );
      return;
    }

    const questionHeaderRow = rawRows[questionHeaderRowIndex];

    // Build a column index map from the header row
    const colIndex = {};
    questionHeaderRow.forEach((header, i) => {
      if (typeof header === "string") {
        colIndex[header.trim()] = i;
      }
    });

    // Parse all rows after the header
    const uploadedQuestions = rawRows
      .slice(questionHeaderRowIndex + 1)
      .filter((row) => row[colIndex["QuestionText"]]?.toString().trim()) // skip empty rows
      .map((row) => {
        const questionText =
          row[colIndex["QuestionText"]]?.toString().trim() || "";
        const questionType =
          row[colIndex["QuestionType"]]?.toString().trim() || "MCQ";

        let options = [];
        const rawOptions = row[colIndex["Options"]];
        // if (rawOptions && typeof rawOptions === "string" && rawOptions.trim()) {
        //   options = rawOptions
        //     .split(",")
        //     .map((opt) => opt.trim())
        //     .filter(Boolean);
        // }
        if (
          rawOptions !== undefined &&
          rawOptions !== null &&
          rawOptions !== ""
        ) {
          options = String(rawOptions)
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean);
        }

        let correctAnswers = [];
        const rawAnswers = row[colIndex["CorrectAnswers"]];
        // if (rawAnswers && typeof rawAnswers === "string" && rawAnswers.trim()) {
        //   correctAnswers = rawAnswers
        //     .split(",")
        //     .map((ans) => ans.trim())
        //     .filter(Boolean);
        // }
        if (
          rawAnswers !== undefined &&
          rawAnswers !== null &&
          rawAnswers !== ""
        ) {
          correctAnswers = String(rawAnswers)
            .split(",")
            .map((ans) => ans.trim())
            .filter(Boolean);
        }

        // For MCQ/MSQ: resolve short labels (e.g. "A","B") to full option strings
        if (
          (questionType === "MCQ" || questionType === "MSQ") &&
          options.length > 0
        ) {
          correctAnswers = correctAnswers
            .map((ans) => {
              // If already a full option string, keep it
              if (options.includes(ans)) return ans;
              // Try to match as a label prefix (e.g. "A" matches "A. Liquid limit")
              const match = options.find(
                (opt) =>
                  opt.split(".")[0].trim().toUpperCase() === ans.toUpperCase(),
              );
              return match || null;
            })
            .filter(Boolean);
          // Deduplicate
          correctAnswers = [...new Set(correctAnswers)];
          
          options = options.map(opt => ({ text: String(opt).trim(), image: null }));
        }

        const image = row[colIndex["Image"]] || null;

        const parseOptionalNumber = (raw) => {
          if (raw === undefined || raw === null || raw === "") return null;
          const num = Number(raw);
          return Number.isFinite(num) ? num : null;
        };

        const rawLevel = row[colIndex["Level"]];
        const level = parseOptionalNumber(rawLevel) ?? 2;
        const marks = parseOptionalNumber(row[colIndex["Marks"]]);
        const negativeMark = parseOptionalNumber(row[colIndex["NegativeMark"]]);
        const duration = parseOptionalNumber(row[colIndex["Duration"]]);

        return {
          questionText,
          questionType,
          options,
          correctAnswers,
          image,
          level,
          marks,
          negativeMark,
          duration,
        };
      });

    if (uploadedQuestions.length === 0) {
      toast.error("No valid questions found in the uploaded file.");
      return;
    }

    // Preserve subject/subTopic/level — only update status/passPercentage
    setFormData((prev) => ({
      ...prev,
      status: status || prev.status,
      passPercentage: passPercentage || prev.passPercentage,
    }));

    // Append to existing non-empty questions
    setNewQuestions((prev) => {
      const existingFiltered = prev.filter((q) => q.questionText.trim() !== "");
      const merged = [...existingFiltered, ...uploadedQuestions];

      setQuestionSets([
        {
          name: "Imported Set",
          selectionType: "manual",
          questions: merged.map((_, i) => i),
          config: {
            MCQ: { count: 0 },
            MSQ: { count: 0 },
            "Fill in the Blanks": { count: 0 },
            "Short Answer": { count: 0 },
          },
        },
      ]);
      setActiveQuestionSetIndex(0);

      return merged;
    });

    toast.success(
      `${uploadedQuestions.length} questions imported successfully!`,
    );
  };

  // Merges admin-approved draft questions from the PDF-import review screen
  // into the question list — mirrors the Excel-import merge above so both
  // paths behave identically once questions land in newQuestions.
  const handlePdfImportQuestions = (importedQuestions) => {
    setNewQuestions((prev) => {
      const existingFiltered = prev.filter((q) => q.questionText.trim() !== "");
      const merged = [...existingFiltered, ...importedQuestions];

      setQuestionSets([
        {
          name: "Imported Set",
          selectionType: "manual",
          questions: merged.map((_, i) => i),
          config: {
            MCQ: { count: 0 },
            MSQ: { count: 0 },
            "Fill in the Blanks": { count: 0 },
            "Short Answer": { count: 0 },
          },
        },
      ]);
      setActiveQuestionSetIndex(0);

      return merged;
    });
  };

  // Can Rollback
  // const processExcelData = (data) => {
  //   const examDetails = data[0];
  //   const subjectId = examDetails.Subject || "";
  //   const subTopicId = examDetails.SubTopic || "";

  //   const questions = data
  //     .slice(2)
  //     .filter((row) => row.Subject)
  //     .map((row) => {
  //       let options = [];
  //       if (row.Level && typeof row.Level === "string") {
  //         options = row.Level.split(",").map((opt) => opt.trim());
  //       }

  //       let correctAnswers = [];
  //       if (row.Status && typeof row.Status === "string") {
  //         correctAnswers = row.Status.split(",").map((ans) => ans.trim());
  //       }

  //       return {
  //         questionText: row.Subject,
  //         questionType: row.SubTopic,
  //         options: options,
  //         correctAnswers: correctAnswers,
  //         image: row.PassPercentage || null,
  //       };
  //     });

  //   const formattedData = {
  //     subject: subjectId,
  //     subTopic: subTopicId,
  //     level: examDetails.Level,
  //     status: examDetails.Status || "active",
  //     passPercentage: examDetails.PassPercentage || 90,
  //     questions: questions,
  //   };

  //   setFormData(formattedData);
  //   setNewQuestions(questions);

  //   // Automatically select all imported questions in a default set
  //   setQuestionSets([{
  //       name: "Imported Set",
  //       selectionType: "manual",
  //       questions: questions.map((_, i) => i),
  //       config: { MCQ: { count: 0 }, MSQ: { count: 0 }, "Fill in the Blanks": { count: 0 }, "Short Answer": { count: 0 } },
  //   }]);
  //   setActiveQuestionSetIndex(0);
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "passPercentage" ? parseInt(value) || 90 : value,
    }));
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updatedQuestions = [...newQuestions];
    updatedQuestions[index].image = file;
    setNewQuestions(updatedQuestions);
  };

  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target;
    setNewQuestions((prev) => {
      const updated = [...prev];
      if (name === "level") {
        updated[index][name] = parseInt(value, 10) || 1;
      } else if (
        name === "marks" ||
        name === "negativeMark" ||
        name === "duration"
      ) {
        updated[index][name] = value === "" ? null : Number(value);
      } else {
        updated[index][name] = value;
      }

      if (name === "questionType") {
        updated[index].correctAnswers = [];
        if (value === "MCQ" || value === "MSQ") {
          updated[index].options = [{ text: "", image: null }, { text: "", image: null }];
        }
      }

      return updated;
    });
  };

  // Bulk "apply to a range of questions" tool — e.g. Q1-6 = Level 1,
  // Q7-10 = Level 2 — lets the admin set level/marks/negative mark/duration
  // across a block of questions in one action instead of editing each
  // question individually. Individual per-question editing (above) is
  // untouched and can still be used afterward to fine-tune any single
  // question within (or outside) the range.
  const [bulkRangeConfig, setBulkRangeConfig] = useState({
    start: "",
    end: "",
    level: "",
    marks: "",
    negativeMark: "",
    duration: "",
  });

  const handleBulkRangeChange = (e) => {
    const { name, value } = e.target;
    setBulkRangeConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyBulkRange = () => {
    const start = parseInt(bulkRangeConfig.start, 10);
    const end = parseInt(bulkRangeConfig.end, 10);

    if (
      !start ||
      !end ||
      start < 1 ||
      end < start ||
      end > newQuestions.length
    ) {
      toast.error(
        `Enter a valid question range between 1 and ${newQuestions.length}`
      );
      return;
    }

    const hasLevel = bulkRangeConfig.level !== "";
    const hasMarks = bulkRangeConfig.marks !== "";
    const hasNegativeMark = bulkRangeConfig.negativeMark !== "";
    const hasDuration = bulkRangeConfig.duration !== "";

    if (!hasLevel && !hasMarks && !hasNegativeMark && !hasDuration) {
      toast.error(
        "Set at least one field (Level / Marks / Negative Mark / Duration) to apply"
      );
      return;
    }

    setNewQuestions((prev) => {
      const updated = [...prev];
      for (let i = start - 1; i <= end - 1; i++) {
        if (!updated[i]) continue;
        if (hasLevel) updated[i].level = parseInt(bulkRangeConfig.level, 10);
        if (hasMarks) updated[i].marks = Number(bulkRangeConfig.marks);
        if (hasNegativeMark)
          updated[i].negativeMark = Number(bulkRangeConfig.negativeMark);
        if (hasDuration) updated[i].duration = Number(bulkRangeConfig.duration);
      }
      return updated;
    });

    toast.success(
      `Applied to Question ${start}–${end} (${end - start + 1} question${
        end - start + 1 > 1 ? "s" : ""
      })`
    );
  };

  const handleAddOption = (qIndex) => {
    setNewQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIndex].options.length < 8) {
        updated[qIndex].options.push({ text: "", image: null });
      } else {
        toast.error("Maximum of 8 options allowed!");
      }
      return updated;
    });
  };

  const handleDeleteOption = (qIndex, optionIndex) => {
    setNewQuestions((prev) => {
      const updated = [...prev];

      if (updated[qIndex].options.length > 2) {
        const optionToRemove = updated[qIndex].options[optionIndex];
        const optionTextToRemove = typeof optionToRemove === "object" ? optionToRemove.text : optionToRemove;
        
        updated[qIndex].options.splice(optionIndex, 1);
        updated[qIndex].correctAnswers = updated[qIndex].correctAnswers.filter(
          (answer) => answer !== optionTextToRemove,
        );
      } else {
        toast.error("MCQ/MSQ questions must have at least 2 options!");
      }

      return updated;
    });
  };

  const handleOptionChange = (qIndex, optionIndex, value) => {
    setNewQuestions((prev) => {
      const updated = [...prev];
      const oldOption = updated[qIndex].options[optionIndex];
      const oldValue = typeof oldOption === "object" ? oldOption.text : oldOption;
      
      if (typeof updated[qIndex].options[optionIndex] === "object") {
        updated[qIndex].options[optionIndex].text = value;
      } else {
        updated[qIndex].options[optionIndex] = { text: value, image: null };
      }

      if (updated[qIndex].correctAnswers.includes(oldValue)) {
        updated[qIndex].correctAnswers = updated[qIndex].correctAnswers.map(
          (answer) => (answer === oldValue ? value : answer),
        );
      }
      return updated;
    });
  };

  const handleOptionImageChange = (qIndex, optionIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestions((prev) => {
      const updated = [...prev];
      if (typeof updated[qIndex].options[optionIndex] === "object") {
         updated[qIndex].options[optionIndex].image = file;
      } else {
         updated[qIndex].options[optionIndex] = { text: updated[qIndex].options[optionIndex], image: file };
      }
      return updated;
    });
  };

  const handleAnswerKeyChange = (qIndex, field, value) => {
    setNewQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex][field] = value;
      return updated;
    });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    setNewQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].correctAnswers = [value];
      return updated;
    });
  };

  const handleMSQCorrectAnswerChange = (qIndex, value, isChecked) => {
    setNewQuestions((prev) => {
      const updated = [...prev];
      if (isChecked) {
        updated[qIndex].correctAnswers = [
          ...updated[qIndex].correctAnswers,
          value,
        ];
      } else {
        updated[qIndex].correctAnswers = updated[qIndex].correctAnswers.filter(
          (v) => v !== value,
        );
      }
      return updated;
    });
  };

  const handleAddQuestion = () => {
    setNewQuestions((prev) => {
      const newIndex = prev.length;

      // Keep a newly added question included in every manual-selection
      // question set. Without this, a question created after the initial
      // default set (which only auto-selects the first question) is saved
      // but never actually shown to students — the exam silently only
      // uses whichever questions were checked in the active set.
      setQuestionSets((prevSets) =>
        prevSets.map((set) =>
          set.selectionType === "manual"
            ? {
                ...set,
                questions: [...(set.questions || []), newIndex].sort(
                  (a, b) => a - b,
                ),
              }
            : set,
        ),
      );

      return [
        ...prev,
        {
          questionType: "MCQ",
          questionText: "",
          level: 2,
          marks: null,
          negativeMark: null,
          duration: null,
          options: [{ text: "", image: null }, { text: "", image: null }],
          correctAnswers: [],
          image: null,
          answerKeyText: "",
          answerKeyImage: null,
        },
      ];
    });
  };

  const handleDeleteQuestion = (index) => {
    setNewQuestions((prev) => prev.filter((_, qIndex) => qIndex !== index));
    // Also remove from question sets if indices shift?
    // Indices cleanup is complex.
    // If we delete Q at index I, all indices > I must be decremented.
    // And if Set contained I, remove it.

    setQuestionSets((prevSets) => {
      return prevSets.map((set) => {
        if (set.selectionType === "manual") {
          const newIndices = set.questions
            .filter((idx) => idx !== index)
            .map((idx) => (idx > index ? idx - 1 : idx));
          return { ...set, questions: newIndices };
        }
        return set;
      });
    });
  };

  const handleKeywordKeyDown = (qIndex, event) => {
    if (event.key === "Enter" && event.target.value.trim() !== "") {
      event.preventDefault();
      const newKeyword = event.target.value.trim();

      setNewQuestions((prev) =>
        prev.map((question, index) =>
          index === qIndex
            ? {
                ...question,
                correctAnswers: [...question.correctAnswers, newKeyword],
              }
            : question,
        ),
      );

      event.target.value = "";
    }
  };

  const handleDeleteKeyword = (qIndex, kIndex) => {
    setNewQuestions((prev) => {
      return prev.map((question, index) =>
        index === qIndex
          ? {
              ...question,
              correctAnswers: question.correctAnswers.filter(
                (_, i) => i !== kIndex,
              ),
            }
          : question,
      );
    });
  };

  const validateForm = () => {
    if (!selectedCategory) {
      toast.error("Please select an exam category!");
      return false;
    }
    if (!formData.subject) {
      toast.error("Please select any subject!");
      return false;
    }
    if (!formData.subTopic) {
      toast.error("Please select any subtopic!");
      return false;
    }

    if (!formData.passPercentage) {
      toast.error("Please add any pass percentage!");
      return false;
    }

    if (newQuestions.length === 0) {
      toast.error("Please add at least one question!");
      return false;
    }

    const hasValidQuestions = newQuestions.every((q, qIndex) => {
      if (!q.questionText.trim()) {
        toast.error("All questions must have text!");
        return false;
      }

      if (!q.level) {
        toast.error(`Question ${qIndex + 1}: Please select a level!`);
        return false;
      }

      if (
        (q.questionType === "MCQ" || q.questionType === "MSQ") &&
        (q.options.length < 2 || q.correctAnswers.length === 0)
      ) {
        toast.error(
          "MCQ/MSQ questions must have at least 2 options and 1 correct answer!",
        );
        return false;
      }

      if (
        (q.questionType === "MCQ" || q.questionType === "MSQ") &&
        q.correctAnswers.some((ans) => !q.options.map(o => typeof o === "object" ? o.text : o).includes(ans))
      ) {
        toast.error(
          `Question ${qIndex + 1}: Some correct answers don't match any option.`,
        );
        return false;
      }

      if (
        q.questionType === "Fill in the Blanks" &&
        q.correctAnswers.length === 0
      ) {
        toast.error(
          "Fill in the Blanks questions must have at least one correct answer!",
        );
        return false;
      }

      if (q.questionType === "Short Answer" && q.correctAnswers.length === 0) {
        toast.error("Short Answer questions must have at least one keyword!");
        return false;
      }

      return true;
    });

    if (!hasValidQuestions) return false;

    // Validate Question Sets
    const activeSet = questionSets[activeQuestionSetIndex];
    if (!activeSet) {
      toast.error("Please select an active question set!");
      return false;
    }

    if (activeSet.selectionType === "manual") {
      if (!activeSet.questions || activeSet.questions.length === 0) {
        toast.error(
          "The active question set must have at least one question selected!",
        );
        return false;
      }
    } else {
      const totalRandom = Object.values(activeSet.config || {}).reduce(
        (acc, c) => acc + (c.count || 0),
        0,
      );
      if (totalRandom === 0) {
        toast.error(
          "The active random question set must select at least one question!",
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const existingExam = examId
        ? allExams.find((exam) => exam._id === examId)
        : null;

      const uploadToCloudinary = async (file) => {
        if (!file || typeof file !== "object") return file;
        const data = new FormData();
        data.append("file", file);
        data.append(
          "upload_preset",
          import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET,
        );
        data.append(
          "cloud_name",
          import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME,
        );
        try {
          const cloudinaryAxios = axios.create({
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          delete cloudinaryAxios.defaults.headers.common["Authorization"];
          delete cloudinaryAxios.defaults.headers.common["authorization"];
          const res = await cloudinaryAxios.post(
            `https://api.cloudinary.com/v1_1/${
              import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME
            }/image/upload`,
            data,
          );
          return res.data.url;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Unable to upload image");
          return null;
        }
      };

      const updatedQuestions = await Promise.all(
        formData.questions.map(async (question) => {
          let updatedQ = { ...question };
          
          if (question.image && typeof question.image === "object") {
            updatedQ.image = await uploadToCloudinary(question.image) || question.image;
          }
          if (question.answerKeyImage && typeof question.answerKeyImage === "object") {
            updatedQ.answerKeyImage = await uploadToCloudinary(question.answerKeyImage) || question.answerKeyImage;
          }
          if (question.options) {
            updatedQ.options = await Promise.all(question.options.map(async opt => {
              if (opt.image && typeof opt.image === "object") {
                const url = await uploadToCloudinary(opt.image);
                return { ...opt, image: url || opt.image };
              }
              return opt;
            }));
          }
          return updatedQ;
        }),
      );

      const updatedFormData = {
        ...formData,
        questions: updatedQuestions,
        questionSets: questionSets,
        activeQuestionSetIndex: activeQuestionSetIndex,
      };

      if (existingExam) {
        // Find ID of active set if it exists
        if (
          questionSets[activeQuestionSetIndex] &&
          questionSets[activeQuestionSetIndex]._id
        ) {
          updatedFormData.activeQuestionSetId =
            questionSets[activeQuestionSetIndex]._id;
        }

        await axios.put(
          `${import.meta.env.VITE_APP_API_URL}/exams/update/${
            existingExam._id
          }`,
          updatedFormData,
        );
        toast.success("Exam Updated Successfully!");
        navigate("/dashboard/exam/");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/exams/create`,
          updatedFormData,
        );
        toast.success("Exam Created Successfully!");
        navigate("/dashboard/exam/");
      }
    } catch (error) {
      console.error("Error creating/updating exam:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create the Exam.",
      );
    }
  };

  return (
    <div className=" flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between gap-20 font-inter">
        <div className=" flex flex-col gap-2">
          <div
            onClick={() => navigate(-1)}
            className=" group text-stone-500 font-medium text-sm flex items-center gap-2 w-fit cursor-pointer"
          >
            <div className=" border border-stone-300 bg-white rounded-md p-1.5">
              <IoIosArrowBack />
            </div>
            <p className=" group-hover:underline duration-300">Back</p>
          </div>
          <div className=" flex justify-between items-center gap-4">
            <div className=" flex flex-col gap-2">
              <h1 className=" text-3xl text-stone-700 font-bold font-poppins">
                Create Exam
              </h1>
              <p className=" text-stone-400 font-medium">
                Create and customize exams with ease. Add exam details, define
                questions, set question types, and organize content efficiently
                to ensure a structured assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className=" flex flex-col gap-4">
        <div className=" flex flex-col gap-2 border border-stone-300 rounded-2xl p-3 bg-white max-w-md">
          <label className=" text-sm font-medium text-stone-500 font-inter">
            Exam Category
          </label>
          <Select
            placeholder="Select the exam category"
            value={
              EXAM_CATEGORY_OPTIONS.find(
                (opt) => opt.value === selectedCategory,
              ) || null
            }
            onChange={(selectedOption) => {
              setSelectedCategory(selectedOption.value);
              // Changing category invalidates any subject/subtopic picked
              // under the previous category — never let a stale subject
              // from one category silently carry into another.
              setFormData((prev) => ({ ...prev, subject: "", subTopic: "" }));
            }}
            options={EXAM_CATEGORY_OPTIONS}
            isSearchable={false}
            isDisabled={!!examId}
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
          {examId && (
            <p className=" text-xs text-stone-400">
              Category is locked while editing an existing exam.
            </p>
          )}
        </div>
        {formData.subject != "" && formData.subTopic != "" && (
            <BulkQuestionUploadAdmin
              fileData={fileData}
              downloadTemplate={downloadTemplate}
              handleExcelUpload={handleExcelUpload}
            />
          )}
        {formData.subject != "" && formData.subTopic != "" && (
            <PdfQuestionImportAdmin onImportQuestions={handlePdfImportQuestions} />
          )}
        {/* Question Set Manager Component - Replaces old selection */}
        {newQuestions.length > 0 && (
          <QuestionSetManager
            questions={newQuestions}
            questionSets={questionSets}
            setQuestionSets={setQuestionSets}
            activeSetIndex={activeQuestionSetIndex}
            setActiveSetIndex={setActiveQuestionSetIndex}
          />
        )}

        <CreateExamAdminForm
          subjects={categoryFilteredSubjects}
          subtopics={subtopics}
          formData={formData}
          handleChange={handleChange}
          newQuestions={newQuestions}
          handleDeleteQuestion={handleDeleteQuestion}
          handleQuestionChange={handleQuestionChange}
          handleImageChange={handleImageChange}
          handleCorrectAnswerChange={handleCorrectAnswerChange}
          handleMSQCorrectAnswerChange={handleMSQCorrectAnswerChange}
          handleOptionChange={handleOptionChange}
          handleOptionImageChange={handleOptionImageChange}
          handleDeleteOption={handleDeleteOption}
          handleAddOption={handleAddOption}
          setNewQuestions={setNewQuestions}
          handleDeleteKeyword={handleDeleteKeyword}
          handleKeywordKeyDown={handleKeywordKeyDown}
          handleAnswerKeyChange={handleAnswerKeyChange}
          bulkRangeConfig={bulkRangeConfig}
          handleBulkRangeChange={handleBulkRangeChange}
          handleApplyBulkRange={handleApplyBulkRange}
        />

        <div className=" flex items-center max-w-96">
          <button
            onClick={handleAddQuestion}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-stone-400 text-stone-700 hover:border-indigo-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <TbBuildingPlus className="w-4 h-4" />
            <span className="text-sm font-medium"> Add Another Question</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          className=" bg-indigo-400 text-stone-50 font-medium py-[10px] px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          {examId && allExams.find((exam) => exam._id === examId)
            ? "Update Exam"
            : "Create Exam"}
        </button>
      </div>
    </div>
  );
};

export default CreateExamAdminPage;
