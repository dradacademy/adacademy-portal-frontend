import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import {
  FaBook,
  FaChartBar,
  FaChartLine,
  FaGraduationCap,
  FaStar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";

const ExamOverviewDashboard = ({ onExamClick }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/exams/overview`
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

        {/* Exams Grid - Bento Style Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">
            All Examinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
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
                    <FaBook className="text-lg opacity-80" />
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
