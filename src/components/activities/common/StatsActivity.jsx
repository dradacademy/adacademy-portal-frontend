import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Trophy,
  Users,
} from "lucide-react";
import React from "react";

const StatsActivity = ({
  currentUsertype,
  examData,
  stats,
  studentsLength,
}) => {
  return (
    <div className="relative mb-12 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50 rounded-bl-full opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-teal-50 rounded-tr-full opacity-70"></div>
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-poppins">
              {currentUsertype === "student" ? "My" : "Student"} Activities
            </h1>
            <p className="text-gray-600 mb-6 max-w-2xl font-inter">
              {currentUsertype === "student"
                ? "Manage your exams, track your progress, and review your performance. Your journey to academic excellence starts here."
                : " Monitor student exam attempts, review performance, and provide feedback. Track progress and help students achieve academic excellence."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 font-inter">
              {currentUsertype === "student" && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {examData.eligible.length}
                  </div>
                  <div className="text-xs text-center font-medium text-gray-500">
                    Available Exams to Attend
                  </div>
                </div>
              )}
              {currentUsertype === "student" && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.unattendedExams}
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    Un-Attended
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {examData.previousAttempts.length}
                </div>
                <div className="text-xs text-center font-medium text-gray-500">
                  Attempted
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {examData.completed.length}
                </div>
                <div className="text-xs font-medium text-gray-500">
                  Completed
                </div>
              </div>
              {(currentUsertype === "evaluator" ||
                currentUsertype === "admin") && (
                <>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {
                        [
                          ...examData.previousAttempts,
                          ...examData.completed,
                        ].filter(
                          (exam) => !exam.reviews || exam.reviews.length === 0
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-500">Need Review</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {studentsLength?.length}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative xl:min-w-72 font-inter">
            {currentUsertype === "student" ? (
              <>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 max-w-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Your Progress</h3>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Completion Rate</span>
                        <span className="text-blue-600">
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${stats.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Success Rate</span>
                        <span className="text-green-600">
                          {stats.successRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full"
                          style={{ width: `${stats.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>Achievement Level</span>
                        </div>
                        <span className="font-medium">
                          {stats.achievementLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-amber-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 max-w-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Review Status</h3>
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Reviewed Exams</span>
                        <span className="text-blue-600">
                          {Math.round(
                            ([
                              ...examData.previousAttempts,
                              ...examData.completed,
                            ].filter(
                              (exam) => exam.reviews && exam.reviews.length > 0
                            ).length /
                              [
                                ...examData.previousAttempts,
                                ...examData.completed,
                              ].length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${Math.round(
                              ([
                                ...examData.previousAttempts,
                                ...examData.completed,
                              ].filter(
                                (exam) =>
                                  exam.reviews && exam.reviews.length > 0
                              ).length /
                                [
                                  ...examData.previousAttempts,
                                  ...examData.completed,
                                ].length) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Success Rate</span>
                        <span className="text-blue-600">
                          {Math.round(
                            (examData.completed.filter((exam) => exam.pass)
                              .length /
                              [
                                ...examData.previousAttempts,
                                ...examData.completed,
                              ].length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${Math.round(
                              (examData.completed.filter((exam) => exam.pass)
                                .length /
                                [
                                  ...examData.previousAttempts,
                                  ...examData.completed,
                                ].length) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-purple-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsActivity;
