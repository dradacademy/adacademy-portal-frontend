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

// ---- Automatic numeric tolerance (mirrors utils/ExamSubmissionHelper.js) ----
// A numeric answer with N decimal places is accepted within +-1 in its last
// decimal place (e.g. "3.00" accepts 2.99 to 3.01). A whole number must match
// exactly. Applies to numeric "Fill in the Blanks" and to a "Short Answer" whose
// single keyword is a number; an explicit custom range always wins.
const AUTO_TOLERANCE_DECIMAL_RE = /^[+-]?\d+\.(\d+)$/;

export const deriveAutoTolerance = (raw) => {
  if (raw === null || raw === undefined) return null;
  const match = String(raw).trim().match(AUTO_TOLERANCE_DECIMAL_RE);
  return match ? Math.pow(10, -match[1].length) : null;
};

// True when the stored correct answer(s) are all plain numbers - then the
// question is graded numerically even if the admin never ticked "Numeric answer".
export const isNumericAnswerKey = (answers) =>
  Array.isArray(answers) &&
  answers.length > 0 &&
  answers.every((a) => !Number.isNaN(parseNumericAnswer(a)));

export const isNumericAnswerCorrect = (question, studentAnswer) => {
  if (question?.natAnswerMode === "range") {
    return isNumericAnswerInRange(question.rangeMin, question.rangeMax, studentAnswer);
  }
  const studentNum = parseNumericAnswer(studentAnswer);
  if (Number.isNaN(studentNum)) return false;
  return (question?.correctAnswers || []).some((ans) => {
    const ansNum = parseNumericAnswer(ans);
    if (Number.isNaN(ansNum)) return false;
    const tolerance = deriveAutoTolerance(ans) ?? NUMERIC_MATCH_EPSILON;
    return Math.abs(ansNum - studentNum) <= tolerance + NUMERIC_MATCH_EPSILON;
  });
};

// null = "not a single-number Short Answer" (caller keeps keyword matching)
export const isShortAnswerNumericAutoMatch = (correctAnswers, studentAnswer) => {
  if (!Array.isArray(correctAnswers) || correctAnswers.length !== 1) return null;
  const correctNum = parseNumericAnswer(correctAnswers[0]);
  if (Number.isNaN(correctNum)) return null;
  const studentNum = parseNumericAnswer(studentAnswer);
  if (Number.isNaN(studentNum)) return null;
  const tolerance = deriveAutoTolerance(correctAnswers[0]) ?? NUMERIC_MATCH_EPSILON;
  return Math.abs(correctNum - studentNum) <= tolerance + NUMERIC_MATCH_EPSILON;
};

// Human-readable "what will be accepted" line for the admin screens, e.g.
// "Accepts 2.99 to 3.01 (±0.01)" or "Accepts 170 exactly (whole number)".
// Returns null when the answers are not all numbers.
export const describeNumericAcceptance = (answers) => {
  if (!isNumericAnswerKey(answers)) return null;
  const parts = answers.map((raw) => {
    const text = String(raw).trim();
    const tolerance = deriveAutoTolerance(text);
    if (tolerance === null) return `${text} exactly`;
    const decimals = text.match(AUTO_TOLERANCE_DECIMAL_RE)[1].length;
    const num = Number(text);
    return `${(num - tolerance).toFixed(decimals)} to ${(num + tolerance).toFixed(decimals)} (±${tolerance.toFixed(decimals)})`;
  });
  return `Accepts ${parts.join(" or ")}`;
};

// Should this question show the on-screen number pad? Yes when the exam-wide
// switch is on or the question is flagged isNumericAnswer. The server sets that
// flag automatically (checkExamEligibility -> prepareQuestionsForStudent) for
// every "Fill in the Blanks" whose correct answer is a number, because students
// are never sent the answer key - so the page itself can only rely on the flag.
// (The answer-key check below only helps screens that do have the key.) A blank
// that expects words keeps its text box: the pad can only type digits . - and x10^.
export const usesNumericKeypad = (question, exam) =>
  !!(
    exam?.allNumericAnswerKeypad ||
    question?.isNumericAnswer ||
    (question?.questionType === "Fill in the Blanks" &&
      isNumericAnswerKey(question?.correctAnswers))
  );
