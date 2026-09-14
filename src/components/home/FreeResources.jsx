import React from "react";
import { FileText, ClipboardList, ListChecks, NotebookPen, Video } from "lucide-react";

const RESOURCES = [
  { icon: FileText, title: "Study Material PDFs" },
  { icon: ClipboardList, title: "Previous-Year Question Papers" },
  { icon: ListChecks, title: "Sample Tests" },
  { icon: NotebookPen, title: "Preparation Tips & Notes" },
  { icon: Video, title: "Videos" },
];

const FreeResources = () => {
  return (
    <section id="resources" className="py-16 bg-cream rounded-xl">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <span className="text-gold text-xs font-semibold tracking-wide uppercase font-inter">
            Free Resources
          </span>
          <h2 className="font-newsreader text-3xl sm:text-4xl text-navy-dark mt-3 leading-snug">
            Free materials to support your preparation.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {RESOURCES.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-line p-6 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-lg bg-navy/[0.08] flex items-center justify-center flex-shrink-0">
                <Icon className="w-[22px] h-[22px] text-navy" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-dark font-inter">
                  {title}
                </h3>
                <p className="text-xs text-slate mt-0.5 font-inter">
                  Will be updated soon
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FreeResources;
