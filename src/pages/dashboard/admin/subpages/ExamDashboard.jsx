import React, { useState } from "react";
import DetailedExamDashboard from "../../../../components/dashboard/admin/DetailedExamDashboard";
import ExamOverviewDashboard from "../../../../components/dashboard/admin/ExamOverviewDashboard";

const ExamDashboard = () => {
  const [view, setView] = useState("overview");
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setView("detail");
  };

  const handleBackClick = () => {
    setView("overview");
    setSelectedExam(null);
  };

  if (view === "overview") {
    return <ExamOverviewDashboard onExamClick={handleExamClick} />;
  }

  return <DetailedExamDashboard exam={selectedExam} onBack={handleBackClick} />;
};

export default ExamDashboard;
