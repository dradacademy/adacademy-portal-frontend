import React from "react";

const LoadingExamDetails = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-green-100 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-green-100 rounded mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
};

export default LoadingExamDetails;
