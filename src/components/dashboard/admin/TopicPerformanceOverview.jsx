import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaArrowUp, FaArrowDown, FaLayerGroup } from "react-icons/fa";

// Exam Dashboard → topic-wise leaderboard: for every subject+subtopic
// ("topic") that has at least one completed submission, shows the class
// average plus who's leading and who's struggling on that specific topic —
// a finer-grained view than the per-exam cards above it, since one topic
// usually spans several exams.
const TopicPerformanceOverview = ({ category }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/topics/overview`,
        {
          params: category && category !== "all" ? { category } : {},
        }
      );
      setTopics(response.data.data.topics || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch topic performance");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 text-center text-gray-500">
        No topic performance data yet — this fills in once students start
        completing exams.
      </div>
    );
  }

  const chartData = topics.map((t) => ({
    topic: `${t.subjectName} • ${t.subTopicName}`,
    percentage: t.classAverage,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="flex items-center mb-6">
        <FaLayerGroup className="text-indigo-600 text-lg mr-3" />
        <h2 className="text-lg font-bold text-gray-900 font-poppins">
          Topic-wise Performance
        </h2>
      </div>

      <div className="mb-8">
        <ResponsiveContainer width="100%" height={Math.max(260, topics.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="topic"
              width={220}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="percentage" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Topic</th>
              <th className="py-2 pr-4">Class Avg</th>
              <th className="py-2 pr-4">Top Performer</th>
              <th className="py-2 pr-4">Weakest Performer</th>
              <th className="py-2 pr-4">Students</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr
                key={`${t.subjectId}-${t.subTopicId}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-3 pr-4 font-medium text-gray-800">
                  {t.subjectName}
                </td>
                <td className="py-3 pr-4 text-gray-700">{t.subTopicName}</td>
                <td className="py-3 pr-4 font-semibold text-indigo-700">
                  {t.classAverage}%
                </td>
                <td className="py-3 pr-4">
                  {t.topPerformer ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                      <FaArrowUp />
                      {t.topPerformer.name} ({t.topPerformer.avgPercentage}%)
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {t.weakestPerformer ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                      <FaArrowDown />
                      {t.weakestPerformer.name} (
                      {t.weakestPerformer.avgPercentage}%)
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600">{t.totalStudents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopicPerformanceOverview;
