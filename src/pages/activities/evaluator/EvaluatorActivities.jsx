import React, { useCallback, useContext, useEffect, useState } from "react";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import {
  BiAward,
  BiBarChart,
  BiBook,
  BiCheckCircle,
  BiCode,
  BiRightArrowAlt,
  BiTimeFive,
  BiTrophy,
  BiUser,
} from "react-icons/bi";
import { Link, Route, Routes } from "react-router-dom";
import { Dialog, LinearProgress } from "@mui/material";
import { MdClose, MdEmail, MdLockClock } from "react-icons/md";
import StatsActivity from "../../../components/activities/common/StatsActivity";
import TabSearchActivitySearchComponent from "../../../components/activities/common/TabSearchActivitySearchComponent";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileText,
  Layers,
  Mail,
  Tag,
  User,
} from "lucide-react";
import PreviousAttemptComponent from "../../../components/activities/common/PreviousAttemptComponent";
import CompletedExam from "../../../components/activities/common/CompletedExam";
import ExamDataEmptyComponent from "../../../components/activities/common/ExamDataEmptyComponent";
import { MarkContext } from "../../../context/MarkContext";
import { calculateTotalPossibleMarks } from "../../../utils/examMarks";

const capitalize = (str) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const EvaluatorActivities = () => {
  const { markData } = useContext(MarkContext);
  const [activeTab, setActiveTab] = useState("Previous Attempt");
  const [allCompletedExams, setAllCompletedExams] = useState([]);
  const [allPreviousAttemptsData, setAllPreviousAttemptsData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [levels, setLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    subjects: [],
    topics: [],
    levels: [],
    percentageRange: [0, 100],
  });

  useEffect(() => {
    const fetchPreviousAttemptForUser = async () => {
      try {
        const { data } = await axios.get(
          `${
            import.meta.env.VITE_APP_API_URL
          }/exam-submission/previous-attempt/get`
        );
        setAllPreviousAttemptsData(data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
      }
    };

    const fetchCompletedExamForUser = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/exam-submission/completed/get`
        );
        setAllCompletedExams(data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
      }
    };

    fetchPreviousAttemptForUser();
    fetchCompletedExamForUser();
  }, []);

  useEffect(() => {
    const allExams = [
      ...allPreviousAttemptsData.map((e) => ({
        subjectName: e.examId?.subject?.name,
        subTopicName: e.examId?.subTopicName,
        order: e.examId?.order,
      })),
      ...allCompletedExams.map((e) => ({
        subjectName: e.examId?.subject?.name,
        subTopicName: e.examId?.subTopicName,
        order: e.examId?.order,
      })),
    ];
    const uniqueUsers = [
      ...new Set(
        [...allPreviousAttemptsData, ...allCompletedExams].map(
          (exam) => exam.userId
        )
      ),
    ].map((userId) => {
      const exam = [...allPreviousAttemptsData, ...allCompletedExams].find(
        (e) => e.userId === userId
      );
      return {
        id: userId,
        username: userId.username,
        email: userId.email,
      };
    });

    setSubjects([...new Set(allExams.map((exam) => exam.subjectName))]);
    setTopics([...new Set(allExams.map((exam) => exam.subTopicName))]);
    setLevels(
      [...new Set(allExams.map((exam) => exam.order))].sort((a, b) => a - b)
    );
    setUsers(uniqueUsers);
  }, [allPreviousAttemptsData, allCompletedExams]);

  // Total possible marks for an exam submission, summed per-question
  // (falls back to the level-based config) — mirrors the backend resolver
  // now that an exam no longer carries one uniform level/mark.
  const totalPossibleMarksForExam = (exam) =>
    calculateTotalPossibleMarks(exam?.questions || [], markData);

  const toggleFilter = (type, value) => {
    setFilters((prev) => {
      const current = [...prev[type]];
      if (current.includes(value)) {
        return { ...prev, [type]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      subjects: [],
      topics: [],
      levels: [],
      percentageRange: [0, 100],
    });
    setSearchTerm("");
  };

  const filterExams = (exams) => {
    let filtered = [...exams];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((exam) => {
        const subjectName = exam.examId?.subject?.name || "";
        const subTopicName = exam.examId?.subTopicName || "";
        const examCode = exam.examId?.examCode || "";
        const username = exam.user?.username || "";
        const email = exam.user?.email || "";

        return (
          subjectName.toLowerCase().includes(term) ||
          subTopicName.toLowerCase().includes(term) ||
          examCode.toLowerCase().includes(term) ||
          username.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term)
        );
      });
    }

    if (filters.subjects.length > 0) {
      filtered = filtered.filter((exam) => {
        const subjectName = exam.examId?.subject?.name || "";
        return filters.subjects.includes(subjectName);
      });
    }

    if (filters.topics.length > 0) {
      filtered = filtered.filter((exam) => {
        const topicName = exam.examId?.subTopicName || "";
        return filters.topics.includes(topicName);
      });
    }

    if (filters.levels.length > 0) {
      filtered = filtered.filter((exam) => {
        const order = exam.examId?.order || 0;
        return filters.levels.includes(order);
      });
    }

    if (filters.percentageRange && filters.percentageRange.length === 2) {
      filtered = filtered.filter((exam) => {
        const totalPossibleMarks = totalPossibleMarksForExam(exam.examId);
        const scorePercentage = totalPossibleMarks
          ? Math.round((exam.obtainedMark / totalPossibleMarks) * 100)
          : 0;
        return (
          scorePercentage >= filters.percentageRange[0] &&
          scorePercentage <= filters.percentageRange[1]
        );
      });
    }

    return filtered;
  };

  const getFilteredExams = () => {
    switch (activeTab) {
      case "Previous Attempt":
        return filterExams(allPreviousAttemptsData);
      case "Completed":
        return filterExams(allCompletedExams);
      default:
        return [];
    }
  };

  const filteredExams = getFilteredExams();
  const activeFiltersCount =
    filters.subjects.length +
    filters.topics.length +
    filters.levels.length +
    (filters.percentageRange[0] > 0 || filters.percentageRange[1] < 100
      ? 1
      : 0);

  return (
    <div className=" p-2 sm:p-5">
      <Navbar />
      <main className="container mx-auto px-4 py-8 w-full">
        <StatsActivity
          currentUsertype={"evaluator"}
          examData={{
            previousAttempts: allPreviousAttemptsData,
            completed: allCompletedExams,
          }}
          studentsLength={users}
        />
        <TabSearchActivitySearchComponent
          currentUsertype={"evaluator"}
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
          subjects={subjects}
          topics={topics}
          levels={levels}
        />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {filteredExams.length === 0 ? (
            <ExamDataEmptyComponent />
          ) : activeTab === "Previous Attempt" ? (
            filteredExams.map((exam, index) => (
              <PreviousAttemptComponent
                key={index}
                currentUsertype={"evaluator"}
                index={index}
                exam={exam}
                totalPossibleMarks={totalPossibleMarksForExam(exam.examId)}
                formatDate={formatDate}
              />
            ))
          ) : (
            filteredExams.map((exam, index) => (
              <CompletedExam
                key={index}
                currentUsertype={"evaluator"}
                index={index}
                exam={exam}
                totalPossibleMarks={totalPossibleMarksForExam(exam.examId)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default EvaluatorActivities;
