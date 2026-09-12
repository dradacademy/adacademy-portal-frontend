// Mirrors the backend's per-question mark resolution
// (backend/exam-portal-backend-main/utils/ExamSubmissionHelper.js).
// An exam no longer carries one uniform level/mark — each question can
// override its own marks/negativeMark, falling back to the level-based
// mark config otherwise. Frontend displays must use the same resolution
// the backend used to grade, or percentages/totals will silently drift
// once any exam mixes levels or has per-question overrides.

export const getMarksByLevel = (markData, level) => ({
  positive: markData?.[`level${level}Mark`],
  negative: markData?.[`level${level}NegativeMark`],
});

export const resolveQuestionMarks = (question, markData) => {
  const fallback = getMarksByLevel(markData, question?.level);
  return {
    positive: question?.marks ?? fallback.positive ?? 0,
    negative: question?.negativeMark ?? fallback.negative ?? 0,
  };
};

export const calculateTotalPossibleMarks = (questions = [], markData) =>
  questions.reduce(
    (sum, q) => sum + (resolveQuestionMarks(q, markData).positive || 0),
    0,
  );
