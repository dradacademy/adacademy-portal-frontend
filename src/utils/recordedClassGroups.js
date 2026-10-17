// Shared helpers for browsing recorded classes as
//   Subject → Subtopic → classes by date
// on both the student Classes page and the admin Recorded Classes page.
// Each recording carries `subject: {_id, name} | null` and
// `subtopic: {_id, name} | null` from the backend.

export const NO_SUBJECT = "__none__"; // "Other classes" (no subject yet)
export const NO_SUBTOPIC = "__general__"; // inside a subject, no subtopic yet

export const subjectKey = (rec) => (rec.subject?._id ? String(rec.subject._id) : NO_SUBJECT);
export const subtopicKey = (rec) => (rec.subtopic?._id ? String(rec.subtopic._id) : NO_SUBTOPIC);

const time = (rec) => (rec.recordedDate ? new Date(rec.recordedDate).getTime() : 0);

// Subjects present in `recordings`, A→Z, with counts; "Other classes"
// (no subject) last. → [{ key, name, count }]
export const listSubjects = (recordings) => {
  const map = new Map();
  recordings.forEach((rec) => {
    const key = subjectKey(rec);
    const entry = map.get(key) || {
      key,
      name: key === NO_SUBJECT ? "Other classes" : rec.subject.name,
      count: 0,
    };
    entry.count += 1;
    map.set(key, entry);
  });
  return [...map.values()].sort((a, b) => {
    if (a.key === NO_SUBJECT) return 1;
    if (b.key === NO_SUBJECT) return -1;
    return a.name.localeCompare(b.name);
  });
};

// Subtopics inside one subject's recordings, in course order (the order
// they were first taught, i.e. by their earliest class date); "General"
// (no subtopic) last. → [{ key, name, count }]
export const listSubtopics = (recordings) => {
  const map = new Map();
  recordings.forEach((rec) => {
    const key = subtopicKey(rec);
    const entry = map.get(key) || {
      key,
      name: key === NO_SUBTOPIC ? "General" : rec.subtopic.name,
      count: 0,
      first: Infinity,
    };
    entry.count += 1;
    entry.first = Math.min(entry.first, time(rec));
    map.set(key, entry);
  });
  return [...map.values()]
    .sort((a, b) => {
      if (a.key === NO_SUBTOPIC) return 1;
      if (b.key === NO_SUBTOPIC) return -1;
      return a.first - b.first || a.name.localeCompare(b.name);
    })
    .map(({ key, name, count }) => ({ key, name, count }));
};

export const sortByDate = (recordings, dir = "asc") =>
  [...recordings].sort((a, b) => (dir === "asc" ? time(a) - time(b) : time(b) - time(a)));

// Full nested grouping:
// [{ key, name, count, subtopics: [{ key, name, count, videos: [...] }] }]
export const groupRecordings = (recordings, dir = "asc") =>
  listSubjects(recordings).map((subject) => {
    const inSubject = recordings.filter((rec) => subjectKey(rec) === subject.key);
    return {
      ...subject,
      subtopics: listSubtopics(inSubject).map((topic) => ({
        ...topic,
        videos: sortByDate(
          inSubject.filter((rec) => subtopicKey(rec) === topic.key),
          dir
        ),
      })),
    };
  });

// ---------- Auto-suggest grouping for existing recordings ----------

const normalize = (text) =>
  ` ${String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

// Whole-word(s) match, so "Loads" doesn't match inside "Downloads".
const mentions = (haystack, name) => {
  const needle = normalize(name).trim();
  return needle.length >= 3 && haystack.includes(` ${needle} `);
};

// For recordings missing a subject or subtopic, look for a subject /
// subtopic name in the title + description (same exam category only).
// Returns only recordings where something new was found:
// [{ rec, subject: {_id,name}, subtopic: {_id,name} | null }]
export const suggestGroupings = (recordings, subjects) =>
  recordings
    .filter((rec) => !rec.subtopic)
    .map((rec) => {
      const text = normalize(`${rec.title} ${rec.description || ""}`);
      const candidates = subjects.filter(
        (s) =>
          s.category === rec.category &&
          (!rec.subject?._id || String(s._id) === String(rec.subject._id))
      );

      // Best subtopic = the longest subtopic name mentioned (most specific).
      let best = null;
      candidates.forEach((s) =>
        (s.subtopics || []).forEach((t) => {
          if (mentions(text, t.name) && (!best || t.name.length > best.subtopic.name.length)) {
            best = { subject: { _id: s._id, name: s.name }, subtopic: { _id: t._id, name: t.name } };
          }
        })
      );
      if (best) return { rec, ...best };

      if (!rec.subject?._id) {
        const subject = candidates
          .filter((s) => mentions(text, s.name))
          .sort((a, b) => b.name.length - a.name.length)[0];
        if (subject) return { rec, subject: { _id: subject._id, name: subject.name }, subtopic: null };
      }
      return null;
    })
    .filter(Boolean);
