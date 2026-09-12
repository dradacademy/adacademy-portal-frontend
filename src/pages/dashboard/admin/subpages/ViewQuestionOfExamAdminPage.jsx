import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiBarChart, BiHash } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const ViewQuestionOfExamAdminPage = () => {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExamDetails = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/exams/${examId}`
      );
      setExamDetails(data);
    } catch (error) {
      console.error("Fetch Exams Error:", error);
      toast.error(error?.response?.data?.message || "Could not load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const renderAnswers = (question) => {
    switch (question.questionType) {
      case "MCQ":
      case "MSQ":
        return (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const optionText = typeof opt === "object" && opt !== null ? opt.text : opt;
              const optionImage = typeof opt === "object" && opt !== null ? opt.image : null;
              return (
              <div
                key={idx}
                className={`p-3 rounded-xl ${
                  question.correctAnswers.includes(optionText)
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <span
                  className={
                    question.correctAnswers.includes(optionText)
                      ? "text-green-600"
                      : "text-gray-700"
                  }
                >
                  {optionText}
                </span>
                {optionImage && (
                  <img src={optionImage} alt={`Option ${idx + 1}`} className="max-h-20 object-contain mt-2 rounded" />
                )}
              </div>
              );
            })}
          </div>
        );

      case "Fill in the Blanks":
        return (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className=" flex flex-col gap-2">
              <span className="text-gray-700 font-medium">
                Acceptable Answers:
              </span>
              <div className="flex flex-wrap gap-2">
                {question.correctAnswers.map((answer, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-sm border border-green-200"
                  >
                    {answer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case "Short Answer":
        return (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className=" flex flex-col gap-2">
              <span className="text-gray-700 font-medium">Keywords:</span>
              <div className="flex flex-wrap gap-2">
                {question.correctAnswers.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-sm border border-green-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAnswerKey = (question) => {
    if (!question.answerKeyText && !question.answerKeyImage) return null;
    return (
      <div className="mt-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <div className="text-sm font-semibold text-indigo-800 mb-2">Answer Key</div>
        {question.answerKeyText && (
          <div className="text-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: question.answerKeyText }} />
        )}
        {question.answerKeyImage && (
          <img src={question.answerKeyImage} alt="Answer Key" className="max-h-48 object-contain rounded border border-gray-200 bg-white p-1" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Loading state */}
      {loading ? (
        <p className="text-center text-stone-500">Loading exam details...</p>
      ) : examDetails ? (
        <div className=" flex flex-col gap-5">
          <div className="flex items-center justify-between gap-20 font-inter ">
            <div className="flex flex-col gap-2">
              <div
                onClick={() => navigate(-1)}
                className=" group text-stone-500 font-medium text-sm flex items-center gap-2 w-fit cursor-pointer"
              >
                <div className=" border border-stone-300 bg-white rounded-md p-1.5">
                  <IoIosArrowBack />
                </div>
                <p className=" group-hover:underline duration-300">Back</p>
              </div>
              <h1 className="text-3xl text-stone-700 font-bold font-poppins">
                {examDetails.subject}
              </h1>
              <p className="text-stone-500 font-manrope">
                {examDetails.subTopic}
              </p>
            </div>
            <div className="flex gap-2">
              <button className=" text-sm font-medium py-1 px-4 rounded-3xl bg-indigo-100 text-indigo-400">
                Order: {examDetails.order}
              </button>
              <button
                className={` text-sm font-medium py-1 px-4 rounded-3xl ${
                  examDetails.status === "active"
                    ? "bg-green-200 text-green-500/90"
                    : ""
                } `}
              >
                {examDetails.status}
              </button>
            </div>
          </div>
          <div className=" grid grid-cols-3 gap-3 ">
            <div className=" bg-white shadow rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <BiHash className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {examDetails.questions.length}
                  </p>
                </div>
              </div>
            </div>
            {/* <div className=" bg-white rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <FaUser className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {"Number"}
                  </p>
                </div>
              </div>
            </div>
            <div className=" bg-white rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <BiBarChart className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Score</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {"Number"} %
                  </p>
                </div>
              </div>
            </div> */}
          </div>
          <div className=" flex flex-col gap-2">
            {examDetails.questions.map((question, index) => (
              <div
                key={question.id}
                className={`bg-white shadow-slate-50 shadow-sm rounded-xl p-6 hover:shadow-sm hover:shadow-slate-200 transition-shadow flex flex-col gap-4`}
              >
                <div className="flex items-center justify-between ">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      Question {index + 1}
                    </span>
                    <span className="px-4 py-1 bg-indigo-100 text-indigo-400 rounded-full text-sm">
                      {question.questionType}
                    </span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs">
                      Level {question.level}
                    </span>
                    {question.marks != null && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs">
                        {question.marks} marks
                      </span>
                    )}
                    {question.negativeMark != null && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-xs">
                        -{question.negativeMark} negative
                      </span>
                    )}
                    {question.duration != null && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs">
                        {question.duration}s
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-900 ">{question.questionText}</p>
                {question.image && (
                  <img
                    src={question.image}
                    className=" max-h-40 object-contain flex items-center justify-start"
                    alt=""
                  />
                )}
                {renderAnswers(question)}
                {renderAnswerKey(question)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-red-500">Exam details not found.</p>
      )}
    </div>
  );
};

export default ViewQuestionOfExamAdminPage;
