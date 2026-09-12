import React, { useState } from "react";
import StudentsOverviewDashboard from "../../../../components/dashboard/student/StudentsOverviewDashboard";
import StudentDetailedDashboard from "../../../../components/dashboard/student/StudentDetailedDashboard";

const StudentDashboard = () => {
  const [view, setView] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setView("detail");
  };

  const handleBackClick = () => {
    setView("overview");
    setSelectedStudent(null);
  };

  if (view === "overview") {
    return <StudentsOverviewDashboard onStudentClick={handleStudentClick} />;
  }

  return (
    <StudentDetailedDashboard
      student={selectedStudent}
      onBack={handleBackClick}
    />
  );
};

export default StudentDashboard;
