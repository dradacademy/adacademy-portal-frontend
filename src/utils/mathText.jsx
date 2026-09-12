import React from "react";
import { InlineMath } from "react-katex";

// Matches a single self-contained math token:
//   - a LaTeX command, optionally with braced argument(s) and an attached
//     sub/superscript (\times, \frac{a}{b}, \alpha_{1})
//   - a bare variable/number with a sub/superscript (k_{1}, 10^{-6}, x^2)
// Anything else in the surrounding text is left as plain prose. This is
// what makes mixed content like "k_{1} = 1 \times 10^{-6} m/s" render
// correctly instead of forcing the entire sentence into KaTeX math mode
// (which mangles spacing and italicizes every ordinary English word).
const MATH_TOKEN_RE =
  /\\[a-zA-Z]+(?:\{[^{}]*\})*(?:[_^]\{[^{}]*\})*|[A-Za-z0-9]+(?:[_^](?:\{[^{}]*\}|[A-Za-z0-9]))+/g;

/**
 * Splits text into an array of plain strings and { math: string } tokens.
 * Text with no LaTeX-looking content at all is returned as a single-item
 * array unchanged.
 */
export function splitMathSegments(text) {
  if (!text) return [];
  if (!/[\\^_]/.test(text)) return [text];

  const segments = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(MATH_TOKEN_RE);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    segments.push({ math: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }
  return segments;
}

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
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <React.Fragment key={i}>{seg}</React.Fragment>
        ) : (
          <InlineMath key={i} math={seg.math} />
        ),
      )}
    </span>
  );
};

export default MathText;
