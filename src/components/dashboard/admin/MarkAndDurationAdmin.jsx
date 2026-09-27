import React, { useContext, useState } from "react";
import UpdateDurationAdminPopup from "../../common/popup/UpdateDurationAdminPopup";
import { DurationContext } from "../../../context/DurationContext";
import { MarkContext } from "../../../context/MarkContext";
import UpdateMarkAdminPopup from "../../common/popup/UpdateMarkAdminPopup";
import EditStudentExamPopup from "../../common/popup/EditStudentExamPopup";
import DeleteHistoryAdminPopup from "../../common/popup/DeleteHistoryAdminPopup";
import toast from "react-hot-toast";
import axios from "axios";

const MarkAndDurationAdmin = () => {
  const { handleOpenDurationPopup } = useContext(DurationContext);
  const { handleOpenMarkPopup } = useContext(MarkContext);

  const [studentExamUpdateData, setStudentExamUpdateData] = useState({
    userId: "",
    subjectId: "",
    subTopicId: "",
    examId: "",
    maxAllowedAttempts: "",
  });
  const [popupType, setPopupType] = useState("");

  const [studentExamUpdatePopup, setStudentExamUpdatePopup] = useState(false);

  // Delete-history popup (separate from the shared studentExamUpdate flow
  // above since this one drives its own two-step confirmation state).
  const [deleteHistoryPopup, setDeleteHistoryPopup] = useState(false);
  const [deleteHistoryMode, setDeleteHistoryMode] = useState("exam");
  const handleOpenDeleteHistoryPopup = (mode) => {
    setDeleteHistoryMode(mode);
    setDeleteHistoryPopup(true);
  };
  const handleCloseDeleteHistoryPopup = () => setDeleteHistoryPopup(false);

  // One-time (safely re-runnable) fix for Short Answer questions that
  // already state a numeric tolerance range in their answer explanation
  // (e.g. "1.10 (Range: 1.09 to 1.11)") but were created before Short
  // Answer supported structured range-mode grading, so in-range answers
  // were wrongly marked incorrect. Sets the range on every matching
  // question and re-grades every already-completed submission affected —
  // covers both previously-completed and future attempts in one click.
  const [backfillLoading, setBackfillLoading] = useState(false);
  const handleBackfillShortAnswerRanges = async () => {
    if (
      !window.confirm(
        "This scans every Short Answer question for a stated answer range (e.g. \"Range: 1.09 to 1.11\") that isn't yet set up for range grading, switches those questions to range mode, and re-grades every affected exam's already-completed submissions.\n\nThis cannot be undone automatically. Continue?"
      )
    ) {
      return;
    }
    setBackfillLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/exams/short-answer-range-backfill`
      );
      toast.success(response.data.message || "Backfill complete", {
        duration: 8000,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to backfill Short Answer range grading"
      );
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleOpenStudentExamUpdatePopup = (type) => {
    setStudentExamUpdatePopup(true);
    setPopupType(type);
  };
  const handleCloseStudentExamUpdatePopup = () => {
    setStudentExamUpdatePopup(false);
    setStudentExamUpdateData({
      userId: "",
      subjectId: "",
      subTopicId: "",
      examId: "",
      maxAllowedAttempts: "",
    });
    setPopupType("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (
        !studentExamUpdateData.userId ||
        !studentExamUpdateData.subjectId ||
        !studentExamUpdateData.subTopicId ||
        !studentExamUpdateData.examId
      ) {
        toast.error("Please fill all fields");
        return;
      }

      if (popupType === "grant-attempt") {
        if (!studentExamUpdateData.maxAllowedAttempts) {
          toast.error("Please enter the total number of attempts allowed");
          return;
        }
        const response = await axios.patch(
          `${import.meta.env.VITE_APP_API_URL}/exam-function/grant-extra-attempt`,
          {
            userId: studentExamUpdateData.userId,
            examId: studentExamUpdateData.examId,
            maxAllowedAttempts: studentExamUpdateData.maxAllowedAttempts,
          }
        );
        toast.success(response.data.message || "Attempt permission updated");
        handleCloseStudentExamUpdatePopup();
        return;
      }

      const endpoint =
        popupType === "manual pass"
          ? "manually-pass-exam"
          : popupType === "rewrite"
          ? "delete-passed-exam"
          : null;

      if (!endpoint) {
        toast.error("Invalid popup type");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/exam-function/${endpoint}`,
        studentExamUpdateData
      );
      toast.success(response.data.message || "Exam rewritten successfully");
      handleCloseStudentExamUpdatePopup();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update exam");
    }
  };

  return (
    <div>
      <div className=" flex flex-col gap-5">
        <div className="">
          <h1 className=" text-2xl font-semibold text-stone-700">
            Controllers
          </h1>
          <p className=" text-stone-500">
            Update exam duration/marks, rewrite a passed exam, or grant a
            student an extra attempt on an exam they've already used up. To
            create/edit/publish exams, manage subjects per category, or
            enable/disable a student account, use the Exam and Users pages.
          </p>
        </div>
        <div className=" flex items-center gap-3">
          <button
            onClick={handleOpenDurationPopup}
            className=" bg-indigo-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Update Duration
          </button>
          <button
            onClick={handleOpenMarkPopup}
            className=" bg-indigo-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Update Mark
          </button>
          <button
            onClick={() => handleOpenStudentExamUpdatePopup("manual pass")}
            className=" bg-indigo-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Pass any exam
          </button>
          <button
            onClick={() => handleOpenStudentExamUpdatePopup("rewrite")}
            className=" bg-indigo-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Rewrite passed exam
          </button>
          <button
            onClick={() => handleOpenStudentExamUpdatePopup("grant-attempt")}
            className=" bg-amber-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Grant Extra Attempt
          </button>
          <button
            onClick={() => handleOpenDeleteHistoryPopup("exam")}
            className=" bg-red-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Delete Exam History
          </button>
          <button
            onClick={() => handleOpenDeleteHistoryPopup("student")}
            className=" bg-red-500 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300"
          >
            Delete Student History
          </button>
          <button
            onClick={handleBackfillShortAnswerRanges}
            disabled={backfillLoading}
            className=" bg-emerald-600 font-medium text-white py-2 px-4 rounded-md cursor-pointer hover:opacity-85 duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {backfillLoading
              ? "Fixing Short Answer Ranges..."
              : "Fix Short Answer Ranges"}
          </button>
        </div>
      </div>

      <UpdateDurationAdminPopup />
      <UpdateMarkAdminPopup />
      <EditStudentExamPopup
        popupType={popupType}
        studentExamUpdateData={studentExamUpdateData}
        setStudentExamUpdateData={setStudentExamUpdateData}
        studentExamUpdatePopup={studentExamUpdatePopup}
        handleCloseStudentExamUpdatePopup={handleCloseStudentExamUpdatePopup}
        handleSubmit={handleSubmit}
      />
      <DeleteHistoryAdminPopup
        open={deleteHistoryPopup}
        mode={deleteHistoryMode}
        onClose={handleCloseDeleteHistoryPopup}
      />
    </div>
  );
};

export default MarkAndDurationAdmin;
