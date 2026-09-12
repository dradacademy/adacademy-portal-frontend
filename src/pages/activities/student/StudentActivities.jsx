import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import AttendExamconfirmPopup from "../../../components/common/popup/AttendExamconfirmPopup";
import AvailableExamComponent from "../../../components/activities/student/AvailableExamComponent";
import PreviousAttemptComponent from "../../../components/activities/common/PreviousAttemptComponent";
import CompletedExam from "../../../components/activities/common/CompletedExam";
import TabSearchActivitySearchComponent from "../../../components/activities/common/TabSearchActivitySearchComponent";
import { FileText } from "lucide-react";
import StatsActivity from "../../../components/activities/common/StatsActivity";
import ExamDataEmptyComponent from "../../../components/activities/common/ExamDataEmptyComponent";
import { MarkContext } from "../../../context/MarkContext";

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const capitalize = (str) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const StudentActivities = () => {
  const { userData } = useContext(AuthContext);
  const { markData } = useContext(MarkContext);
  const [activeTab, setActiveTab] = useState("Available");
  const [examData, setExamData] = useState({
    eligible: [],
    previousAttempts: [],
    completed: [],
  });
  const [openExamPopup, setOpenExamPopup] = useState(false);
  const [popupExamDetails, setPopupExamDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    subjects: [],
    topics: [],
    levels: [],
    percentageRange: [0, 100],
  });

  const positiveMarkForLevel = (level) => {
    if (level === 1) {
      return markData.level1Mark;
    } else if (level === 2) {
      return markData.level2Mark;
    } else if (level === 3) {
      return markData.level3Mark;
    } else if (level === 4) {
      return markData.level4Mark;
    }
    return markData.level1Mark;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userData?._id) return;

      try {
        const baseUrl = import.meta.env.VITE_APP_API_URL;

        const [eligibleResponse, previousAttemptsResponse, completedResponse] =
          await Promise.all([
            axios.get(`${baseUrl}/exam-function/eligible-exam/${userData._id}`),
            axios.get(
              `${baseUrl}/exam-submission/previous-attempt/${userData._id}`
            ),
            axios.get(`${baseUrl}/exam-submission/completed/${userData._id}`),
          ]);

        setExamData({
          eligible: eligibleResponse.data || [],
          previousAttempts: previousAttemptsResponse.data || [],
          completed: completedResponse.data || [],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
      }
    };

    fetchAllData();
  }, [userData]);

  const { uniqueSubjects, uniqueTopics, uniqueLevels } = useMemo(() => {
    const allExams = [
      ...examData.eligible,
      ...examData.previousAttempts.map((e) => ({
        subjectName: e.examId.subject?.name,
        subTopicName: e.examId.subTopicName,
        level: e.examId.level,
      })),
      ...examData.completed.map((e) => ({
        subjectName: e.examId.subject?.name,
        subTopicName: e.examId.subTopicName,
        level: e.examId.level,
      })),
    ];

    return {
      uniqueSubjects: [...new Set(allExams.map((exam) => exam.subjectName))],
      uniqueTopics: [...new Set(allExams.map((exam) => exam.subTopicName))],
      uniqueLevels: [...new Set(allExams.map((exam) => exam.level))].sort(
        (a, b) => a - b
      ),
    };
  }, [examData]);

  const filteredExams = useMemo(() => {
    let exams = [];

    switch (activeTab) {
      case "Available":
        exams = examData.eligible;
        break;
      case "Previous Attempt":
        exams = examData.previousAttempts;
        break;
      case "Completed":
        exams = examData.completed;
        break;
      default:
        return [];
    }

    let filtered = [...exams];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((exam) => {
        const subjectName =
          exam.subjectName || exam.examId?.subject?.name || "";
        const subTopicName =
          exam.subTopicName || exam.examId?.subTopicName || "";
        const examCode = exam.examCode || exam.examId?.examCode || "";

        return (
          subjectName.toLowerCase().includes(term) ||
          subTopicName.toLowerCase().includes(term) ||
          examCode.toLowerCase().includes(term)
        );
      });
    }

    if (filters.subjects.length > 0) {
      filtered = filtered.filter((exam) => {
        const subjectName =
          exam.subjectName || exam.examId?.subject?.name || "";
        return filters.subjects.includes(subjectName);
      });
    }

    if (filters.topics.length > 0) {
      filtered = filtered.filter((exam) => {
        const topicName = exam.subTopicName || exam.examId?.subTopicName || "";
        return filters.topics.includes(topicName);
      });
    }

    if (filters.levels.length > 0) {
      filtered = filtered.filter((exam) => {
        const level = exam.level || exam.examId?.level || 0;
        return filters.levels.includes(level);
      });
    }

    if (activeTab != "Available") {
      if (filters.percentageRange && filters.percentageRange.length === 2) {
        filtered = filtered.filter((exam) => {
          const scorePercentage = Math.round(
            (exam.obtainedMark /
              (
                exam.examData?.length * positiveMarkForLevel(exam.examId?.level)
              ).toFixed(2)) *
              100
          );
          return (
            scorePercentage >= filters.percentageRange[0] &&
            scorePercentage <= filters.percentageRange[1]
          );
        });
      }
    }

    return filtered;
  }, [activeTab, examData, searchTerm, filters]);

  const stats = useMemo(() => {
    const { eligible, previousAttempts, completed } = examData;

    const unattendedExams = eligible.filter(
      (exam) =>
        !previousAttempts.some(
          (attempt) => attempt.examId.examCode === exam.examCode
        )
    ).length;

    const completionRate =
      completed.length > 0
        ? Math.round(
            (completed.length / (eligible.length + completed.length)) * 100
          )
        : 0;

    const successRate =
      completed.length > 0
        ? Math.round(
            (completed.length / (previousAttempts.length + completed.length)) *
              100
          )
        : 0;

    const achievementScore = ((completionRate + successRate) / 200) * 100;
    let achievementLevel = "Beginner";

    if (achievementScore >= 90) achievementLevel = "Excellent";
    else if (achievementScore >= 70) achievementLevel = "Advanced";
    else if (achievementScore >= 60) achievementLevel = "Proficient";
    else if (achievementScore >= 50) achievementLevel = "Intermediate";

    return {
      unattendedExams,
      completionRate,
      successRate,
      achievementLevel,
    };
  }, [examData]);

  const handleOpenExamDialog = useCallback((exam) => {
    setOpenExamPopup(true);
    setPopupExamDetails(exam);
  }, []);

  const handleCloseExamDialog = useCallback(() => {
    setOpenExamPopup(false);
  }, []);

  const toggleFilter = useCallback((type, value) => {
    setFilters((prev) => {
      const current = [...prev[type]];
      if (current.includes(value)) {
        return { ...prev, [type]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      subjects: [],
      topics: [],
      levels: [],
      percentageRange: [0, 100],
    });
    setSearchTerm("");
  }, []);

  const activeFiltersCount =
    filters.subjects.length +
    filters.topics.length +
    filters.levels.length +
    (filters.percentageRange[0] > 0 || filters.percentageRange[1] < 100
      ? 1
      : 0);

  return (
    <div className="p-5">
      <Navbar />
      <main className=" mx-auto px-4 py-8 w-full">
        <StatsActivity
          currentUsertype={"student"}
          examData={examData}
          stats={stats}
        />
        <TabSearchActivitySearchComponent
          currentUsertype={"student"}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
          toggleFilter={toggleFilter}
          capitalize={capitalize}
          subjects={uniqueSubjects}
          topics={uniqueTopics}
          levels={uniqueLevels}
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {filteredExams.length === 0 ? (
            <ExamDataEmptyComponent />
          ) : activeTab === "Available" ? (
            filteredExams.map((exam, index) => (
              <AvailableExamComponent
                key={index}
                index={index}
                exam={exam}
                handleOpenExamDialog={handleOpenExamDialog}
                formatDate={formatDate}
              />
            ))
          ) : activeTab === "Previous Attempt" ? (
            filteredExams.map((exam, index) => (
              <PreviousAttemptComponent
                key={index}
                currentUsertype={"student"}
                index={index}
                exam={exam}
                positiveMarkForLevel={positiveMarkForLevel}
                formatDate={formatDate}
              />
            ))
          ) : (
            filteredExams.map((exam, index) => (
              <CompletedExam
                key={index}
                currentUsertype={"student"}
                index={index}
                exam={exam}
                positiveMarkForLevel={positiveMarkForLevel}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </main>
      <AttendExamconfirmPopup
        openExamPopup={openExamPopup}
        handleCloseExamDialog={handleCloseExamDialog}
        examCode={popupExamDetails.examCode}
      />
    </div>
  );
};

export default StudentActivities;
