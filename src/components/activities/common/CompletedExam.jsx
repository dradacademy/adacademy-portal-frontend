import React from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  ChevronRight,
  Layers,
  Mail,
  Tag,
  Trophy,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

const CompletedExam = ({
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
      className={`md:col-span-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1  p-6 group`}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4 font-poppins">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Completed
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
              <div className="flex items-center gap-2 text-sm text-green-600">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span>
                  Obtained Score: {exam.obtainedMark} ({scorePercentage}%)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Award className="h-4 w-4 text-green-600" />
                <span>
                  {/* Passed:{" "} */}
                  Total: {totalPossibleMarks.toFixed(2)}{" "}
                  (Required: {exam.examId.passPercentage}%)
                </span>
              </div>
            </div>
          </div>
          {exam.reviews && exam.reviews.length > 0 ? (
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2 font-inter">
                Instructor Feedback:
              </div>
              <p className="text-sm text-gray-600 italic">
                "{exam.reviews[0].message}"
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 p-3 rounded-lg mb-4 flex items-center gap-2">
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
              Completed {formatDate(exam.createdAt)}
            </span>
            <Link
              to={`/activities/completed/${exam._id}`}
              className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium transition-colors hover:border-blue-600 hover:text-blue-600 flex items-center gap-1"
            >
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className=" md:block max-w-40 w-full bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center font-poppins">
          <div className=" flex flex-col items-center justify-center w-full h-full">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div className=" flex items-center gap-3">
              <span className="text-sm font-semibold text-green-700">
                Achievement
              </span>
            </div>
            <div className="text-xs text-green-700 text-center mt-0.5">
              (Negative is applied for wrong answers)
            </div>
            <div className="mt-4 w-full flex items-center justify-center gap-3">
              <div className="text-xs text-center font-medium text-green-700">
                Score
              </div>
              <div className="flex items-center justify-center gap-1 text-green-800">
                <span className="font-semibold">{scorePercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedExam;
