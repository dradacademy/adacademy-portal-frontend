import React from "react";

const STATS = [
  { value: "1000+", label: "Students Mentored" },
  { value: "12+", label: "Years of Teaching" },
  { value: "Every Batch", label: "Consistent Success, Every Year" },
];

const TrackRecord = () => {
  return (
    <section
      id="achievements"
      className="bg-white border-b border-line py-10 rounded-xl"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-newsreader text-3xl sm:text-4xl font-semibold text-navy-dark">
                {stat.value}
              </div>
              <div className="text-sm text-slate mt-1 font-inter">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrackRecord;
