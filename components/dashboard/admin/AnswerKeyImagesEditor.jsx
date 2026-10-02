import React, { useMemo } from "react";
import { getAnswerKeyImageList } from "../../../utils/answerKeyImages";

const MAX_IMAGES = 20;

// Answer-key screenshots for ONE question in the exam builder. Add as many as
// the explanation needs: click the box and press Ctrl+V (paste again for the
// next one), choose several files at once, or drag them in. Order is the order
// students see; use the arrows to reorder. Entries are either an uploaded URL
// (string) or a freshly-picked File that is uploaded when the exam is saved.
const AnswerKeyImagesEditor = ({ question, onChange }) => {
  const list = getAnswerKeyImageList(question);

  // One preview URL per File entry (created once per distinct list, not on
  // every render).
  const previews = useMemo(
    () => list.map((img) => (typeof img === "string" ? img : URL.createObjectURL(img))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.map((img) => (typeof img === "string" ? img : `${img.name}-${img.size}-${img.lastModified}`)).join("|")],
  );
  const addFiles = (files) => {
    const images = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith("image/"));
    if (images.length === 0) return;
    onChange([...list, ...images].slice(0, MAX_IMAGES));
  };

  const handlePaste = (e) => {
    const pasted = Array.from(e.clipboardData?.items || [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item, i) => {
        const f = item.getAsFile();
        if (!f) return null;
        const ext = (item.type.split("/")[1] || "png").replace("jpeg", "jpg");
        return new File([f], `answer-key-${Date.now()}-${i}.${ext}`, { type: f.type });
      })
      .filter(Boolean);
    if (pasted.length === 0) return; // plain text paste — leave it alone
    e.preventDefault();
    addFiles(pasted);
  };

  const move = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(list.filter((_, i) => i !== index));

  return (
    <div className="mt-2">
      <label className="text-xs text-stone-500 mb-1 block">
        Answer Key Images — add as many screenshots as needed (shown to students in this order)
      </label>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer?.files);
        }}
        className="flex flex-col gap-1 border-2 border-dashed border-stone-300 rounded-xl p-1 bg-white focus:outline-none focus:border-indigo-400"
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="w-full py-1 px-3 font-medium text-center text-sm flex items-center justify-center cursor-pointer duration-300"
        />
        <span className="text-[10px] text-stone-400 text-center">
          or click here and paste (Ctrl+V) a screenshot — paste again to add the next one, or drag images in
        </span>
      </div>

      {list.length > 0 ? (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {list.map((img, index) => (
            <div key={`${previews[index]}-${index}`} className="relative border border-stone-200 rounded-lg overflow-hidden bg-white">
              <span className="absolute top-1 left-1 z-10 text-[11px] font-bold bg-indigo-600 text-white rounded px-1.5">
                {index + 1}
              </span>
              <img src={previews[index]} alt={`Answer key ${index + 1}`} className="h-24 w-full object-cover object-top" />
              <div className="flex items-center justify-between px-1 py-0.5 bg-stone-50 border-t border-stone-100 text-xs">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="px-1 text-stone-500 hover:text-indigo-700 disabled:opacity-30" title="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => remove(index)} className="px-1 text-stone-400 hover:text-[#FF8383]" title="Remove this image">
                  ✕
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === list.length - 1} className="px-1 text-stone-500 hover:text-indigo-700 disabled:opacity-30" title="Move later">
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-center text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-xl h-16">
          No Image
        </div>
      )}
    </div>
  );
};

export default AnswerKeyImagesEditor;
