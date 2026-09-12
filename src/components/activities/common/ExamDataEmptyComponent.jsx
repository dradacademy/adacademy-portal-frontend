import { FileText } from "lucide-react";
import React from "react";

const ExamDataEmptyComponent = () => {
  return (
    <div className="col-span-12 bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        No Available Exams
      </h3>
      <p className="text-gray-600 mb-6">
        There are no exams available for you at the moment.
      </p>
      <button className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium transition-colors">
        Check Again Later
      </button>
    </div>
  );
};

export default ExamDataEmptyComponent;
