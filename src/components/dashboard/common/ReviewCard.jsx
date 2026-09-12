import React, { useState } from "react";
import { Award, BookOpen, Mail, TrendingUp, User, Zap } from "lucide-react";
import { MdDelete, MdEdit } from "react-icons/md";

const ReviewCard = ({
  index,
  userData,
  comment,
  handleOpenEditReviewPopup,
  handleDeleteReview,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div key={index} className=" bg-stone-50 rounded-2xl">
      <div className=" flex items-start justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-2xl">
        <div className=" flex flex-col gap-2">
          <div
            className={`flex items-center justify-between gap-2 pl-3 pr-4 py-0.5 bg-indigo-500 opacity-90 text-white rounded-full text-sm font-semibold w-fit`}
          >
            <Award className="h-4 w-4" />
            <span>Level {comment.level}</span>
          </div>
          <div className=" flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-indigo-50" />
            </div>
            <div>
              <h1 className=" text-stone-800 font-bold text-lg">
                {comment.subject.name}
              </h1>
              <p className=" text-stone-600 font-medium text-sm">
                {comment.subject.subtopic.name}
              </p>
            </div>
          </div>
        </div>
        {userData.role === "evaluator" && (
          <div className=" flex items-center gap-2">
            <MdEdit
              onClick={(e) => handleOpenEditReviewPopup(e, comment)}
              className=" text-2xl cursor-pointer bg-indigo-400 text-white p-1 rounded-md hover:bg-indigo-500 transition-colors duration-200"
            />
            <MdDelete
              onClick={(e) => handleDeleteReview(e, comment._id)}
              className=" text-2xl cursor-pointer bg-red-400 text-white p-1 rounded-md hover:bg-red-500 transition-colors duration-200"
            />
          </div>
        )}
      </div>
      <div className=" p-1.5">
        <div className="mb-4 p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Performance Range
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {comment.startingPercentage}% - {comment.endingPercentage}%
            </div>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all duration-500`}
              style={{
                marginLeft: `${comment.startingPercentage}%`,
                width: `${
                  comment.endingPercentage - comment.startingPercentage
                }%`,
              }}
            ></div>
            <div className="absolute inset-0 flex justify-between items-center px-1">
              {[0, 25, 50, 75, 100].map((mark) => (
                <div
                  key={mark}
                  className="w-0.5 h-1 bg-gray-300 rounded-full"
                ></div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="mb-2 bg-white p-2 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            Evaluator Feedback
          </h4>
          <div
            className={`text-gray-600 text-sm leading-relaxed ${
              !isExpanded && comment.message.length > 120 ? "line-clamp-3" : ""
            }`}
          >
            {comment.message}
          </div>
          {comment.message.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 transition-colors"
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>
        {userData.role === "admin" && (
          <div className="flex items-center gap-3 px-1.5 py-3 border-t border-stone-200">
            <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {comment.evaluator.username}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Mail className="h-3 w-3" />
                <span>{comment.evaluator.email}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
