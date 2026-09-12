import React from "react";
import { ChevronRight, Clock } from "lucide-react";

const AvailableSubjectHome = () => {
  return (
    <section id="subjects" className="py-16 bg-white rounded-xl">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 font-poppins">
            Available Assessments
          </h2>
          <p className="text-gray-600 font-inter">
            Explore the exams available to you and track your progress.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { name: "Science Assessment", subtopics: 45, progress: 75 },
              {
                name: "Mathematics Assessment",
                subtopics: 38,
                progress: 60,
              },
              { name: "Chemistry Assessment", subtopics: 32, progress: 45 },
              {
                name: "Computer Science Assessment",
                subtopics: 28,
                progress: 30,
              },
              { name: "English Assessment", subtopics: 22, progress: 15 },
              { name: "Physics Assessment", subtopics: 18, progress: 0 },
            ].map((assessment, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
              >
                <div className="p-6 font-inter">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {assessment.subtopics} Subtopics
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-gray-900 transition-colors">
                    {assessment.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>60 minutes</span>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-stone-200 flex justify-between items-center font-poppins">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                    <h2>View</h2> <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AvailableSubjectHome;
