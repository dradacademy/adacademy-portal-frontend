import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Digit/decimal/sign grid, top to bottom — matches the on-screen keypad
// students already expect from GATE-style computer-based test portals.
const DIGIT_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", ".", "-"],
];

// On-screen numeric keypad for a "Fill in the Blanks" question flagged
// isNumericAnswer (GATE-style Numerical Answer Type / NAT questions — see
// questionModel.js). The answer box is deliberately read-only: entry only
// happens through these buttons, same as the real CBT/GATE portal this is
// modeled on, so there's no dependence on a phone's own number-row layout
// (which usually buries "." and "-" behind a symbols switch) and no
// autocorrect/autofill surprises mid-exam. `readOnly` still allows the
// student to tap inside the box to reposition the caret, and the ← / →
// buttons move it one character at a time for keyboard-free editing.
const NumericKeypad = ({ value, onChange }) => {
  const inputRef = useRef(null);

  const currentSelection = () => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    return { start, end };
  };

  // Re-focus and restore the caret on the next frame — setting `value` via
  // onChange re-renders the (React-controlled) input first, which would
  // otherwise reset the caret to the end.
  const placeCaretSoon = (pos) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const insertAtCaret = (char) => {
    const { start, end } = currentSelection();
    onChange(value.slice(0, start) + char + value.slice(end));
    placeCaretSoon(start + char.length);
  };

  const backspace = () => {
    const { start, end } = currentSelection();
    if (start !== end) {
      onChange(value.slice(0, start) + value.slice(end));
      placeCaretSoon(start);
      return;
    }
    if (start === 0) return;
    onChange(value.slice(0, start - 1) + value.slice(start));
    placeCaretSoon(start - 1);
  };

  const moveCaret = (delta) => {
    const { start } = currentSelection();
    placeCaretSoon(Math.max(0, Math.min(value.length, start + delta)));
  };

  const clearAll = () => {
    onChange("");
    placeCaretSoon(0);
  };

  const keyClass =
    "h-11 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold text-base flex items-center justify-center transition-colors select-none cursor-pointer";

  return (
    <div className="w-full max-w-[220px] flex flex-col gap-2">
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        readOnly
        value={value}
        className="w-full border-2 border-orange-400 rounded-md px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      <button type="button" onClick={backspace} className={keyClass}>
        Backspace
      </button>

      <div className="grid grid-cols-3 gap-2">
        {DIGIT_ROWS.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => insertAtCaret(key)}
            className={keyClass}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => moveCaret(-1)}
          aria-label="Move cursor left"
          className={keyClass}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => moveCaret(1)}
          aria-label="Move cursor right"
          className={keyClass}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <button type="button" onClick={clearAll} className={keyClass}>
        Clear All
      </button>
    </div>
  );
};

export default NumericKeypad;
