import React from "react";
import { CalendarDays, Clock, Infinity as InfinityIcon } from "lucide-react";
import {
  QUICK_DAY_OPTIONS,
  availabilityPreview,
  todayIstYmd,
} from "../../../utils/classAvailability";

const MODES = [
  { value: "days", label: "Number of days", Icon: Clock },
  { value: "date", label: "Until a date", Icon: CalendarDays },
  { value: "never", label: "Never expires", Icon: InfinityIcon },
];

// "How long can students watch this class?" — used on Add/Edit Recording,
// Go Live and Edit Live Class. Three choices: N days counted from the class
// date (with 7/10/14/30 quick buttons), until a picked date, or never.
// A preview line underneath shows the exact last day before saving.
//
// Props:
//   value      { mode: "days"|"date"|"never", days: string, date: "YYYY-MM-DD" }
//   onChange   (nextValue) => void
//   classDate  "YYYY-MM-DD" the day count starts from (default: today)
//   title      heading text
//   disabled
//   showDaysPreview  false when one "N days" applies to several classes
//                    with different dates (bulk edit) — no single end date
const AvailabilityPicker = ({
  value,
  onChange,
  classDate,
  title = "Available to students",
  disabled = false,
  showDaysPreview = true,
}) => {
  const preview =
    value.mode === "days" && !showDaysPreview
      ? { text: "Each class stays available for this many days after its own class date.", expired: false }
      : availabilityPreview(value, classDate);
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3 border border-stone-200 rounded-2xl p-3 bg-stone-50">
      <label className="text-sm text-stone-600 font-semibold">{title}</label>

      <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
        {MODES.map(({ value: mode, label, Icon }) => {
          const selected = value.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() =>
                set(
                  mode === "date" && !value.date
                    ? { mode, date: todayIstYmd() }
                    : { mode }
                )
              }
              className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium py-2 px-2 rounded-xl border duration-150 disabled:opacity-50 ${
                selected
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-white border-stone-300 text-stone-600 hover:border-indigo-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {value.mode === "days" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_DAY_OPTIONS.map((d) => {
              const selected = String(d) === String(value.days);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={disabled}
                  onClick={() => set({ days: String(d) })}
                  className={`py-1 px-3 rounded-full text-sm font-medium border duration-150 disabled:opacity-50 ${
                    selected
                      ? "bg-indigo-100 border-indigo-400 text-indigo-700"
                      : "bg-white border-stone-300 text-stone-600 hover:border-indigo-300"
                  }`}
                >
                  {d} days
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="3650"
              step="1"
              inputMode="numeric"
              aria-label="Number of days"
              className="border border-stone-300 py-2 px-3 focus:outline-stone-300 rounded-xl bg-white w-24"
              value={value.days}
              onChange={(e) => set({ days: e.target.value })}
              disabled={disabled}
            />
            <span className="text-sm text-stone-500">days from the class date</span>
          </div>
        </div>
      )}

      {value.mode === "date" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">Until</span>
          <input
            type="date"
            aria-label="Available until date"
            min={todayIstYmd()}
            className="border border-stone-300 py-2 px-3 focus:outline-stone-300 rounded-xl bg-white"
            value={value.date}
            onChange={(e) => set({ date: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}

      {preview.text && (
        <p
          className={`text-xs font-medium ${
            preview.expired ? "text-amber-600" : "text-emerald-700"
          }`}
        >
          {preview.text}
        </p>
      )}
      <p className="text-[11px] text-gray-400">
        After this, the class drops off students' list on its own. Nothing
        changes on YouTube, and you can still see and edit it here.
      </p>
    </div>
  );
};

export default AvailabilityPicker;
