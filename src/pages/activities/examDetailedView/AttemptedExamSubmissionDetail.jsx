import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import { MdClose } from "react-icons/md";
import { Dialog } from "@mui/material";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CalendarDays,
  Clock,
  Edit2,
  Layers,
  Mail,
  MessageSquare,
  Send,
  Tag,
  Trash2,
  User,
  XCircle,
  BadgeInfo,
} from "lucide-react";
import { MarkContext } from "../../../context/MarkContext";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const formatDuration = (secs) => {
  if (!secs || secs < 0) secs = 0;

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

const positiveMarkForLevel = (level, markData) => {
  if (level === 1) {
    return markData.level1Mark;
  } else if (level === 2) {
    return markData.level2Mark;
  } else if (level === 3) {
    return markData.level3Mark;
  } else if (level === 4) {
    return markData.level4Mark;
  }
  return markData.level1Mark;
};

const negativeMarkForLevel = (level, markData) => {
  if (level === 1) {
    return markData.level1NegativeMark;
  } else if (level === 2) {
    return markData.level2NegativeMark;
  } else if (level === 3) {
    return markData.level3NegativeMark;
  } else if (level === 4) {
    return markData.level4NegativeMark;
  }
  return markData.level1NegativeMark;
};

const AttemptedExamSubmissionDetail = () => {
  const { userData } = useContext(AuthContext);
  const { markData } = useContext(MarkContext);

  const navigate = useNavigate();

  const { examSubmissionId } = useParams();
  const [generalReviews, setGeneralReviews] = useState([]);
  const [reviewInput, setReviewInput] = useState("");
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEditReviewPopup, setOpenEditReviewPopup] = useState(false);
  const [editReviewDetails, setEditReviewDetails] = useState({
    reviewId: "",
    message: "",
  });
  const [scoreData, setScoreData] = useState({
    totalQuestions: 0,
    scorePercentage: 0,
    totalMarks: 0,
  });

  useEffect(() => {
    const fetchExamSubmissionData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${
            import.meta.env.VITE_APP_API_URL
          }/exam-submission/get/${examSubmissionId}`,
        );
        setExamData(data || null);

        if (data) {
          const totalQuestions = data.examData?.length || 0;
          const totalMarks =
            totalQuestions *
            (data.examId.level === 1
              ? markData.level1Mark
              : data.examId.level === 2
                ? markData.level2Mark
                : data.examId.level === 3
                  ? markData.level3Mark
                  : data.examId.level === 4
                    ? markData.level4Mark
                    : markData.level1Mark);

          const scorePercentage = totalMarks
            ? ((data.obtainedMark / totalMarks) * 100).toFixed(1)
            : 0;

          setScoreData({
            totalQuestions,
            totalMarks,
            scorePercentage,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching exam submission data");
      } finally {
        setLoading(false);
      }
    };

    fetchExamSubmissionData();
  }, [examSubmissionId, markData]);

  useEffect(() => {
    if (!examData || !examData.examId || !scoreData.scorePercentage) return;

    const fetchReviewData = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/review/get-by-range`,
          {
            params: {
              subject: examData.examId.subject._id,
              subTopic: examData.examId.subTopic,
              level: examData.examId.level,
              percentage: scoreData.scorePercentage,
            },
          },
        );
        setGeneralReviews(data);
      } catch (error) {
        console.error("Error fetching review data:", error);
      }
    };

    fetchReviewData();
  }, [examData, scoreData.scorePercentage]);

  const handleOpenEditReviewPopup = (reviewId, message) => {
    setOpenEditReviewPopup(true);
    setEditReviewDetails({ reviewId, message });
  };

  const handleCloseEditReviewPopup = () => {
    setOpenEditReviewPopup(false);
    setEditReviewDetails({
      reviewId: "",
      message: "",
    });
  };

  const evaluateAnswer = (question) => {
    const { questionId, studentAnswer, correctAnswer } = question;
    const questionType = questionId?.questionType;

    const positiveMark = positiveMarkForLevel(examData.examId.level, markData);
    const negativeMark = negativeMarkForLevel(examData.examId.level, markData);

    if (questionType === "MCQ") {
      // MCQ: Full positive mark or negative mark (no partial marks)
      if (!studentAnswer || studentAnswer.trim() === "") {
        return 0;
      }

      const normalizedStudentAnswer = studentAnswer.toLowerCase().trim();

      if (Array.isArray(correctAnswer) && normalizedStudentAnswer) {
        const isCorrect = correctAnswer.some(
          (ans) => ans.toLowerCase().trim() === normalizedStudentAnswer,
        );

        return isCorrect ? positiveMark : -negativeMark;
      }

      return 0;
    }

    if (questionType === "Fill in the Blanks") {
      // Fill in the Blanks: Full positive mark or zero (no negative marks, no partial marks)
      if (!studentAnswer || studentAnswer.trim() === "") {
        return 0;
      }

      const normalizedStudentAnswer = studentAnswer
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "");

      if (Array.isArray(correctAnswer) && normalizedStudentAnswer) {
        const isCorrect = correctAnswer.some(
          (ans) =>
            ans.toLowerCase().trim().replace(/\s+/g, "") ===
            normalizedStudentAnswer,
        );

        return isCorrect ? positiveMark : 0;
      }

      return 0;
    }

    if (questionType === "MSQ") {
      // MSQ: Full positive mark or partial marks (no negative marks)
      if (!Array.isArray(studentAnswer) || studentAnswer.length === 0) {
        return 0;
      }

      if (!Array.isArray(correctAnswer)) return 0;

      const correctSet = new Set(correctAnswer.map((ans) => ans.toLowerCase()));
      const studentSet = new Set(studentAnswer.map((ans) => ans.toLowerCase()));

      // Count correct selections
      let correctSelections = 0;
      studentSet.forEach((ans) => {
        if (correctSet.has(ans)) {
          correctSelections++;
        }
      });

      // Check if there are any wrong selections
      const hasWrongSelections = [...studentSet].some(
        (ans) => !correctSet.has(ans),
      );

      if (!hasWrongSelections && correctSelections > 0) {
        // Partial marks: (correct selections / total correct answers) * positive mark
        return (correctSelections / correctAnswer.length) * positiveMark;
      }

      return 0;
    }

    if (questionType === "Short Answer") {
      // Short Answer: Partial marks based on keyword matches (no negative marks)
      if (!studentAnswer || studentAnswer.trim() === "") {
        return 0;
      }

      const keywords = correctAnswer || [];
      if (!Array.isArray(keywords)) return 0;

      const normalizedStudentAnswer = studentAnswer.toLowerCase().trim();
      const matches = keywords.filter((keyword) =>
        normalizedStudentAnswer.includes(keyword.toLowerCase().trim()),
      ).length;

      if (matches > 0) {
        // Partial marks: (matched keywords / total keywords) * positive mark
        return (matches / keywords.length) * positiveMark;
      }

      return 0;
    }

    return 0;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading exam results...</div>;
  }

  if (!examData) {
    return <div className="p-6 text-center">No exam data available</div>;
  }

  const handleAddcomment = async (e) => {
    e.preventDefault();

    if (userData.role !== "evaluator" && userData.role !== "admin") {
      return toast.error("Only Evaluator or Admin can add a review");
    }
    if (reviewInput.trim() === "") {
      return toast.error("The review message cannot be empty");
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/exam-submission/add-comment`,
        { examSubmissionId, userId: userData._id, message: reviewInput },
      );

      if (response.data.success) {
        toast.success("Comment added");
        setExamData(response.data.examSubmission);
        setReviewInput("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error adding the comment");
    }
  };

  const handleEditReviewMessage = async (e) => {
    e.preventDefault();
    if (userData.role !== "evaluator" && userData.role !== "admin") {
      return toast.error("Only Evaluator or Admin can add a review");
    }
    if (editReviewDetails.message.trim() === "") {
      return toast.error("The review message cannot be empty");
    }

    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/exam-submission/comment/update/${
          examData._id
        }/${editReviewDetails.reviewId}`,
        { message: editReviewDetails.message },
      );
      if (data.success) {
        toast.success("Successfully Updated");
        setExamData(data.examSubmission);
        handleCloseEditReviewPopup();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating the Comment");
    }
  };

  const handleDeleteReviewMessage = async (e, examId, reviewId) => {
    e.preventDefault();

    try {
      const { data } = await axios.delete(
        `${
          import.meta.env.VITE_APP_API_URL
        }/exam-submission/comment/delete/${examId}/${reviewId}`,
      );
      if (data.success) {
        toast.success("Successfully deleted");
        setExamData(data.examSubmission);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      <Navbar />
      <main className="container mx-auto px-4 py-4 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 py-1 px-3 rounded-lg font-medium text-sm bg-white text-indigo-600 hover:text-indigo-700 hover:bg-transparent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Activities</span>
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 mb-8 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${
              examData.attemptNumber <= 3
                ? "from-amber-100 to-amber-50"
                : examData.attemptNumber >= 4 && examData.attemptNumber <= 6
                  ? "from-amber-200 to-amber-50"
                  : examData.attemptNumber >= 7 && examData.attemptNumber <= 10
                    ? "from-amber-200 to-amber-100"
                    : "from-amber-300 to-amber-100"
            } p-6`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-amber-600 bg-white px-2 py-0.5 rounded-full">
                    {userData.role === "student"
                      ? `Attempt #${examData.attemptNumber}`
                      : "Review Exam"}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      examData.pass
                        ? "text-green-600 bg-white"
                        : "text-red-600 bg-white"
                    } px-2 py-0.5 rounded-full`}
                  >
                    {examData.pass ? "Passed" : "Failed"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 capitalize">
                  {examData.examId.subject?.name}: {examData.examId.subTopicName}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>Code: {examData.examId.examCode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>Level {examData.examId.level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>Attempted on {formatDate(examData.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Time taken to complete:{" "}
                      {formatDuration(examData?.timetaken)}
                    </span>
                  </div>
                </div>
              </div>
              {userData.role === "student" ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-white shadow-2xs flex items-center justify-center">
                    <div
                      className={`w-20 h-20 rounded-full ${
                        examData.pass ? "bg-green-600" : "bg-red-500"
                      } flex items-center justify-center text-white font-bold text-2xl`}
                    >
                      {scoreData.scorePercentage}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className=" text-sm font-medium text-stone-800">
                      <span className=" block">Your Score</span>
                      <span className="text-red-600 font-normal">
                        (Negative is applied for wrong answers)
                      </span>
                    </div>
                    <div className=" flex items-center gap-[10px]">
                      <div className="text-lg font-bold text-stone-800">
                        {examData.obtainedMark} / {scoreData.totalMarks}
                      </div>
                      <div
                        className={`text-sm ${
                          examData.pass ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <span className=" font-medium text-[15px]">
                          {examData.pass ? "Passed" : "Failed"}
                        </span>{" "}
                        (Required: {examData.examId.passPercentage}%)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {examData.userId.username}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{examData.userId.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>Attempt:</span>
                      <span className="font-medium">
                        #{examData.attemptNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>Score:</span>
                      <span
                        className={`font-medium ${
                          examData.pass ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {scoreData.scorePercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-6 mb-8">
          <div className="md:col-span-8 flex flex-col gap-5 bg-white rounded-xl shadow-2xs border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {userData.role === "student"
                  ? "Instructor Feedback"
                  : "Provide Feedback"}
              </h2>
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-4">
              {examData.reviews && examData.reviews.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Previous Reviews:
                  </h3>
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {examData.reviews.map((review) => (
                      <div key={review._id} className="bg-white p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-indigo-500" />
                            </div>
                            <span className="text-sm font-semibold">
                              {review.evaluator.username}
                            </span>
                          </div>
                          <div className=" flex items-center gap-4">
                            <span className="text-xs text-white font-semibold bg-indigo-500 rounded py-0.5 px-2">
                              {formatDate(review.createdAt)}
                            </span>
                            {review.evaluator._id === userData._id && (
                              <div className="flex gap-2 transition-opacity duration-300">
                                <button
                                  onClick={() =>
                                    handleOpenEditReviewPopup(
                                      review._id,
                                      review.message,
                                    )
                                  }
                                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md p-1 transition-colors cursor-pointer"
                                  title="Edit Review"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleDeleteReviewMessage(
                                      e,
                                      examData._id,
                                      review._id,
                                    )
                                  }
                                  className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md p-1 transition-colors cursor-pointer"
                                  title="Delete Review"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className=" text-stone-600 pl-8 leading-relaxed">
                          {review.message}
                        </p>
                      </div>
                    ))}
                    {generalReviews.length > 0 &&
                      generalReviews.map((review, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg ">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">
                                  {review.evaluator.username}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-white font-semibold bg-indigo-500 rounded py-0.5 px-2">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className=" text-stone-600 pl-8 leading-relaxed">
                            {review.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {userData.role === "evaluator" && (
                <>
                  <div>
                    <label
                      htmlFor="feedback"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Add New Feedback
                    </label>
                    <textarea
                      id="feedback"
                      rows={6}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none"
                      placeholder="Provide constructive feedback to the student..."
                      value={reviewInput}
                      onChange={(e) => setReviewInput(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>
                      This feedback will be visible to the student along with
                      previous reviews.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={handleAddcomment}
                      disabled={!reviewInput.trim()}
                      className={`px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-1 ${
                        reviewInput.trim()
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Exam Questions
          </h2>
          <div className="space-y-6">
            {examData.examData?.map((question, index) => {
              const isStudentAnswerCorrect = question.isRight;
              const evaluationScore = evaluateAnswer(question);

              return (
                <div
                  key={question._id || index}
                  className={`rounded-xl border ${
                    isStudentAnswerCorrect === "Correct"
                      ? "border-green-100"
                      : isStudentAnswerCorrect === "Partially Correct"
                        ? " border-yellow-100"
                        : isStudentAnswerCorrect === "Incorrect"
                          ? "border-red-100"
                          : "border-gray-100"
                  } overflow-hidden`}
                >
                  <div
                    className={`p-4 flex items-center justify-between ${
                      isStudentAnswerCorrect === "Correct"
                        ? "bg-green-50"
                        : isStudentAnswerCorrect === "Partially Correct"
                          ? " bg-yellow-50"
                          : isStudentAnswerCorrect === "Incorrect"
                            ? "bg-red-50"
                            : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          isStudentAnswerCorrect === "Correct"
                            ? "bg-green-100"
                            : isStudentAnswerCorrect === "Partially Correct"
                              ? "bg-yellow-100"
                              : isStudentAnswerCorrect === "Incorrect"
                                ? "bg-red-100"
                                : "bg-gray-200"
                        } flex items-center justify-center`}
                      >
                        {isStudentAnswerCorrect === "Correct" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isStudentAnswerCorrect === "Partially Correct" ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : isStudentAnswerCorrect === "Incorrect" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <BadgeInfo className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            Question {index + 1}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 font-medium rounded-full ${
                              isStudentAnswerCorrect === "Correct"
                                ? "bg-green-100 text-green-700"
                                : isStudentAnswerCorrect === "Partially Correct"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : isStudentAnswerCorrect === "Incorrect"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {isStudentAnswerCorrect === "Partially Correct"
                              ? `Partially Correct (${Math.round(
                                  evaluationScore * 100,
                                )}%)`
                              : isStudentAnswerCorrect}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {question.questionId.questionType}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Question:
                      </div>
                      <p className="text-gray-900 mb-1.5">
                        {question.questionId.questionText.includes("^") ||
                        question.questionId.questionText.includes("\\") ? (
                          <InlineMath math={question.questionId.questionText} />
                        ) : (
                          question.questionId.questionText
                        )}
                      </p>
                      {question.questionId.image && (
                        <img
                          src={question.questionId.image}
                          className=" max-h-40 object-contain flex items-center justify-start"
                          alt=""
                        />
                      )}
                    </div>
                    {(question.questionId.questionType === "MCQ" ||
                      question.questionId.questionType === "MSQ") && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Options:
                        </div>
                        <div className="space-y-2">
                          {question.questionId.options.map(
                            (opt, optIndex) => {
                              const optionText = typeof opt === "object" && opt !== null ? opt.text : opt;
                              const optionImage = typeof opt === "object" && opt !== null ? opt.image : null;

                              const isSelected = Array.isArray(
                                question.studentAnswer,
                              )
                                ? question.studentAnswer.includes(optionText)
                                : question.studentAnswer === optionText;
                              const isCorrectOption = Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(optionText) : question.correctAnswer === optionText;

                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-start gap-2 p-2 rounded-lg ${
                                    isSelected && isCorrectOption
                                      ? "bg-green-50 border border-green-200"
                                      : isSelected && !isCorrectOption
                                        ? "bg-red-50 border border-red-200"
                                        : !isSelected && isCorrectOption
                                          ? "bg-indigo-50 border border-indigo-200"
                                          : "bg-gray-50 border border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                      isSelected && isCorrectOption
                                        ? "bg-green-100 text-green-600"
                                        : isSelected && !isCorrectOption
                                          ? "bg-red-100 text-red-600"
                                          : !isSelected && isCorrectOption
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {isSelected ? (
                                      isCorrectOption ? (
                                        <CheckCircle className="h-3 w-3" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )
                                    ) : isCorrectOption ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <span className="text-xs">
                                        {optIndex + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 w-full">
                                    <span className="text-sm text-gray-800">
                                      {optionText.includes("^") ||
                                      optionText.includes("\\") ? (
                                        <InlineMath math={optionText} />
                                      ) : (
                                        optionText
                                      )}
                                    </span>
                                    {optionImage && (
                                      <img src={optionImage} alt="Option image" className="max-h-24 object-contain rounded-md" />
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                    {(question.questionId.questionType ===
                      "Fill in the Blanks" ||
                      question.questionId.questionType === "Short Answer") && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {userData.role === "student"
                              ? "Your Answer:"
                              : "Student's Answer:"}
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">
                              {Array.isArray(question.studentAnswer)
                                ? question.studentAnswer.join(", ")
                                : question.studentAnswer ||
                                  "No answer provided"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {question.questionId.questionType === "Short Answer"
                              ? "Expected Keywords:"
                              : "Correct Answer:"}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(question.correctAnswer)
                              ? question.correctAnswer
                              : [question.correctAnswer]
                            ).map((answer, ansIndex) => (
                              <span
                                key={ansIndex}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm border border-indigo-100"
                              >
                                {answer}
                              </span>
                            ))}
                          </div>
                        </div>
                        {question.questionId.questionType ===
                          "Short Answer" && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>
                              Note: Partial marks are awarded based on the
                              number of matching keywords.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(question.questionId.answerKeyText || question.questionId.answerKeyImage) && (
                      <div className="mt-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="text-sm font-semibold text-indigo-800 mb-2">Answer Explanation</div>
                        {question.questionId.answerKeyText && (
                          <div className="text-sm text-gray-700 mb-3 answer-key-rich-text" dangerouslySetInnerHTML={{ __html: question.questionId.answerKeyText }} />
                        )}
                        {question.questionId.answerKeyImage && (
                          <img src={question.questionId.answerKeyImage} alt="Answer Explanation" className="max-h-48 object-contain rounded border border-gray-200 bg-white p-1" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {userData.role === "evaluator" && (
          <Dialog
            open={openEditReviewPopup}
            onClose={handleCloseEditReviewPopup}
          >
            <div className=" flex flex-col gap-6 sm:min-w-[500px] p-5 ">
              <div className=" flex items-start justify-between gap-6 w-full">
                <div className=" flex flex-col gap-1">
                  <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                    Edit Comment
                  </h1>
                  <p className=" text-sm text-stone-500 font-work-sans">
                    Are you sure you want to Edit this comment ?
                  </p>
                </div>
                <MdClose
                  onClick={handleCloseEditReviewPopup}
                  className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
                />
              </div>
              <textarea
                name=""
                id=""
                placeholder="Add a Comment"
                value={editReviewDetails.message || ""}
                onChange={(e) =>
                  setEditReviewDetails((prevValue) => ({
                    ...prevValue,
                    message: e.target.value,
                  }))
                }
                className=" border border-stone-300 text-stone-600 focus:outline-none rounded font-medium py-2 px-3"
              ></textarea>
              <div className=" grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleCloseEditReviewPopup}
                  className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditReviewMessage}
                  className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 text-center"
                >
                  Edit
                </button>
              </div>
            </div>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default AttemptedExamSubmissionDetail;
