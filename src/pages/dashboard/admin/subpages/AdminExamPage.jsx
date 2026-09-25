import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  BiBook,
  BiCheckCircle,
  BiXCircle,
  BiEdit,
  BiTrash,
  BiTimeFive,
  BiTrophy,
  BiShow,
  BiRightArrowAlt,
} from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { Dialog, Autocomplete, TextField } from "@mui/material";
import { DurationContext } from "../../../../context/DurationContext";

const AdminExamPage = () => {
  const { durationData } = useContext(DurationContext);
  const [allExams, setAllExams] = useState([]);
  const [openDeletePopup, setOpenDeletePopup] = useState(false);
  const [deletionExamId, setDeletionExamId] = useState("");

  // Subject-wise / Exam-wise quick-search filters for the exam cards grid
  // below — MUI Autocomplete gives type-to-search filtering for free.
  // Values are {label, value} option objects, or null for "All".
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [examFilter, setExamFilter] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/exams/getAll`
      );
      setAllExams(data);
    } catch (error) {
      console.error("Fetch Exams Error:", error);
      toast.error(error?.response?.data?.message || "Could not load exams.");
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleOpenDeleteDialog = (examId) => {
    setDeletionExamId(examId);
    setOpenDeletePopup(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeletePopup(false);
    setDeletionExamId("");
  };

  // Preprocess exam data
  const processedExams = useMemo(() => {
    return allExams.length > 0
      ? allExams.map((exam) => {
          const questionTypeCount = {};
          let totalQuestions = 0;
          exam.questions?.forEach(({ questionType }) => {
            questionTypeCount[questionType] =
              (questionTypeCount[questionType] || 0) + 1;
            totalQuestions++;
          });
          return { ...exam, questionTypeCount, totalQuestions };
        })
      : [];
  }, [allExams]);

  // Get total exam duration by summing each question's own duration
  // override, falling back to the level-based config (mirrors the backend
  // resolver — an exam no longer has one uniform level/duration).
  const getExamDuration = (questions = []) =>
    questions.reduce((sum, q) => {
      const fallback = durationData?.[`level${q.level}Duration`] || 3600;
      return sum + (q.duration ?? fallback);
    }, 0);

  // One option per distinct subject name currently on screen.
  const subjectOptions = useMemo(() => {
    const seen = new Map();
    processedExams.forEach((exam) => {
      if (exam.subject && !seen.has(exam.subject)) {
        seen.set(exam.subject, { label: exam.subject, value: exam.subject });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [processedExams]);

  // Exam options narrow to the picked subject (if any), so the two
  // dropdowns work together rather than as two independent filters.
  const examOptions = useMemo(() => {
    return processedExams
      .filter((exam) => !subjectFilter || exam.subject === subjectFilter.value)
      .map((exam) => ({
        label: `${exam.subject}${exam.subTopic ? ` - ${exam.subTopic}` : ""} - ${
          exam.examCode
        } (Order ${exam.order})`,
        value: exam._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [processedExams, subjectFilter]);

  const filteredExams = useMemo(() => {
    return processedExams.filter((exam) => {
      if (subjectFilter && exam.subject !== subjectFilter.value) return false;
      if (examFilter && exam._id !== examFilter.value) return false;
      return true;
    });
  }, [processedExams, subjectFilter, examFilter]);

  const handleDeleteExam = async (e) => {
    e.preventDefault();

    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_URL}/exams/delete/${deletionExamId}`
      );
      toast.success("Exam Deleted Successfully!");
      const updatedExams = allExams.filter(
        (exam) => exam._id !== deletionExamId
      );
      setAllExams(updatedExams);
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error(error?.response?.data?.message || "Failed to delete exam.");
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleChangeShuffle = async (id, shuffleValue) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/exams/update/shuffle/${id}`
      );
      const updatedExams = allExams.map((exam) =>
        exam._id === id ? { ...exam, shuffleQuestion: !shuffleValue } : exam
      );
      setAllExams(updatedExams);
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error(error?.response?.data?.message || "Failed to delete exam.");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-20 font-inter">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-stone-700 font-bold font-poppins">
            Exam
          </h1>
          <p className="text-stone-400 font-medium">
            Manage exams and questions effortlessly. Create, edit, delete, and
            view exams, define questions, and set their types to organize exam
            content efficiently.
          </p>
        </div>
        <Link
          to="/dashboard/exam/create-exam"
          className="text-nowrap bg-indigo-600 hover:bg-indigo-500 text-stone-50 font-medium py-2 px-5 rounded-4xl font-poppins cursor-pointer hover:opacity-85 duration-300"
        >
          Create Exam
        </Link>
      </div>

      {/* Subject-wise / Exam-wise quick search — type to filter either
          dropdown's options instantly; picking a subject also narrows the
          exam options to that subject. */}
      <div className="flex items-center gap-3 flex-wrap">
        <Autocomplete
          size="small"
          options={subjectOptions}
          value={subjectFilter}
          onChange={(_, newValue) => {
            setSubjectFilter(newValue);
            setExamFilter(null);
          }}
          isOptionEqualToValue={(opt, val) => opt.value === val.value}
          sx={{ width: 220, bgcolor: "white" }}
          renderInput={(params) => (
            <TextField {...params} label="Subject-wise" placeholder="Search subject..." />
          )}
        />
        <Autocomplete
          size="small"
          options={examOptions}
          value={examFilter}
          onChange={(_, newValue) => setExamFilter(newValue)}
          isOptionEqualToValue={(opt, val) => opt.value === val.value}
          sx={{ width: 280, bgcolor: "white" }}
          renderInput={(params) => (
            <TextField {...params} label="Exam-wise" placeholder="Search exam..." />
          )}
        />
      </div>
      {filteredExams.length === 0 && (
        <p className="text-sm text-stone-500">No exams match the selected filter.</p>
      )}

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {filteredExams.map((exam, index) => {
          const {
            _id,
            subject,
            subTopic,
            examCode,
            status,
            questionTypeCount,
            order,
            totalQuestions,
          } = exam;
          const examDuration = getExamDuration(exam.questions);

          return (
            <div
              key={index}
              className="p-2 border border-stone-300 bg-white rounded-3xl flex flex-col gap-2"
            >
              <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white px-6 py-6 rounded-3xl">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <BiBook className="text-2xl mt-1 text-white" />
                      <h2 className="text-2xl font-bold">{subject}</h2>
                    </div>
                    <p className="text-indigo-100">{subTopic}</p>
                    <div className="flex gap-3">
                      <span className="px-3 py-1.5 text-xs text-white font-medium bg-white/10 rounded-md backdrop-blur-sm">
                        {examCode}
                      </span>
                      <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm flex items-center gap-2 ${
                          status === "active"
                            ? "bg-green-500/20 text-green-100"
                            : "bg-gray-500/20 text-gray-100"
                        }`}
                      >
                        {status === "active" ? (
                          <BiCheckCircle className="w-4 h-4" />
                        ) : (
                          <BiXCircle className="w-4 h-4" />
                        )}
                        {status === "active" ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      onClick={() =>
                        handleChangeShuffle(_id, exam.shuffleQuestion)
                      }
                      className={`p-[10px] text-sm font-medium ${
                        exam.shuffleQuestion === true
                          ? " bg-white/80 text-stone-600"
                          : "bg-white/10"
                      }  rounded-lg hover:bg-white/20 transition-colors cursor-pointer`}
                    >
                      {exam.shuffleQuestion === true ? "Un-Shuffle" : "Shuffle"}
                    </div>
                    <Link
                      to={`/dashboard/exam/create-exam?subjectId=${exam.subjectId}&subTopicId=${exam.subTopicId}&examId=${exam._id}`}
                      className="p-[10px] bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <BiEdit className="text-xl" />
                    </Link>
                    <button
                      onClick={() => handleOpenDeleteDialog(_id)}
                      className="p-[10px] bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <BiTrash className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Distribution */}
              <div className="flex justify-between items-center gap-5">
                <div className="bg-white rounded-3xl p-3 w-full">
                  <h3 className="text-lg font-semibold mb-4 text-stone-700">
                    Question Distribution
                  </h3>
                  <div className="space-y-4 text-stone-600">
                    {["MCQ", "MSQ", "Fill in the Blanks", "Short Answer"].map(
                      (type) => (
                        <div key={type} className="relative">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{type}</span>
                            <span className="font-medium">
                              {questionTypeCount[type] || 0}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${
                                  ((questionTypeCount[type] || 0) /
                                    totalQuestions) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Exam Details */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className=" flex gap-3 items-center w-full bg-gradient-to-br bg-rose-400 text-white py-3 px-5 rounded-3xl">
                    <BiTimeFive className="text-2xl" />
                    <div>
                      <p className="text-orange-100 text-sm">Duration</p>
                      <p className="text-lg font-bold">{`${Math.floor(
                        examDuration / 60
                      )} min ${examDuration % 60} sec`}</p>
                    </div>
                  </div>
                  <div className=" flex gap-3 items-center w-full bg-gradient-to-br bg-emerald-400 text-white py-3 px-5 rounded-3xl">
                    <BiTrophy className="text-2xl" />
                    <div>
                      <p className="text-green-100 text-sm">Sequence</p>
                      <p className="text-lg font-bold">Order {order}</p>
                    </div>
                  </div>
                  <div
                    className=" w-full bg-indigo-500 text-white py-3 px-5 rounded-3xl transition-all group cursor-pointer"
                    onClick={() => handleViewQuestions(exam.examCode)}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <BiShow className=" text-2xl" />
                        <Link
                          to={`/dashboard/exam/view-questions/${_id}`}
                          className=" font-medium text-nowrap"
                        >
                          View All Questions
                        </Link>
                      </div>
                      <BiRightArrowAlt className=" text-2xl group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={openDeletePopup} onClose={handleCloseDeleteDialog}>
        <div className=" flex flex-col gap-6 sm:min-w-[500px] p-5 ">
          <div className=" flex items-start justify-between gap-6 w-full">
            <div className=" flex flex-col gap-1">
              <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
                Confirm Delete
              </h1>
              <p className=" text-sm text-stone-500 font-work-sans">
                Are you sure you want to delete this Exam?
              </p>
            </div>
            <MdClose
              onClick={handleCloseDeleteDialog}
              className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
            />
          </div>
          <div className=" grid grid-cols-2 gap-1.5">
            <button
              onClick={handleCloseDeleteDialog}
              className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteExam}
              className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminExamPage;
