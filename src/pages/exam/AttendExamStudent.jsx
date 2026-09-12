import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { AuthContext } from "../../context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Award,
  BarChart3,
  FileText,
  Brain,
  Zap,
  Tag,
  Layers,
  CheckSquare,
  Square,
  Send,
  User,
  Hash,
  Flag,
  Info,
  ArrowLeft,
  Sparkles,
  Calculator,
  Save, // Added Save icon (optional, or just reuse CheckSquare)
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import EligibilityPopup from "../../components/common/popup/EligibilityPopup";
import CalculatorComponent from "../../components/calculator/CalculatorComponent";
import TimerDisplay from "../../components/exam/TimerDisplay";
import { MarkContext } from "../../context/MarkContext";
import { DurationContext } from "../../context/DurationContext";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // swap
  }
  return shuffled;
};

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const AttendExamStudent = () => {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const { durationData } = useContext(DurationContext);
  const { markData } = useContext(MarkContext);

  const [examData, setExamData] = useState(null);
  const [submissionId, setSubmissionId] = useState(null); // Added submissionId state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isEligible, setIsEligible] = useState(true);
  const [openEligibilityPopup, setOpenEligibilityPopup] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [questionStatus, setQuestionStatus] = useState([]);

  // Resolve a question's own marks/negativeMark first (admin can override
  // them individually per question); fall back to the level-based config
  // exactly like the backend resolver, so display always matches grading.
  const getMarksForQuestion = useCallback(
    (question) => {
      const level = question?.level;
      const fallback = (() => {
        switch (level) {
          case 1:
            return {
              marks: markData.level1Mark,
              negative: markData.level1NegativeMark,
            };
          case 2:
            return {
              marks: markData.level2Mark,
              negative: markData.level2NegativeMark,
            };
          case 3:
            return {
              marks: markData.level3Mark,
              negative: markData.level3NegativeMark,
            };
          case 4:
            return {
              marks: markData.level4Mark,
              negative: markData.level4NegativeMark,
            };
          default:
            return {
              marks: markData.level1Mark,
              negative: markData.level1NegativeMark,
            };
        }
      })();

      return {
        marks: question?.marks ?? fallback.marks,
        negative: question?.negativeMark ?? fallback.negative,
      };
    },
    [markData],
  );

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const userId = userData?._id;
        const { data } = await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/exam-function/attend-exam`,
          { userId: userId || userData?._id, examCode },
        );
        if (data.success) {
          if (data.exam.shuffleQuestion === true) {
            data.exam.questions = shuffleArray(data.exam.questions);
          }
          setExamData(data.exam);
          setSubmissionId(data.submissionId); // Store submissionId

          // Trust the server-computed total (sum of each question's own
          // resolved duration); only fall back to a client-side sum in the
          // unexpected case it's missing, using the same per-question
          // resolution logic as the backend.
          const totalDuration =
            data.serverDuration ||
            data.exam.questions.reduce((sum, q) => {
              const fallback = durationData?.[`level${q.level}Duration`] || 3600;
              return sum + (q.duration ?? fallback);
            }, 0);
          setTotalTime(totalDuration);

          // Canonical Timer Logic: Sync with Server Start Time
          if (data.startTime) {
            const startTimeMillis = new Date(data.startTime).getTime();
            const elapsedSeconds = Math.floor(
              (Date.now() - startTimeMillis) / 1000,
            );
            const remainingSeconds = Math.max(
              0,
              totalDuration - elapsedSeconds,
            );
            setTimeLeft(remainingSeconds);
          } else {
            // Fallback (should not happen with new backend)
            setTimeLeft(totalDuration);
          }

          const initialAnswers = data.exam.questions.map((q) => ({
            questionId: q._id,
            studentAnswer: q.questionType === "MSQ" ? [] : "",
            isVisited: false,
            isAnswered: false,
            isMarkedForReview: false,
          }));

          // Restore answers from localStorage if available
          const savedAnswers = localStorage.getItem(
            `exam_answers_${data.submissionId}`,
          );
          if (savedAnswers) {
            try {
              const parsed = JSON.parse(savedAnswers);
              // Basic structural validation could go here
              if (parsed.length === initialAnswers.length) {
                setAnswers(parsed);
              } else {
                setAnswers(initialAnswers);
              }
            } catch (e) {
              console.error("Failed to parse saved answers", e);
              setAnswers(initialAnswers);
            }
          } else {
            setAnswers(initialAnswers);
            const updatedStatus = [...initialAnswers];
            updatedStatus[0].isVisited = true;
            setAnswers(updatedStatus);
          }

          setQuestionStatus(
            data.exam.questions.map(() => ({
              isVisited: false,
              isAnswered: false,
              isMarkedForReview: false,
            })),
          );
        } else {
          setIsEligible(false);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchExamDetails();
  }, [examCode]);

  useEffect(() => {
    if (timeLeft > 0 && isEligible && !openEligibilityPopup) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (
      timeLeft === 0 &&
      examData &&
      !openEligibilityPopup &&
      totalTime > 0
    ) {
      handleSubmitExam();
    }
  }, [timeLeft, isEligible, openEligibilityPopup, examData]);

  const goToQuestion = useCallback((index) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[index].isVisited = true;
      return updated;
    });
    setCurrentQuestionIndex(index);
  }, []);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < (examData?.questions?.length || 0) - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, examData, goToQuestion]);

  const goToPrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, goToQuestion]);

  const handleAnswerChange = useCallback(
    (value) => {
      setAnswers((prev) => {
        const updatedAnswers = [...prev];
        const currentQuestion = examData.questions[currentQuestionIndex];

        if (currentQuestion.questionType === "MCQ") {
          if (updatedAnswers[currentQuestionIndex].studentAnswer === value) {
            updatedAnswers[currentQuestionIndex].studentAnswer = "";
            updatedAnswers[currentQuestionIndex].isAnswered = false;
          } else {
            updatedAnswers[currentQuestionIndex].studentAnswer = value;
            updatedAnswers[currentQuestionIndex].isAnswered = true;
          }
        } else if (currentQuestion.questionType === "MSQ") {
          const currentAnswers =
            updatedAnswers[currentQuestionIndex].studentAnswer || [];

          if (currentAnswers.includes(value)) {
            updatedAnswers[currentQuestionIndex].studentAnswer =
              currentAnswers.filter((a) => a !== value);
          } else {
            updatedAnswers[currentQuestionIndex].studentAnswer = [
              ...currentAnswers,
              value,
            ];
          }

          updatedAnswers[currentQuestionIndex].isAnswered =
            updatedAnswers[currentQuestionIndex].studentAnswer.length > 0;
        } else {
          updatedAnswers[currentQuestionIndex].studentAnswer = value;
          updatedAnswers[currentQuestionIndex].isAnswered = value.trim() !== "";
        }

        return updatedAnswers;
      });
    },
    [currentQuestionIndex, examData],
  );

  const toggleMarkForReview = useCallback(() => {
    setAnswers((prev) => {
      const updatedAnswers = [...prev];
      updatedAnswers[currentQuestionIndex].isMarkedForReview =
        !updatedAnswers[currentQuestionIndex].isMarkedForReview;
      return updatedAnswers;
    });
  }, [currentQuestionIndex]);

  const handleSubmitExam = async (e = null) => {
    if (e) e.preventDefault();

    try {
      const timeTakenInSeconds = Math.max(0, totalTime - timeLeft);

      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/exam-submission/submit`,
        {
          submissionData: {
            userId: userData?._id,
            examId: examData._id,
            examData: answers,
            timetaken: timeTakenInSeconds,
          },
        },
      );
      if (response.data) {
        toast.success("Exam submitted successfully!");
        navigate("/activities");
      }
    } catch (error) {
      toast.error(
        error.response.data.message ||
          "Failed to submit exam. Please try again.",
      );
    } finally {
      if (submissionId) localStorage.removeItem(`exam_answers_${submissionId}`); // Clean up
      exitFullscreen();
    }
  };

  // Persist answers effect
  useEffect(() => {
    if (submissionId && answers.length > 0) {
      localStorage.setItem(
        `exam_answers_${submissionId}`,
        JSON.stringify(answers),
      );
    }
  }, [answers, submissionId]);

  // Memoize stats calculation - only recalculate when answers change
  const stats = useMemo(() => {
    if (!answers.length)
      return { answered: 0, notAnswered: 0, notVisited: 0, markedForReview: 0 };

    return {
      answered: answers.filter((a) => a.isAnswered).length,
      notAnswered: answers.filter((a) => a.isVisited && !a.isAnswered).length,
      notVisited: answers.filter((a) => !a.isVisited).length,
      markedForReview: answers.filter((a) => a.isMarkedForReview).length,
    };
  }, [answers]);

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2.5"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const { marks, negative } = getMarksForQuestion(currentQuestion);

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <header className=" px-2 py-3 w-full bg-white border-b border-gray-100 rounded-xl shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link
                to="/activities"
                onClick={exitFullscreen}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-[#f9f9f9] rounded py-1 px-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Exit Exam</span>
              </Link>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 lg:gap-6">
              <button
                onClick={() => setIsCalculatorDialogOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="h-4 w-4" />
                Open Calculator
              </button>
              <div className="flex items-center gap-2 bg-[#f9f9f9] py-1 px-2 rounded">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {examData.examCode}
                </span>
              </div>
              <TimerDisplay timeLeft={timeLeft} />
              <button
                onClick={() => setIsSubmitDialogOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize font-poppins">
                      {examData.subjectName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-inter">
                      <Tag className="h-3 w-3" />
                      <span className="capitalize">
                        {examData.subtopicName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 font-inter">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Order</div>
                    <div className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-gray-700" />
                      <span className="text-sm font-medium text-gray-800">
                        {examData.order}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Questions</div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-gray-700" />
                      <span className="text-sm font-medium text-gray-800">
                        {examData.questions.length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">User</div>
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-gray-700" />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {userData.username}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Pass %</div>
                    <div className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-gray-700" />
                      <span className="text-sm font-medium text-gray-800">
                        {examData.passPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg font-inter">
                  <div className="text-xs font-medium text-blue-700 mb-2">
                    Current Question
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {currentQuestionIndex + 1}
                      </div>
                      <span className="text-sm font-medium text-blue-800">
                        {currentQuestion.questionType}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {marks} {marks === 1 ? "mark" : "marks"}
                    </div>
                  </div>
                  {negative > 0 && currentQuestion.questionType === "MCQ" && (
                    <div className="text-xs text-red-500 mt-1">
                      Negative: -{negative} marks
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 font-inter">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Question Navigator
                  </h4>
                  <div className="text-xs text-gray-500">
                    {currentQuestionIndex + 1} of {examData.questions.length}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {examData.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-full h-9 rounded-md flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                        index === currentQuestionIndex
                          ? "bg-blue-600 text-white"
                          : answers[index]?.isMarkedForReview
                            ? "bg-purple-200 text-purple-700 border border-purple-400"
                            : answers[index]?.isAnswered
                              ? "bg-green-200 text-green-700 border border-green-400"
                              : answers[index]?.isVisited
                                ? "bg-amber-200 text-amber-700 border border-amber-400"
                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-sm bg-green-200 border border-green-400"></div>
                    <span className="text-gray-700">
                      Answered ({stats.answered})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-sm bg-amber-200 border border-amber-400"></div>
                    <span className="text-gray-700">
                      Not Answered ({stats.notAnswered})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-sm bg-gray-100 border border-gray-200"></div>
                    <span className="text-gray-700">
                      Not Visited ({stats.notVisited})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-sm bg-purple-200 border border-purple-400"></div>
                    <span className="text-gray-700">
                      Marked for Review ({stats.markedForReview})
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleMarkForReview}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    answers[currentQuestionIndex]?.isMarkedForReview
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-purple-400 text-purple-700 hover:bg-purple-50"
                  } flex items-center justify-center gap-1.5 mb-3`}
                >
                  <Flag className="h-4 w-4" />
                  {answers[currentQuestionIndex]?.isMarkedForReview
                    ? "Remove Review Flag"
                    : "Mark for Review"}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      currentQuestionIndex === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    } flex items-center justify-center gap-1`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    onClick={goToNextQuestion}
                    disabled={
                      currentQuestionIndex === examData.questions.length - 1
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      currentQuestionIndex === examData.questions.length - 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    } flex items-center justify-center gap-1`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-9 font-poppins">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentQuestion.questionType === "MCQ"
                      ? "bg-blue-50 text-blue-600"
                      : currentQuestion.questionType === "MSQ"
                        ? "bg-purple-50 text-purple-600"
                        : currentQuestion.questionType === "Fill in the Blanks"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-teal-50 text-teal-600"
                  }`}
                >
                  {currentQuestion.questionType}
                </div>

                <div className="text-xs text-gray-500">
                  Question {currentQuestionIndex + 1} of{" "}
                  {examData.questions.length}
                </div>
                {currentQuestion.questionType === "MCQ" && (
                  <div className="ml-auto text-xs font-medium text-gray-700">
                    {marks} {marks === 1 ? "mark" : "marks"}
                    {negative > 0 && (
                      <span className="text-red-500 ml-1">(-{negative})</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2 font-inter leading-relaxed">
                  {currentQuestion.questionText.includes("^") ||
                  currentQuestion.questionText.includes("\\") ? (
                    <InlineMath math={currentQuestion.questionText} />
                  ) : (
                    currentQuestion.questionText
                  )}
                </h2>
                {currentQuestion.image && (
                  <img
                    src={currentQuestion.image}
                    className=" max-h-40 object-contain flex items-center justify-start"
                    alt=""
                  />
                )}

                {currentQuestion.questionType === "MSQ" && (
                  <p className="text-sm text-gray-500 italic">
                    Select all that apply.
                  </p>
                )}
                {currentQuestion.questionType === "Fill in the Blanks" && (
                  <p className="text-sm text-gray-500 italic">
                    Fill in the blank with the appropriate word or phrase.
                  </p>
                )}
                {currentQuestion.questionType === "Short Answer" && (
                  <p className="text-sm text-gray-500 italic">
                    Provide a brief answer to the question.
                  </p>
                )}
              </div>
              <div className="space-y-4 font-rubik">
                {currentQuestion.questionType === "MCQ" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, index) => {
                      const optionText = typeof opt === "object" && opt !== null ? opt.text : opt;
                      const optionImage = typeof opt === "object" && opt !== null ? opt.image : null;
                      return (
                      <div
                        key={index}
                        onClick={() => handleAnswerChange(optionText)}
                        className={`p-4 rounded-xl border ${
                          answers[currentQuestionIndex]?.studentAnswer ===
                          optionText
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
                        } cursor-pointer transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              answers[currentQuestionIndex]?.studentAnswer ===
                              optionText
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="text-gray-800">
                              {optionText.includes("^") || optionText.includes("\\") ? (
                                <InlineMath math={optionText} />
                              ) : (
                                optionText
                              )}
                            </div>
                            {optionImage && (
                              <img src={optionImage} alt={`Option ${index + 1}`} className="max-h-24 rounded-md object-contain" />
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
                {currentQuestion.questionType === "MSQ" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, index) => {
                      const optionText = typeof opt === "object" && opt !== null ? opt.text : opt;
                      const optionImage = typeof opt === "object" && opt !== null ? opt.image : null;
                      return (
                      <div
                        key={index}
                        onClick={() => handleAnswerChange(optionText)}
                        className={`p-4 rounded-xl border ${
                          answers[
                            currentQuestionIndex
                          ]?.studentAnswer?.includes(optionText)
                            ? "border-purple-400 bg-purple-50"
                            : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"
                        } cursor-pointer transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {answers[
                              currentQuestionIndex
                            ]?.studentAnswer?.includes(optionText) ? (
                              <CheckSquare className="h-5 w-5 text-purple-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="text-gray-800">
                              {optionText.includes("^") || optionText.includes("\\") ? (
                                <InlineMath math={optionText} />
                              ) : (
                                optionText
                              )}
                            </div>
                            {optionImage && (
                              <img src={optionImage} alt={`Option ${index + 1}`} className="max-h-24 rounded-md object-contain" />
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
                {currentQuestion.questionType === "Fill in the Blanks" && (
                  <div className="max-w-2xl">
                    <input
                      type="text"
                      value={answers[currentQuestionIndex]?.studentAnswer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                )}
                {currentQuestion.questionType === "Short Answer" && (
                  <div className="max-w-3xl">
                    <textarea
                      value={answers[currentQuestionIndex]?.studentAnswer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={5}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none"
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={goToPrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    currentQuestionIndex === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  } flex items-center justify-center gap-1`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  onClick={goToNextQuestion}
                  disabled={
                    currentQuestionIndex === examData.questions.length - 1
                  }
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    currentQuestionIndex === examData.questions.length - 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  } flex items-center justify-center gap-1`}
                >
                  {currentQuestionIndex === examData.questions.length - 1
                    ? "Finish"
                    : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {openEligibilityPopup && (
        <EligibilityPopup
          subjectName={examData.subjectName}
          subtopicName={examData.subtopicName}
          totalDurationSeconds={totalTime}
          passPercentage={examData.passPercentage}
          questionLength={examData.questions.length}
          setOpenEligibilityPopup={setOpenEligibilityPopup}
        />
      )}

      {isSubmitDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 mx-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 font-poppins">
              Submit Exam?
            </h3>
            <div className="text-gray-600 mb-6">
              <p className="mb-4 font-inter">
                Are you sure you want to submit your exam? You still have{" "}
                {formatTime(timeLeft)} remaining.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4 font-rubik">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Answered: {stats.answered}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Not Answered: {stats.notAnswered}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span>Not Visited: {stats.notVisited}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Marked: {stats.markedForReview}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-red-600 font-medium font-inter">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-between font-inter">
              <button
                onClick={() => setIsSubmitDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
      {isCalculatorDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 min-w-xl">
            <CalculatorComponent
              setIsCalculatorDialogOpen={setIsCalculatorDialogOpen}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendExamStudent;
