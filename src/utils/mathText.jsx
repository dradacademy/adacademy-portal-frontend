import React from "react";
import { InlineMath, BlockMath } from "react-katex";

// Defensive normalization: some sources (AI-assisted PDF extraction has done
// this even when told not to, and an admin might paste from Word/PDF too)
// produce literal Unicode math characters — ², ∂, ×, etc. — sometimes mixed
// with real LaTeX commands in the same expression (e.g. "\frac{∂²h}{∂ x²}").
// KaTeX can't parse a literal "²" or "∂" as part of an expression, and the
// whole thing then falls back to raw, unrendered source text. Folding these
// to their LaTeX equivalents before tokenizing fixes that at the source
// instead of just hiding the failure. Superscript/subscript digits map to
// unbraced "^2"/"_2" (not "^{2}") deliberately — that's still valid LaTeX,
// and avoids introducing a nested brace that the bare-token regex below
// (which does not handle nesting) would otherwise trip over.
const SUPERSCRIPT_DIGITS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const SUBSCRIPT_DIGITS = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
const UNICODE_MATH_SYMBOLS = {
  "×": "\\times ", "÷": "\\div ", "±": "\\pm ",
  "≤": "\\leq ", "≥": "\\geq ", "≠": "\\neq ",
  "∂": "\\partial ",
};
const UNICODE_MATH_CHARS_RE = /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉×÷±≤≥≠∂]/g;

function normalizeUnicodeMath(text) {
  if (!text || !UNICODE_MATH_CHARS_RE.test(text)) return text;
  return text.replace(UNICODE_MATH_CHARS_RE, (c) => {
    if (SUPERSCRIPT_DIGITS[c]) return `^${SUPERSCRIPT_DIGITS[c]}`;
    if (SUBSCRIPT_DIGITS[c]) return `_${SUBSCRIPT_DIGITS[c]}`;
    return UNICODE_MATH_SYMBOLS[c];
  });
}

// Primary convention: explicit LaTeX delimiters, \( ... \) for inline math
// and \[ ... \] for a standalone/display equation. This is unambiguous
// about exactly where a math expression starts and ends — the AI-assisted
// PDF import is instructed to always wrap complete math expressions this
// way (e.g. "\(\frac{d^{2}H}{dz^{2}} = 0\)"), so a compound expression like
// a fraction or an equation with several operators is captured as ONE
// token instead of being torn into fragments by a bare-token guess.
const DELIMITED_RE = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

// Fallback for older/manually-typed content that has no delimiters at all:
// matches a single self-contained bare math token —
//   - a LaTeX command, optionally with braced argument(s) and an attached
//     sub/superscript (\times, \frac{a}{b}, \alpha_{1})
//   - a bare variable/number with a sub/superscript (k_{1}, 10^{-6}, x^2)
// Anything else in the surrounding text is left as plain prose. This keeps
// simple cases like "x^{2}" typed directly into the admin form working
// without requiring delimiters, while the delimited form above is what
// keeps compound expressions from mixed AI-extracted prose intact.
const BARE_TOKEN_RE =
  /\\[a-zA-Z]+(?:\{[^{}]*\})*(?:[_^]\{[^{}]*\})*|[A-Za-z0-9]+(?:[_^](?:\{[^{}]*\}|[A-Za-z0-9]))+/g;

// A stray, unpaired \( \) \[ \] that DELIMITED_RE couldn't match into a
// complete pair — e.g. a closing delimiter dropped by truncated/malformed
// AI extraction, or a mismatched brace count inside the expression that
// breaks the non-greedy pair match. Without this, such a marker has no
// letter/digit after the backslash, so BARE_TOKEN_RE never touches it and
// it falls through to plain text, showing up to the reader as a literal
// "\(" or "\)". Stripping it here is a quiet degrade — same philosophy as
// renderMathFallback below — the reader sees prose text/loose symbols
// instead of raw delimiter noise; it never affects a text that had its
// delimiters matched correctly upstream in splitMathSegments.
const STRAY_DELIMITER_RE = /\\[()[\]]/g;

function splitBareTokens(text) {
  if (!text) return [];
  const cleaned = text.replace(STRAY_DELIMITER_RE, "");
  if (!/[\\^_]/.test(cleaned)) return cleaned ? [cleaned] : [];

  const segments = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(BARE_TOKEN_RE);
  while ((match = re.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      segments.push(cleaned.slice(lastIndex, match.index));
    }
    segments.push({ math: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < cleaned.length) {
    segments.push(cleaned.slice(lastIndex));
  }
  return segments;
}

/**
 * Splits text into an array of plain strings and { math, display } tokens.
 * Text with no LaTeX-looking content at all is returned as a single-item
 * array unchanged. Delimited \( \) / \[ \] spans are matched first (and are
 * trusted as complete expressions); any remaining undelimited text is run
 * through the bare-token fallback so legacy content keeps working.
 */
export function splitMathSegments(rawText) {
  if (!rawText) return [];
  const text = normalizeUnicodeMath(rawText);
  if (!/[\\^_]/.test(text)) return [text];
  if (!/\\\(|\\\[/.test(text)) return splitBareTokens(text);

  const segments = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(DELIMITED_RE);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...splitBareTokens(text.slice(lastIndex, match.index)));
    }
    if (match[1] !== undefined) {
      segments.push({ math: match[1], display: true });
    } else {
      segments.push({ math: match[2], display: false });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(...splitBareTokens(text.slice(lastIndex)));
  }
  return segments;
}

// If a math segment fails to parse (e.g. malformed LaTeX slipped through),
// fall back to showing its raw source as plain text instead of KaTeX's
// default red error styling — a quiet degrade beats a jarring red glitch.
const renderMathFallback = (math) => () => <span>{math}</span>;

/**
 * Renders text that mixes ordinary prose with inline KaTeX-flavored LaTeX
 * (the convention used throughout the app for question/option text, and by
 * the AI-assisted PDF import). Only the LaTeX-looking substrings are
 * rendered as actual math — everything else renders as plain text with
 * normal spacing. Falls back to plain text entirely when nothing in the
 * string looks like LaTeX.
 */
export const MathText = ({ text, className }) => {
  if (!text) return null;
  const segments = splitMathSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (typeof seg === "string") {
          return <React.Fragment key={i}>{seg}</React.Fragment>;
        }
        const Component = seg.display ? BlockMath : InlineMath;
        return (
          <Component
            key={i}
            math={seg.math}
            renderError={renderMathFallback(seg.math)}
          />
        );
      })}
    </span>
  );
};

export default MathText;
