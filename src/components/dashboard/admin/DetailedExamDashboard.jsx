import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DetailedExamDashboard = ({ exam, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (exam) {
      fetchDetailedData();
    }
  }, [exam]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/exams/${
          exam._id
        }/analysis`,
      );
      setData(response.data.data);
      console.log(response.data.data);

      setError(null);
    } catch (err) {
      setError("Failed to fetch exam details");
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
    summary,
    performanceDistribution,
    topPerformers,
    subTopicAnalysis,
    mostMistakenTopic,
    keyInsights,
  } = data;

  const performanceData = [
    {
      name: "Above 75%",
      value: performanceDistribution.above75.count,
      percentage: performanceDistribution.above75.percentage,
    },
    {
      name: "50-75%",
      value: performanceDistribution.between50_75.count,
      percentage: performanceDistribution.between50_75.percentage,
    },
    {
      name: "Below 50%",
      value: performanceDistribution.below50.count,
      percentage: performanceDistribution.below50.percentage,
    },
  ];

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

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
              {exam.examCode} - {exam.subject.name}
            </h1>
            {exam.subTopic && (
              <p className="text-indigo-600 mt-2 font-rubik">
                SubTopic: {exam.subTopic.name}
              </p>
            )}
            <p className="text-gray-600 mt-1">Detailed Analysis & Insights</p>
          </div>
        </div>

        {/* A. Exam Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              A. Exam Summary
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
              <p className="text-gray-600 text-xs mb-2 font-medium">
                Total Submissions
              </p>
              <p className="text-xl font-bold text-blue-700">
                {summary.totalStudents}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
              <p className="text-gray-600 text-xs mb-2 font-medium">
                Highest Marks
              </p>
              <p className="text-xl font-bold text-green-700">
                {summary.highestMark}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
              <p className="text-gray-600 text-xs mb-2 font-medium">
                Lowest Marks
              </p>
              <p className="text-xl font-bold text-red-700">
                {summary.lowestMark}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5">
              <p className="text-gray-600 text-xs mb-2 font-medium">
                Average Marks
              </p>
              <p className="text-xl font-bold text-indigo-700">
                {summary.averageMark.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* B. Performance Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              B. Performance Distribution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-gray-700 font-semibold mb-4 text-base">
                Number of submissions scoring:
              </p>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-green-50 rounded-xl p-4">
                  <span className="text-gray-700 font-medium">Above 75%</span>
                  <span className="font-bold text-green-700 text-base">
                    {performanceDistribution.above75.count} (
                    {performanceDistribution.above75.percentage}%)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-yellow-50 rounded-xl p-4">
                  <span className="text-gray-700 font-medium">50-75%</span>
                  <span className="font-bold text-yellow-700 text-base">
                    {performanceDistribution.between50_75.count} (
                    {performanceDistribution.between50_75.percentage}%)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-red-50 rounded-xl p-4">
                  <span className="text-gray-700 font-medium">Below 50%</span>
                  <span className="font-bold text-red-700 text-base">
                    {performanceDistribution.below50.count} (
                    {performanceDistribution.below50.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
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

        {/* C. Top Performers */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              C. Top Performers
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-indigo-100">
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((performer, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {index === 0 && (
                          <FaTrophy className="text-yellow-500 mr-2 text-lg" />
                        )}
                        {index === 1 && (
                          <FaTrophy className="text-gray-400 mr-2 text-lg" />
                        )}
                        {index === 2 && (
                          <FaTrophy className="text-orange-600 mr-2 text-lg" />
                        )}
                        <span className="text-xs font-bold text-gray-700">
                          {performer.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-gray-900">
                      {performer.email}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        {performer.marks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. SubTopic-Wise Analysis */}
        {/* <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              D. SubTopic-Wise Analysis
            </h2>
          </div>

          <p className="text-gray-700 mb-6 font-medium">For each subtopic:</p>

          <div className="mb-8">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={subTopicAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="subTopic"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: "Average Score (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6b7280" },
                  }}
                  tick={{ fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value}%`, "Avg Score"]}
                />
                <Bar
                  dataKey="avgScore"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
              <p className="text-gray-700 font-semibold mb-3 text-base">
                Average Marks by SubTopic:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subTopicAnalysis.map((topic, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm"
                  >
                    <span className="text-gray-700 font-medium">
                      {topic.subTopic}
                    </span>
                    <span className="font-bold text-indigo-700 text-base">
                      {topic.avgScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 text-lg mr-3 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-700 font-semibold mb-2 text-base">
                    Most Mistaken SubTopic:
                  </p>
                  <p className="text-lg font-bold text-red-700 mb-1">
                    {mostMistakenTopic.subTopic}
                  </p>
                  <p className="text-red-600 font-medium">
                    {mostMistakenTopic.avgScore}% correct
                  </p>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    This is optional but crucial for improvement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 mr-4 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900 font-poppins">
              E. Key Insights
            </h2>
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-start">
                <FaStar className="text-green-600 text-lg mr-4 mt-1" />
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Students performed best in:
                  </p>
                  <p className="text-lg font-bold text-green-700 mb-1">
                    {keyInsights.bestPerformingSubTopic.name}
                  </p>
                  <p className="text-green-600 font-semibold text-base">
                    {keyInsights.bestPerformingSubTopic.score}% average
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 text-lg mr-4 mt-1" />
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Students performed poorly in:
                  </p>
                  <p className="text-lg font-bold text-red-700 mb-1">
                    {keyInsights.poorlyPerformingSubTopic.name}
                  </p>
                  <p className="text-red-600 font-semibold text-base">
                    {keyInsights.poorlyPerformingSubTopic.score}% average
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default DetailedExamDashboard;
