// An answer key can carry several screenshots. `answerKeyImages` is the full
// ordered list; `answerKeyImage` is the legacy single field (it mirrors the
// first entry, and is the only one older questions have).
// In the exam builder an entry can also be a not-yet-uploaded File object.
export const getAnswerKeyImageList = (question) => {
  if (!question) return [];
  const list = Array.isArray(question.answerKeyImages)
    ? question.answerKeyImages.filter(Boolean)
    : [];
  if (list.length > 0) return list;
  return question.answerKeyImage ? [question.answerKeyImage] : [];
};

// Only already-uploaded (string URL) images — what students and the review
// pages show.
export const getAnswerKeyImageUrls = (question) =>
  getAnswerKeyImageList(question).filter((img) => typeof img === "string");
