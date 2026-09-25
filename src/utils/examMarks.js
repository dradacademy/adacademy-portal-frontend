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

// Mirrors the backend's parseNumericAnswer (utils/ExamSubmissionHelper.js)
// — accepts plain decimals, JS exponential notation, and the same
// power/scientific notation NAT answers support ("10^-7", "1.5 x 10^-7"),
// so a NAT range's stored bounds and a student's typed answer parse to the
// exact same number the backend graded with. Returns NaN for anything not
// recognizably numeric.
const PLAIN_NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const POWER_NOTATION_RE =
  /^(?:([+-]?(?:\d+\.?\d*|\.\d+))\s*[x×*]\s*)?([+-]?(?:\d+\.?\d*|\.\d+))\s*(?:\^|\*\*)\s*([+-]?(?:\d+\.?\d*|\.\d+))$/i;

export const parseNumericAnswer = (raw) => {
  if (raw === null || raw === undefined) return NaN;
  const str = String(raw).trim();
  if (str === "") return NaN;

  if (PLAIN_NUMBER_RE.test(str)) {
    return Number(str);
  }

  const powerMatch = str.replace(/\s+/g, " ").match(POWER_NOTATION_RE);
  if (powerMatch) {
    const [, coefficientRaw, baseRaw, exponentRaw] = powerMatch;
    const coefficient = coefficientRaw === undefined ? 1 : Number(coefficientRaw);
    const base = Number(baseRaw);
    const exponent = Number(exponentRaw);
    if (!Number.isNaN(coefficient) && !Number.isNaN(base) && !Number.isNaN(exponent)) {
      return coefficient * Math.pow(base, exponent);
    }
  }

  return NaN;
};

const NUMERIC_MATCH_EPSILON = 1e-9;

// Used by the exam-review pages (CompletedExamSubmissionDetail /
// AttemptedExamSubmissionDetail) to display the right per-question marks
// and correctness for a NAT question graded in "range" mode — those pages
// otherwise only know how to string-match against a fixed correctAnswers
// list, which is empty/stale for a range question and would silently show
// 0 marks even when the backend (isRight, obtainedMark) has it right.
export const isNumericAnswerInRange = (rangeMin, rangeMax, studentAnswer) => {
  const studentNum = parseNumericAnswer(studentAnswer);
  const minNum = parseNumericAnswer(rangeMin);
  const maxNum = parseNumericAnswer(rangeMax);
  if (Number.isNaN(studentNum) || Number.isNaN(minNum) || Number.isNaN(maxNum)) {
    return false;
  }
  const lo = Math.min(minNum, maxNum);
  const hi = Math.max(minNum, maxNum);
  return (
    studentNum >= lo - NUMERIC_MATCH_EPSILON && studentNum <= hi + NUMERIC_MATCH_EPSILON
  );
};
