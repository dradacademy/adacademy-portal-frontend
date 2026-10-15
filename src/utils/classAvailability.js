// Frontend side of "how long students can watch a class". The backend
// (utils/classAvailability.js) is the source of truth; this file only builds
// the request payload and the live "Students can watch until ..." preview so
// the admin can check the date before saving. All dates are IST.

export const QUICK_DAY_OPTIONS = [7, 10, 14, 30];
export const DEFAULT_DAYS = 7;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date in IST as "YYYY-MM-DD" (for date inputs' min and defaults).
export const todayIstYmd = () =>
  new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

// Any date value -> its IST calendar date as "YYYY-MM-DD".
export const toIstYmd = (value) =>
  new Date(new Date(value).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const ymdToUtcNoon = (ymd) => {
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, 12);
};

const formatYmd = (ymd) => {
  const t = ymdToUtcNoon(ymd);
  if (t === null) return "";
  return new Date(t).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

// Short IST date for tables and student cards, e.g. "29 Oct 2026".
export const formatIstDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

// Whole days left until `value` (0 = expires today), or null.
export const daysLeft = (value) => {
  if (!value) return null;
  const end = toIstYmd(value);
  const today = todayIstYmd();
  return Math.round((ymdToUtcNoon(end) - ymdToUtcNoon(today)) / DAY_MS);
};

// The picker's own state shape.
export const defaultAvailability = () => ({
  mode: "days",
  days: String(DEFAULT_DAYS),
  date: "",
});

// Picker state from a saved recording / live class (API object).
export const availabilityFromRecord = (rec) => {
  if (!rec) return defaultAvailability();
  if (rec.availableUntil) {
    return { mode: "date", days: String(DEFAULT_DAYS), date: toIstYmd(rec.availableUntil) };
  }
  if (rec.visibilityWindowDays === null || rec.visibilityWindowDays === undefined) {
    return { mode: "never", days: String(DEFAULT_DAYS), date: "" };
  }
  return { mode: "days", days: String(rec.visibilityWindowDays), date: "" };
};

// Picker state -> request body fields. Returns { error } if incomplete.
export const availabilityToPayload = (value) => {
  if (value.mode === "never") return { availabilityMode: "never" };
  if (value.mode === "date") {
    if (!value.date) return { error: "Pick the date students can watch until." };
    if (value.date < todayIstYmd()) return { error: "The 'available until' date can't be in the past." };
    return { availabilityMode: "date", availableUntilDate: value.date };
  }
  const days = Number(value.days);
  if (value.days === "" || !Number.isFinite(days) || days < 0 || days > 3650 || !Number.isInteger(days)) {
    return { error: "Enter the number of days as a whole number (e.g. 7, 10, 14)." };
  }
  return { availabilityMode: "days", availabilityDays: days };
};

// "Students can watch until ..." preview. classDateYmd is the class date
// ("YYYY-MM-DD") that "N days" counts from.
export const availabilityPreview = (value, classDateYmd) => {
  if (value.mode === "never") return { text: "Students can watch this anytime — it never expires.", expired: false };
  let endYmd = null;
  if (value.mode === "date") {
    endYmd = value.date || null;
  } else {
    const days = Number(value.days);
    const base = ymdToUtcNoon(classDateYmd || todayIstYmd());
    if (value.days !== "" && Number.isFinite(days) && days >= 0 && base !== null) {
      endYmd = new Date(base + Math.round(days) * DAY_MS).toISOString().slice(0, 10);
    }
  }
  if (!endYmd) return { text: "", expired: false };
  const expired = endYmd < todayIstYmd();
  return {
    text: expired
      ? `This date has already passed (${formatYmd(endYmd)}) — students won't see it. Pick more days or a later date.`
      : `Students can watch until ${formatYmd(endYmd)}, 11:59 PM.`,
    expired,
  };
};
