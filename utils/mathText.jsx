import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
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

// answerKeyText is written by two different paths that don't agree on
// format: the admin's manual exam-builder field is a ReactQuill rich-text
// editor, which always saves real HTML (at minimum wrapped in <p>...</p>,
// often with <br>, bold, lists, etc.); the AI-assisted PDF import path
// (pdfImportController.js) instead saves a PLAIN string straight from the
// extraction model — ordinary prose with literal "\n" line breaks and
// \(...\)/\[...\] LaTeX delimiters, no HTML tags at all. Both are stored in
// the same field, so a renderer has to tell them apart: an HTML-authored
// value must still go through dangerouslySetInnerHTML (its formatting is
// real markup, and MathText would show the tags as literal text), while a
// plain extracted value needs to run through MathText (to actually render
// its LaTeX) with line breaks preserved (its "\n"s otherwise collapse under
// normal HTML whitespace rules, since it has none of its own markup to
// break lines for it). A rich-text editor's output always contains at
// least one tag, so "does this look like it has an HTML tag in it" is a
// reliable, cheap way to pick the right path without a stored format flag.
const HTML_TAG_RE = /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i;

// ---- Step line breaks for flattened explanations -------------------------
// An explanation that was pasted/saved with its line breaks collapsed reads as
// one wall of text: "1. Characteristic ... 2. Matrix ... 3. Extracting ...".
// This re-inserts a break before each "N." step marker, but ONLY when the
// markers form an unbroken 1, 2, 3 ... run and each follows the end of a
// sentence or a formula - so a stray "= 2. Then" can never split a line.
const STEP_MARKER_RE = /(^|>|\s)(\d{1,2})\.\s+(?=[A-Z])/g;
export function insertStepBreaks(text, breakToken) {
  if (!text) return text;
  const candidates = [];
  let m;
  const re = new RegExp(STEP_MARKER_RE);
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(0, m.index).replace(/\s+$/, "");
    const last = before.slice(-1);
    // Step 1 may open the text (or follow an opening tag); later steps must
    // follow . : ; ! ? ) ] } or a letter, i.e. the end of a sentence/formula.
    const endsStep = before === "" || /[.:;!?)\]>A-Za-z}]/.test(last);
    if (endsStep) {
      candidates.push({ index: m.index, lead: m[1], num: Number(m[2]), len: m[0].length });
    }
  }
  let expected = 1;
  const accepted = [];
  for (const c of candidates) {
    if (c.num === expected) {
      accepted.push(c);
      expected += 1;
    }
  }
  if (accepted.length < 2) return text;
  let out = "";
  let cursor = 0;
  accepted.forEach((c, i) => {
    out += text.slice(cursor, c.index);
    const keepLead = /\s/.test(c.lead) ? "" : c.lead; // drop the space we replace with a break, keep ">"
    out += i > 0 ? keepLead + breakToken : keepLead;
    out += text.slice(c.index + c.lead.length, c.index + c.len);
    cursor = c.index + c.len;
  });
  return out + text.slice(cursor);
}

// ---- Math inside rich-text (HTML) explanations ---------------------------
// The exam builder's rich-text editor always saves HTML, and an explanation
// that came from the AI import still has its math as literal \( ... \) text
// inside that HTML. dangerouslySetInnerHTML never runs KaTeX, so it showed up
// as raw source. This walks only the TEXT nodes of the HTML (so markup is never
// touched), swaps each \( \) / \[ \] span for rendered KaTeX, and leaves a
// span that fails to parse as its plain source.
const MATH_SPAN_RE = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

export function renderHtmlWithMath(html) {
  if (!html || typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.nodeValue || "";
    if (!/\\[([]/.test(text)) return;
    const frag = doc.createDocumentFragment();
    const re = new RegExp(MATH_SPAN_RE);
    let last = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) frag.appendChild(doc.createTextNode(text.slice(last, match.index)));
      const display = match[1] !== undefined;
      const source = normalizeUnicodeMath(match[1] !== undefined ? match[1] : match[2]);
      let rendered;
      try {
        rendered = katex.renderToString(source, { displayMode: display, throwOnError: true });
      } catch (_) {
        rendered = null;
      }
      if (rendered) {
        const holder = doc.createElement(display ? "div" : "span");
        holder.innerHTML = rendered;
        frag.appendChild(holder);
      } else {
        frag.appendChild(doc.createTextNode(source));
      }
      last = match.index + match[0].length;
    }
    if (last === 0) return;
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  return doc.body.innerHTML;
}

// Plain extracted text (from the AI import) -> the simple HTML paragraphs the
// rich-text editor expects, one paragraph per line, so line breaks survive
// being loaded into the editor. Already-HTML values are returned unchanged.
export function plainAnswerKeyToHtml(text) {
  if (!text || HTML_TAG_RE.test(text)) return text;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${esc(line)}</p>`)
    .join("");
}

/**
 * Renders a Question's answerKeyText field, whichever of the two authoring
 * paths above produced it. See the comment above for why this dual-path
 * check exists instead of always using one renderer.
 */
export const AnswerKeyText = ({ text, className }) => {
  const html = useMemo(() => {
    if (!text || !HTML_TAG_RE.test(text)) return null;
    // Only a single flattened block gets step breaks; real multi-paragraph
    // HTML already has its own structure.
    const blocks = (text.match(/<(p|div|li)[\s>]/gi) || []).length;
    const stepped = blocks <= 1 && !/<br\s*\/?>/i.test(text) ? insertStepBreaks(text, "<br>") : text;
    return renderHtmlWithMath(stepped);
  }, [text]);

  if (!text) return null;
  if (html !== null) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  const plain = /\n/.test(text) ? text : insertStepBreaks(text, "\n");
  return (
    <MathText
      text={plain}
      className={`${className || ""} whitespace-pre-line block`}
    />
  );
};

export default MathText;
