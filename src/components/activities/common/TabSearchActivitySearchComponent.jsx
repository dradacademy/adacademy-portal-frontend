import {
  BarChart3,
  Bookmark,
  BookMarked,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import React from "react";

const TabSearchActivitySearchComponent = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filterOpen,
  setFilterOpen,
  activeFiltersCount,
  clearFilters,
  subjects,
  filters,
  setFilters,
  toggleFilter,
  capitalize,
  topics,
  levels,
  currentUsertype,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex border-b border-gray-100 font-poppins">
        {currentUsertype === "student" && (
          <button
            onClick={() => setActiveTab("Available")}
            className={` cursor-pointer flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === "Available"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            <FileText className="h-4 w-4" />
            Available Exams
          </button>
        )}
        <button
          onClick={() => setActiveTab("Previous Attempt")}
          className={` cursor-pointer flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "Previous Attempt"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <Clock className="h-4 w-4" />
          Previously Attempted
        </button>
        <button
          onClick={() => setActiveTab("Completed")}
          className={` cursor-pointer flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "Completed"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Completed Exams
        </button>
      </div>
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between font-poppins">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search exams..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={` cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFiltersCount > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white border border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-blue-600 text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
      {filterOpen && (
        <div className="p-6 border-t border-gray-100 bg-white rounded-b-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-rubik">
            <div
              className={` ${
                activeTab === "Available" ? "md:col-span-5" : "md:col-span-3"
              } bg-blue-50 rounded-xl p-4`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookMarked className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 font-poppins">
                  Subject
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((subject) => (
                  <div
                    key={subject}
                    onClick={() => toggleFilter("subjects", subject)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      filters.subjects.includes(subject)
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      <div className=" p-2 rounded-lg bg-blue-50 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <span className="text-sm ml-2">{capitalize(subject)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className={` ${
                activeTab === "Available" ? "md:col-span-4" : "md:col-span-3"
              } bg-teal-50 rounded-xl p-4`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Bookmark className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="font-medium text-gray-900 font-poppins">
                  Topic
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <div
                    key={topic}
                    onClick={() => toggleFilter("topics", topic)}
                    className={`px-3 pt-1.5 pb-1 rounded-full text-xs cursor-pointer transition-colors ${
                      filters.topics.includes(topic)
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-700 border border-teal-200 hover:border-teal-400"
                    }`}
                  >
                    {capitalize(topic)}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={` ${
                activeTab === "Available" ? "md:col-span-3" : "md:col-span-2"
              } bg-purple-50 rounded-xl p-4`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 font-poppins">
                  Level
                </h3>
              </div>
              <div className="space-y-2">
                {levels.map((level) => (
                  <div
                    key={level}
                    onClick={() => toggleFilter("levels", level)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      filters.levels.includes(level)
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700 hover:bg-purple-100"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        filters.levels.includes(level)
                          ? "bg-white text-purple-600"
                          : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {level}
                    </div>
                    <span className="text-sm">Level {level}</span>
                  </div>
                ))}
              </div>
            </div>
            {activeTab != "Available" && (
              <div className="md:col-span-4 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    Score Percentage
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>Min: {filters.percentageRange?.[0] || 0}%</span>
                    <span>Max: {filters.percentageRange?.[1] || 100}%</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filters.percentageRange?.[0] || 0}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [
                            Number.parseInt(e.target.value),
                            prev.percentageRange?.[1] || 100,
                          ],
                        }))
                      }
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filters.percentageRange?.[1] || 100}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [
                            prev.percentageRange?.[0] || 0,
                            Number.parseInt(e.target.value),
                          ],
                        }))
                      }
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer mt-4"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [0, 40],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                        filters.percentageRange?.[0] === 0 &&
                        filters.percentageRange?.[1] === 40
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-blue-200 hover:border-blue-400"
                      }`}
                    >
                      0-40%
                    </div>
                    <div
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [41, 60],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                        filters.percentageRange?.[0] === 41 &&
                        filters.percentageRange?.[1] === 60
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-blue-200 hover:border-blue-400"
                      }`}
                    >
                      41-60%
                    </div>
                    <div
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [61, 80],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                        filters.percentageRange?.[0] === 61 &&
                        filters.percentageRange?.[1] === 80
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-blue-200 hover:border-blue-400"
                      }`}
                    >
                      61-80%
                    </div>
                    <div
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [81, 100],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                        filters.percentageRange?.[0] === 81 &&
                        filters.percentageRange?.[1] === 100
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-blue-200 hover:border-blue-400"
                      }`}
                    >
                      81-100%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.percentageRange?.[0] || 0}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [
                            Math.min(
                              Number.parseInt(e.target.value) || 0,
                              prev.percentageRange?.[1] || 100
                            ),
                            prev.percentageRange?.[1] || 100,
                          ],
                        }))
                      }
                      className="w-full p-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none"
                      placeholder="Min %"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.percentageRange?.[1] || 100}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          percentageRange: [
                            prev.percentageRange?.[0] || 0,
                            Math.max(
                              Number.parseInt(e.target.value) || 0,
                              prev.percentageRange?.[0] || 0
                            ),
                          ],
                        }))
                      }
                      className="w-full p-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none"
                      placeholder="Max %"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setFilterOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabSearchActivitySearchComponent;
