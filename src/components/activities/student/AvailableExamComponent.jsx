import React, { useContext } from "react";
import { ArrowUpRight, Award, BookOpen, FileText, Tag } from "lucide-react";
import { DurationContext } from "../../../context/DurationContext";

const AvailableExamComponent = ({
  index,
  exam,
  handleOpenExamDialog,
  formatDate,
}) => {
  const { durationData } = useContext(DurationContext);

  return (
    <div
      key={index}
      className={`md:col-span-4
      bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 group p-6 font-inter`}
    >
      <div className="flex justify-between items-start mb-4 font-poppins">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1 ">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Order {exam.order}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 capitalize mt-1 ">
              {exam.subjectName}
            </h3>
          </div>
        </div>
        <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">
          {exam.examCode}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="capitalize">{exam.subTopicName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-gray-400" />
          <span>{exam.questions.length} Questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Award className="h-4 w-4 text-gray-400" />
          <span>Pass: {exam.passPercentage}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Added {formatDate(exam.createdAt)}
        </span>
        <button
          onClick={() => handleOpenExamDialog(exam)}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          Start Exam <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white px-6 py-6 rounded-3xl">
        <div className="flex justify-between items-center gap-3">
          <div className="flex gap-3 items-center">
            <BiBook className="text-2xl t-1 text-white" />
            <div className=" flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{exam.subjectName}</h2>
              </div>
              <p className="text-indigo-100">{exam.subTopicName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 text-xs text-white font-medium bg-white/10 rounded-md backdrop-blur-sm">
              {exam.examCode}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <div className=" flex gap-2 w-full">
          <div className=" flex gap-3 items-center w-full bg-gradient-to-br bg-rose-400 text-white py-3 px-5 rounded-3xl">
            <BiTimeFive className="text-2xl" />
            <div>
              <p className="text-orange-100 text-sm">Duration</p>
              <p className="text-lg font-bold text-nowrap">{`${Math.floor(
                  (exam.questions.length *
                    (exam.level === 1
                      ? durationData.level1Duration
                      : exam.level === 2
                      ? durationData.level2Duration
                      : exam.level === 3
                      ? durationData.level3Duration
                      : durationData.level4Duration)) /
                    60
                )} min ${
                  (exam.questions.length *
                    (exam.level === 1
                      ? durationData.level1Duration
                      : exam.level === 2
                      ? durationData.level2Duration
                      : exam.level === 3
                      ? durationData.level3Duration
                      : durationData.level4Duration)) %
                  60
                } sec`}</p>
            </div>
          </div>
          <div className=" flex gap-3 items-center w-full bg-gradient-to-br bg-emerald-400 text-white py-3 px-5 rounded-3xl">
            <BiTrophy className="text-2xl" />
            <div>
              <p className="text-green-100 text-sm">Difficulty</p>
              <p className="text-lg font-bold">Level {exam.level}</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleOpenExamDialog(exam)}
          className="flex justify-between items-center gap-3 w-full bg-indigo-500 text-white py-3 px-5 rounded-xl transition-all group cursor-pointer"
        >
          <button className=" font-medium text-nowrap">Attend the Exam</button>
          <BiRightArrowAlt className=" text-2xl group-hover:translate-x-2 transition-transform" />
        </div>
      </div> */}
    </div>
  );
};

export default AvailableExamComponent;
