import React, { useContext, useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import { MdClose, MdWarningAmber } from "react-icons/md";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../../context/AuthContext";
import { ExamContext } from "../../../context/ExamContext";

// Two destructive, irreversible admin actions, both requiring the same
// "pick the target, then confirm twice" flow — kept as one component since
// only the picker and the wording differ between "exam" mode and
// "student" mode.
//   mode "exam"    -> wipes every student's history for one exam (marks,
//                     submissions, attempt counters, pass records, answer
//                     sheets), leaving the exam itself untouched.
//   mode "student" -> wipes one student's history across every exam
//                     (same collections, plus attachment/video/live-class
//                     progress), leaving their account/profile/enrollment
//                     untouched.
const DeleteHistoryAdminPopup = ({ open, mode, onClose }) => {
  const { allUsersData } = useContext(AuthContext);
  const { subjects } = useContext(ExamContext);

  // step: "form" -> "confirm1" -> "confirm2"
  const [step, setStep] = useState("form");
  const [submitting, setSubmitting] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [subTopicId, setSubTopicId] = useState("");
  const [examId, setExamId] = useState("");
  const [examsForSubTopic, setExamsForSubTopic] = useState([]);

  const [userId, setUserId] = useState("");

  const resetAndClose = () => {
    setStep("form");
    setSubmitting(false);
    setSubjectId("");
    setSubTopicId("");
    setExamId("");
    setExamsForSubTopic([]);
    setUserId("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    // Reset whenever the popup is (re)opened for a fresh pick.
    setStep("form");
    setSubjectId("");
    setSubTopicId("");
    setExamId("");
    setUserId("");
  }, [open, mode]);

  useEffect(() => {
    if (mode !== "exam" || !subjectId || !subTopicId) {
      setExamsForSubTopic([]);
      return;
    }
    axios
      .get(`${import.meta.env.VITE_APP_API_URL}/exams/getAll`)
      .then(({ data }) => {
        const matching = (data || [])
          .filter(
            (exam) => exam.subjectId === subjectId && exam.subTopicId === subTopicId
          )
          .sort((a, b) => a.order - b.order);
        setExamsForSubTopic(matching);
      })
      .catch(() => setExamsForSubTopic([]));
  }, [mode, subjectId, subTopicId]);

  const selectedExam = examsForSubTopic.find((exam) => exam._id === examId);
  const selectedStudent = allUsersData?.find((user) => user._id === userId);

  const canProceedFromForm =
    mode === "exam" ? Boolean(subjectId && subTopicId && examId) : Boolean(userId);

  const targetLabel =
    mode === "exam"
      ? selectedExam
        ? `Order ${selectedExam.order} (${selectedExam.examCode})`
        : ""
      : selectedStudent
      ? `${selectedStudent.username} (${selectedStudent.email})`
      : "";

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      const endpoint =
        mode === "exam" ? "delete-exam-history" : "delete-student-history";
      const payload =
        mode === "exam" ? { examId, confirm: true } : { userId, confirm: true };

      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/data-deletion/${endpoint}`,
        payload
      );
      toast.success(response.data.message || "History deleted.");
      resetAndClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete history.");
      setSubmitting(false);
    }
  };

  const title =
    mode === "exam" ? "Delete Exam History" : "Delete Student History";

  return (
    <Dialog open={open} onClose={submitting ? undefined : resetAndClose}>
      <div className=" flex flex-col gap-5 sm:min-w-[500px] p-5">
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              {title}
            </h1>
            {step === "form" && (
              <p className=" text-sm text-stone-500 font-work-sans">
                {mode === "exam" ? (
                  <>
                    Select the subject, sub-topic and exam. This deletes every
                    student's marks, submissions, attempt counters, pass
                    records, and uploaded answer sheets for this exam. The
                    exam itself is not deleted and stays attemptable.
                  </>
                ) : (
                  <>
                    Select the student. This deletes their entire activity
                    history — marks, submissions, attempt counters, pass
                    records, answer sheets, attachment views, video progress,
                    and attendance — across every exam. Their account,
                    profile, and enrollment are not touched.
                  </>
                )}
              </p>
            )}
          </div>
          {!submitting && (
            <MdClose
              onClick={resetAndClose}
              className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
            />
          )}
        </div>

        {step === "form" && (
          <>
            <div className=" flex flex-col gap-2 font-inter">
              {mode === "exam" ? (
                <>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setSubTopicId("");
                      setExamId("");
                    }}
                    className=" border border-stone-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={subTopicId}
                    onChange={(e) => {
                      setSubTopicId(e.target.value);
                      setExamId("");
                    }}
                    disabled={!subjectId}
                    className=" border border-stone-300 rounded-lg p-2 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sub-Topic</option>
                    {subjects
                      .find((subject) => subject._id === subjectId)
                      ?.subtopics.map((subtopic) => (
                        <option key={subtopic._id} value={subtopic._id}>
                          {subtopic.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    disabled={!subTopicId}
                    className=" border border-stone-300 rounded-lg p-2 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Exam</option>
                    {examsForSubTopic.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {`Order ${exam.order} (${exam.examCode})`}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className=" border border-stone-300 rounded-lg p-2 focus:outline-none"
                >
                  <option value="">Select Student</option>
                  {allUsersData
                    ?.filter((user) => user.role === "student")
                    ?.sort((a, b) => a?.username?.localeCompare(b?.username))
                    ?.map((user) => (
                      <option key={user._id} value={user._id}>
                        {`${user.username} (${user.email})`}
                      </option>
                    ))}
                </select>
              )}
            </div>
            <div className=" grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={resetAndClose}
                className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canProceedFromForm}
                onClick={() => setStep("confirm1")}
                className=" bg-red-500 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </>
        )}

        {(step === "confirm1" || step === "confirm2") && (
          <>
            <div className=" flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <MdWarningAmber className=" text-red-500 text-3xl flex-shrink-0" />
              <p className=" text-sm text-red-700 font-work-sans">
                {step === "confirm1" ? (
                  <>
                    Are you sure you want to delete all history for{" "}
                    <strong>{targetLabel}</strong>?
                  </>
                ) : (
                  <>
                    This cannot be undone. Every matching mark, submission,
                    and record will be permanently removed. Really delete{" "}
                    <strong>{targetLabel}</strong>'s history now?
                  </>
                )}
              </p>
            </div>
            <div className=" grid grid-cols-2 gap-1">
              <button
                type="button"
                disabled={submitting}
                onClick={() => (step === "confirm1" ? setStep("form") : setStep("confirm1"))}
                className=" border border-stone-400 text-stone-500 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  step === "confirm1" ? setStep("confirm2") : handleFinalConfirm()
                }
                className=" bg-red-600 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300 disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default DeleteHistoryAdminPopup;
