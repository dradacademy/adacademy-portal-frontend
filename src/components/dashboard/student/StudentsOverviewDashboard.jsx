import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaGraduationCap } from "react-icons/fa";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// Generic click-to-sort column header — same pattern used across the other
// admin tables (Test Tracking, Attendance Report, etc.): first click sorts
// ascending, a second click on the same column flips to descending, a
// different column starts a fresh ascending sort.
const SortableTh = ({ label, sortKey, sort, onSort, className = "" }) => {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 hover:text-indigo-600 duration-150 ${
          active ? "text-indigo-600" : ""
        }`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
};

const SORTERS = {
  registerNumber: (s) => (s.registerNumber || "").toLowerCase(),
  name: (s) => (s.name || "").toLowerCase(),
  email: (s) => (s.email || "").toLowerCase(),
  totalExams: (s) => s.totalExams ?? 0,
  avgPercentage: (s) => s.avgPercentage ?? 0,
};

const StudentsOverviewDashboard = ({ onStudentClick }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const handleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/dashboard/students/overview`
      );
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch student data");
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
          <p className="mt-4 text-gray-600 font-inter">Loading students...</p>
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

  const { students, totalStudents } = data;

  const sortedStudents = [...students].sort((a, b) => {
    if (!sort.key || !SORTERS[sort.key]) return 0;
    const getValue = SORTERS[sort.key];
    const dirMultiplier = sort.dir === "asc" ? 1 : -1;
    const va = getValue(a);
    const vb = getValue(b);
    if (typeof va === "string" || typeof vb === "string") {
      return String(va).localeCompare(String(vb)) * dirMultiplier;
    }
    return (va - vb) * dirMultiplier;
  });

  return (
    <div className="min-h-screen font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-poppins">
            Student Dashboard
          </h1>
          <p className="text-gray-600 text-base font-rubik">
            Overview of all students
          </p>
        </div>

        {/* Total Students Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-xl">
              <FaGraduationCap className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h2 className="text-xl font-bold text-white font-poppins">
              All Students
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableTh label="Register No." sortKey="registerNumber" sort={sort} onSort={handleSort} />
                  <SortableTh label="Student Name" sortKey="name" sort={sort} onSort={handleSort} />
                  <SortableTh label="Email" sortKey="email" sort={sort} onSort={handleSort} />
                  <SortableTh label="Exams Taken" sortKey="totalExams" sort={sort} onSort={handleSort} />
                  <SortableTh label="Avg %" sortKey="avgPercentage" sort={sort} onSort={handleSort} />
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.registerNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {student.totalExams}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${
                          student.avgPercentage >= 75
                            ? "bg-green-100 text-green-800"
                            : student.avgPercentage >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {student.avgPercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => onStudentClick(student)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsOverviewDashboard;
