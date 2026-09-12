import React from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronRight,
  Layers,
  Mail,
  Tag,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

const PreviousAttemptComponent = ({
  currentUsertype,
  index,
  exam,
  totalPossibleMarks,
  formatDate,
}) => {
  const scorePercentage = totalPossibleMarks
    ? Math.round((exam.obtainedMark / totalPossibleMarks) * 100)
    : 0;

  return (
    <div
      key={index}
      className={`md:col-span-6
       bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 p-6 group`}
    >
      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4 font-poppins">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${
                  exam.attemptNumber <= 3
                    ? "bg-amber-50"
                    : exam.attemptNumber >= 4 && exam.attemptNumber <= 6
                    ? "bg-amber-100"
                    : exam.attemptNumber >= 7 && exam.attemptNumber <= 10
                    ? "bg-amber-200"
                    : "bg-amber-300"
                } flex items-center justify-center`}
              >
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <span
                  className={`text-xs font-medium text-amber-600 ${
                    exam.attemptNumber <= 3
                      ? "bg-amber-50"
                      : exam.attemptNumber >= 4 && exam.attemptNumber <= 6
                      ? "bg-amber-100"
                      : exam.attemptNumber >= 7 && exam.attemptNumber <= 10
                      ? "bg-amber-200"
                      : "bg-amber-300"
                  } px-2 py-0.5 rounded-full`}
                >
                  Attempt #{exam.attemptNumber}
                </span>
                <h3 className="text-xl font-bold text-gray-900 capitalize mt-1">
                  {exam.examId.subject?.name}
                </h3>
              </div>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">
              {exam.examId.examCode}
            </div>
          </div>

          {currentUsertype === "evaluator" && (
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {exam.userId.username}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {exam.userId.email}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4 font-inter">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{exam.examId.subTopicName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Layers className="h-4 w-4 text-gray-400" />
                <span>Order {exam.examId.order}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <span className={exam.pass ? "text-green-600" : "text-red-600"}>
                  Obtained Score: {exam.obtainedMark} ({scorePercentage}%)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span className={exam.pass ? "text-green-600" : "text-red-600"}>
                  {/* {exam.pass ? "Passed: " : "Failed: "}{" "} */}
                  Total: {totalPossibleMarks.toFixed(2)}{" "}
                  (Required: {exam.examId.passPercentage}%)
                </span>
              </div>
            </div>
          </div>
          {exam.reviews && exam.reviews.length > 0 ? (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2 font-inter">
                Instructor Feedback:
              </div>
              <p className="text-sm text-gray-600 italic">
                "{exam.reviews[0].message}"
              </p>
            </div>
          ) : (
            <div
              className={`${
                exam.attemptNumber <= 3
                  ? "bg-amber-50"
                  : exam.attemptNumber >= 4 && exam.attemptNumber <= 6
                  ? "bg-amber-100"
                  : exam.attemptNumber >= 7 && exam.attemptNumber <= 10
                  ? "bg-amber-200"
                  : "bg-amber-300"
              } p-3 rounded-lg mb-4 flex items-center gap-2`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                {currentUsertype === "student"
                  ? "No feedback"
                  : "Feedback needed"}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-inter">
            <span className="text-xs text-gray-500">
              Attempted {formatDate(exam.createdAt)}
            </span>
            <Link
              to={`/activities/attempted/${exam._id}`}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium transition-colors hover:border-blue-600 hover:text-blue-600 flex items-center gap-1"
            >
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div
          className={` md:block w-40 ${
            exam.attemptNumber <= 3
              ? "bg-amber-50"
              : exam.attemptNumber >= 4 && exam.attemptNumber <= 6
              ? "bg-amber-100"
              : exam.attemptNumber >= 7 && exam.attemptNumber <= 10
              ? "bg-amber-200"
              : "bg-amber-300"
          } rounded-lg p-4 flex flex-col items-center justify-center font-poppins`}
        >
          <div className=" flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <div
                className={`w-12 h-12 rounded-full ${
                  exam.pass ? "bg-green-600" : "bg-red-500"
                } flex items-center justify-center text-white font-bold text-lg`}
              >
                {scorePercentage}%
              </div>
            </div>
          </div>
          <div className=" flex items-center gap-2 justify-center flex-wrap">
            <span className="text-sm font-medium text-amber-700 text-nowrap">
              {currentUsertype === "student" ? "Your Score" : "Status"}
            </span>
            <span className="text-xs text-amber-600">
              {exam.pass ? "Passed" : "Failed"}
            </span>
          </div>
          <div className="text-xs text-amber-600 text-center mt-0.5">
            (Negative is applied for wrong answers)
          </div>

          {currentUsertype === "student" ? (
            <div className="mt-4 w-full">
              <div className="text-xs text-center text-amber-700 mb-1">
                Attempt
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-medium">#{exam.attemptNumber}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 w-full">
              <div className="text-xs text-center text-amber-700 mb-1">
                Review Status
              </div>
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    exam.reviews && exam.reviews.length > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {exam.reviews && exam.reviews.length > 0
                    ? "Reviewed"
                    : "Pending"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviousAttemptComponent;
