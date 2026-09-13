// Mirrors backend/exam-portal-backend-main/constants/examCategories.js
// These four keys are the canonical exam-category isolation boundary:
// a student belongs to exactly one category, and can only ever see
// subjects/exams within it. Admin/evaluator views use this list to
// build category selectors and filters.

export const EXAM_CATEGORIES = ["gate", "tnpsc-ae", "tnpsc-jdo", "ssc-rrb-je"];

export const EXAM_CATEGORY_LABELS = {
  gate: "GATE Civil",
  "tnpsc-ae": "TNPSC AE Civil",
  "tnpsc-jdo": "TNPSC JDO Civil",
  "ssc-rrb-je": "SSC JE & RRB JE Civil",
};

export const EXAM_CATEGORY_OPTIONS = EXAM_CATEGORIES.map((value) => ({
  label: EXAM_CATEGORY_LABELS[value],
  value,
}));

export const getCategoryLabel = (value) =>
  EXAM_CATEGORY_LABELS[value] || value || "Uncategorized";
