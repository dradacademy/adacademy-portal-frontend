import axios from "axios";
import { useEffect, useMemo } from "react";
import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import {
  FaBook,
  FaChartBar,
  FaChartLine,
  FaGraduationCap,
  FaStar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import { EXAM_CATEGORY_OPTIONS } from "../../../constants/examCategories";
import TopicPerformanceOverview from "./TopicPerformanceOverview";

const ExamOverviewDashboard = ({ onExamClick }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Admin's category-organized workflow — view one exam category's exams
  // at a time (GATE / TNPSC AE / TNPSC JDO / SSC JE-RRB JE) or "All".
  const [activeCategory, setActiveCategory] = useState("all");

  // Subject-wise / Exam-wise quick-search filters for the "All
  // Examinations" grid below — MUI Autocomplete gives free type-to-search
  // filtering out of the box, no new dependency needed. Values are
  // {label, value} option objects, or null for "All".
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [examFilter, setExamFilter] = useState(null);

  useEffect(() => {
    fetchOverviewData();
    // A category switch reloads a different set of exams entirely, so any
    // subject/exam filter picked under the previous category no longer
    // applies — reset both rather than silently filtering to nothing.
    setSubjectFilter(null);
    setExamFilter(null);
  }, [activeCategory]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/exams/overview`,
        {
          params:
            activeCategory !== "all" ? { category: activeCategory } : {},
        }
      );
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch exam data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <p className="text-red-600 font-poppins">{error}</p>
          <button
            onClick={fetchOverviewData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { exams, statistics } = data;

  return (
    <ExamOverviewDashboardBody
      exams={exams}
      statistics={statistics}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      subjectFilter={subjectFilter}
      setSubjectFilter={setSubjectFilter}
      examFilter={examFilter}
      setExamFilter={setExamFilter}
      onExamClick={onExamClick}
    />
  );
};

// Split out so the subject/exam filter options (useMemo, derived from
// `exams`) only ever compute once real data exists — avoids a `data` null
// guard inside every memo above the early loading/error returns.
const ExamOverviewDashboardBody = ({
  exams,
  statistics,
  activeCategory,
  setActiveCategory,
  subjectFilter,
  setSubjectFilter,
  examFilter,
  setExamFilter,
  onExamClick,
}) => {
  // One option per distinct subject name appearing in this category's exams.
  const subjectOptions = useMemo(() => {
    const seen = new Map();
    exams.forEach((exam) => {
      const name = exam.subject?.name;
      if (name && !seen.has(name)) seen.set(name, { label: name, value: name });
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [exams]);

  // Exam options narrow to the picked subject (if any), so the two
  // dropdowns work together rather than as two independent filters.
  const examOptions = useMemo(() => {
    return exams
      .filter((exam) => !subjectFilter || exam.subject?.name === subjectFilter.value)
      .map((exam) => ({
        label: `${exam.subject?.name || "Subject"}${
          exam.subTopic?.name ? ` - ${exam.subTopic.name}` : ""
        } - ${exam.examCode} (Order ${exam.order})`,
        value: exam._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [exams, subjectFilter]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (subjectFilter && exam.subject?.name !== subjectFilter.value) return false;
      if (examFilter && exam._id !== examFilter.value) return false;
      return true;
    });
  }, [exams, subjectFilter, examFilter]);

  return (
    <div className="min-h-screen font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-poppins">
            Exam Dashboard
          </h1>
          <p className="text-gray-600 text-base font-rubik">
            Overview of all examinations
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
              activeCategory === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
            }`}
          >
            All Categories
          </button>
          {EXAM_CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveCategory(opt.value)}
              className={`py-1.5 px-4 rounded-full text-sm font-medium cursor-pointer duration-300 ${
                activeCategory === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Statistics Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Total Submissions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalStudents}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <FaUsers className="text-blue-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-600">
              <FaChartLine className="mr-1" />
              <span>Across all exams</span>
            </div>
          </div>

          {/* Average Score Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.overallAvgScore.toFixed(1)}%
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-xl">
                <FaChartBar className="text-indigo-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-indigo-600">
              <FaStar className="mr-1" />
              <span>Overall performance</span>
            </div>
          </div>

          {/* Pass Rate Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Pass Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.overallPassRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <FaTrophy className="text-purple-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-purple-600">
              <FaGraduationCap className="mr-1" />
              <span>Success rate</span>
            </div>
          </div>

          {/* Total Exams Card */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Total Exams
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalExams}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <FaBook className="text-blue-600 text-lg" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-600">
              <FaBook className="mr-1" />
              <span>Active exams</span>
            </div>
          </div>
        </div>

        {/* Topic-wise Performance — who's leading/struggling per topic */}
        <TopicPerformanceOverview category={activeCategory} />

        {/* Exams Grid - Bento Style Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              All Examinations
            </h2>
            {/* Subject-wise / Exam-wise quick search — type to filter either
                dropdown's options instantly (Autocomplete's built-in
                behavior); picking a subject also narrows the exam options
                to that subject. */}
            <div className="flex items-center gap-3 flex-wrap">
              <Autocomplete
                size="small"
                options={subjectOptions}
                value={subjectFilter}
                onChange={(_, newValue) => {
                  setSubjectFilter(newValue);
                  setExamFilter(null);
                }}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                sx={{ width: 220 }}
                renderInput={(params) => (
                  <TextField {...params} label="Subject-wise" placeholder="Search subject..." />
                )}
              />
              <Autocomplete
                size="small"
                options={examOptions}
                value={examFilter}
                onChange={(_, newValue) => setExamFilter(newValue)}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                sx={{ width: 280 }}
                renderInput={(params) => (
                  <TextField {...params} label="Exam-wise" placeholder="Search exam..." />
                )}
              />
            </div>
          </div>
          {filteredExams.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">
              No exams match the selected filter.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                onClick={() => onExamClick(exam)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-indigo-300 group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full">
                      Order {exam.order}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        exam.status === "active"
                          ? "bg-emerald-400/90 text-emerald-950"
                          : "bg-white/30 text-white"
                      }`}
                    >
                      {exam.status === "active" ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-poppins">
                    {exam.examCode}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    <span className=" font-semibold">Subject:</span>{" "}
                    {exam.subject.name}
                  </p>
                  {exam.subTopic && (
                    <p className="text-blue-200 text-sm mt-1">
                      <span className=" font-semibold">Subtopic:</span>{" "}
                      {exam.subTopic.name}
                    </p>
                  )}
                  {exam.subject?.category && (
                    <p className="text-blue-200 text-xs mt-1">
                      <span className=" font-semibold">Category:</span>{" "}
                      {
                        EXAM_CATEGORY_OPTIONS.find(
                          (opt) => opt.value === exam.subject.category
                        )?.label
                      }
                    </p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Submissions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {exam.totalSubmissions}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Avg Score</p>
                      <p className="text-lg font-bold text-gray-900">
                        {exam.avgScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Pass Rate</p>
                      <p className="text-base font-bold text-green-600">
                        {exam.passRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Range</p>
                      <p className="text-xs font-semibold text-gray-700">
                        {exam.lowestMark} - {exam.highestMark}
                      </p>
                    </div>
                  </div>

                  {/* Completed / In-progress / Qualified / Not-qualified —
                      item D's per-exam status breakdown */}
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-gray-800">
                        {exam.completedCount}
                      </p>
                      <p className="text-[10px] text-gray-500">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-amber-700">
                        {exam.inProgressCount}
                      </p>
                      <p className="text-[10px] text-amber-600">In Progress</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-emerald-700">
                        {exam.qualifiedCount}
                      </p>
                      <p className="text-[10px] text-emerald-600">Qualified</p>
                    </div>
                    <div className="bg-red-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-red-700">
                        {exam.notQualifiedCount}
                      </p>
                      <p className="text-[10px] text-red-600">Not Qualified</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {/* <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          Performance
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-indigo-100">
                      <div
                        style={{ width: `${exam.avgScore}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                      ></div>
                    </div>
                  </div> */}

                  <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 group-hover:shadow-lg cursor-pointer">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamOverviewDashboard;
