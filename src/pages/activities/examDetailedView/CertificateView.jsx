import React from "react";
import { Trophy } from "lucide-react";

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const CertificateView = ({ userData, examData, scoreData, markData }) => {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xs border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-indigo-50 p-3 sm:p-8 text-center relative">
          <div className="absolute top-4 left-4 w-16 h-16 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-24 h-24 bg-white/20 rounded-full"></div>
          <div className="relative">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-white shadow-2xs flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-amber-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Certificate of Completion
              </h1>
              <p className="text-gray-600">
                This certifies that{" "}
                {userData.role === "student" ? "you have" : "the student has"}{" "}
                successfully completed the exam
              </p>
            </div>
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-2xs p-8 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1 capitalize">
                  {examData.examId.subject?.name}: {examData.examId.subTopicName}
                </h2>
                <p className="text-gray-600">
                  Level {examData.examId.level} | Code:{" "}
                  {examData.examId.examCode}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-8 mb-6">
                <div className="text-center">
                  <div className=" text-2xl sm:text-3xl font-bold text-green-600">
                    {scoreData.scorePercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="h-12 w-px bg-gray-200 hidden sm:flex"></div>
                <div className="text-center">
                  <div className=" text-2xl sm:text-3xl font-bold text-gray-900">
                    {examData.obtainedMark}/
                    {scoreData.totalQuestions *
                      (examData.examId.level === 1
                        ? markData.level1Mark
                        : examData.examId.level === 2
                        ? markData.level2Mark
                        : examData.examId.level === 3
                        ? markData.level3Mark
                        : examData.examId.level === 4
                        ? markData.level4Mark
                        : markData.level1Mark)}
                  </div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="h-12 w-px bg-gray-200 hidden sm:flex"></div>
                <div className="text-center">
                  <div className=" text-2xl sm:text-3xl font-bold text-indigo-600">
                    {formatDate(examData.createdAt)}
                  </div>
                  <div className="text-sm text-gray-600">Completion Date</div>
                </div>
              </div>
              <div className="text-center text-gray-500 text-sm">
                <p>
                  This certificate verifies that{" "}
                  {userData.role === "student" ? (
                    <span className=" font-medium">
                      {userData.username.charAt(0).toUpperCase() +
                        userData.username.slice(1)}
                    </span>
                  ) : (
                    <span className=" font-medium">
                      {examData.userId.username.charAt(0).toUpperCase() +
                        examData.userId.username.slice(1)}
                    </span>
                  )}{" "}
                  has demonstrated proficiency in the subject matter and has met
                  all requirements for completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
