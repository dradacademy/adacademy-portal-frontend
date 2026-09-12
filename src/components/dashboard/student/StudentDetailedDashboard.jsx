import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaTrophy,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaStar,
  FaExclamationTriangle,
  FaAward,
  FaPercentage,
} from "react-icons/fa";
import { AlertTriangle } from "lucide-react";

const colorMap = {
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  gray: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

const Stat = ({ label, value, color }) => {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} ${c.border} rounded-lg p-3`}>
      <p className={`${c.text} text-sm font-medium`}>{label}</p>
      <p className={`${c.text} text-xl font-bold`}>{value}</p>
    </div>
  );
};

const StudentDetailedDashboard = ({ student, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student) {
      fetchDetailedData();
    }
  }, [student]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/students/${
          student._id
        }/analysis`,
      );
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch student details");
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
          <p className="mt-4 text-gray-600 font-inter">Loading analysis...</p>
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
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    basicDetails,
    overallPerformance,
    examGroupedBySubject,
    subjectChartData,
    attemptSummary,
    keyInsights,
  } = data;

  const attemptData = [
    {
      name: "Correct",
      value: attemptSummary.correct,
      percentage: attemptSummary.correctPercentage,
    },
    {
      name: "Partially Correct",
      value: attemptSummary.partialCorrect,
      percentage: attemptSummary.partialPercentage,
    },
    {
      name: "Wrong",
      value: attemptSummary.wrong,
      percentage: attemptSummary.wrongPercentage,
    },
    {
      name: "Skipped",
      value: attemptSummary.skipped,
      percentage: attemptSummary.skippedPercentage,
    },
  ];

  const COLORS = [
    "oklch(0.627 0.194 149.214)",
    "oklch(0.681 0.162 75.834)",
    "oklch(0.577 0.245 27.325)",
    "oklch(0.551 0.027 264.364)",
  ];

  return (
    <div className="min-h-screen font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 font-medium transition-colors cursor-pointer group"
          >
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">
              Student Dashboard
            </h1>
            <p className="text-gray-60 text-sm mt-1">
              Detailed Performance Analysis
            </p>
          </div>
        </div>

        {/* A. Basic Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              A. Basic Details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
              <FaUser className="text-blue-600 text-2xl mr-4" />
              <div>
                <p className="text-gray-600 text-sm mb-1">Student Name</p>
                <p className="text-lg font-bold text-gray-900">
                  {basicDetails.studentName}
                </p>
              </div>
            </div>
            <div className="flex items-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
              <FaIdCard className="text-indigo-600 text-2xl mr-4" />
              <div>
                <p className="text-gray-600 text-sm mb-1">Register Number</p>
                <p className="text-lg font-bold text-gray-900">
                  {basicDetails.registerNumber || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
              <FaEnvelope className="text-purple-600 text-2xl mr-4" />
              <div>
                <p className="text-gray-600 text-sm mb-1">Email</p>
                <p className="text-base font-semibold text-gray-900">
                  {basicDetails.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* B. Overall Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              B. Overall Performance
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 text-center">
              <FaPercentage className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-2">
                Percentage (Overall Average)
              </p>
              <p className="text-2xl font-bold text-green-700">
                {overallPerformance?.percentage?.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center">
              <FaTrophy className="text-purple-600 text-2xl mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-2">
                Rank (Overall Average)
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {overallPerformance.rank} / {overallPerformance.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              C. Exam-wise Performance Summary
            </h2>
          </div>

          <p className=" text-amber-600 italic text-sm font-medium">
            Note: In evaluation, Since partial mark is allowed, There can be
            slight differences in the calculated percentage.
          </p>
          <p className="text-gray-700 my-6 font-medium text-base">
            For each subject:{" "}
          </p>

          <div className="mb-8">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-6">
            {Object.entries(examGroupedBySubject).map(([subject, exams]) => (
              <div key={subject} className="mb-6">
                <h3 className="text-lg font-bold text-indigo-700 mb-3">
                  {subject} ({exams.length} exams)
                </h3>

                <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {exams.map((exam, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border">
                      <p className="font-semibold">
                        {exam.subTopic} • Order {exam.order}
                      </p>

                      <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                        <span className="text-green-700">✔ {exam.correct}</span>
                        <span className="text-yellow-700">
                          ≈ {exam.partial}
                        </span>
                        <span className="text-red-700">✘ {exam.wrong}</span>
                        <span className="text-gray-600">⏭ {exam.skipped}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* D. Attempt Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              D. Attempt Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-green-50 rounded-xl p-3 border border-green-200">
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-600 text-2xl mr-4" />
                    <div>
                      <p className=" text-green-700 font-medium">Correct</p>
                      <p className="text-lg font-bold text-green-700">
                        {attemptSummary.correct}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-700 font-bold text-lg">
                    {attemptSummary.correctPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                  <div className="flex items-center">
                    <AlertTriangle className="text-yellow-600 text-2xl mr-4" />
                    <div>
                      <p className="text-yellow-700 font-medium">
                        Partially Correct
                      </p>
                      <p className="text-lg font-bold text-yellow-700">
                        {attemptSummary.partialCorrect}
                      </p>
                    </div>
                  </div>
                  <span className="text-yellow-700 font-bold text-lg">
                    {attemptSummary.partialPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between bg-red-50 rounded-xl p-3 border border-red-200">
                  <div className="flex items-center">
                    <FaTimesCircle className="text-red-600 text-2xl mr-4" />
                    <div>
                      <p className="text-red-700 font-medium">Wrong</p>
                      <p className="text-lg font-bold text-red-700">
                        {attemptSummary.wrong}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-700 font-bold text-lg">
                    {attemptSummary.wrongPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center">
                    <FaMinusCircle className="text-gray-500 text-2xl mr-4" />
                    <div>
                      <p className="text-gray-600 font-medium">Skipped</p>
                      <p className="text-lg font-bold text-gray-600">
                        {attemptSummary.skipped}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-600 font-bold text-lg">
                    {attemptSummary.skippedPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attemptData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attemptData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* E. Key Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 font-poppins">
              E. Key Insights
            </h2>
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-start">
                <FaStar className="text-green-600 text-2xl mr-4 mt-1" />
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Student's Strongest Subject:
                  </p>
                  <p className="text-xl font-bold text-green-700 mb-1">
                    {keyInsights.strongestSubject.name}
                  </p>
                  <p className="text-green-600 font-semibold text-base">
                    {keyInsights.strongestSubject.percentage.toFixed(1)}%
                    performance
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 text-2xl mr-4 mt-1" />
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Student's Weakest Subject:
                  </p>
                  <p className="text-xl font-bold text-red-700 mb-1">
                    {keyInsights.weakestSubject.name}
                  </p>
                  <p className="text-red-600 font-semibold text-base">
                    {keyInsights.weakestSubject.percentage.toFixed(1)}%
                    performance
                  </p>
                  <p className="text-sm text-gray-600 mt-2 italic">
                    Focus area for improvement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailedDashboard;
