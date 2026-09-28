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

  // Numeric-answer grading (Short Answer with one numeric keyword, and
  // numeric Fill in the Blanks) now automatically applies a GATE-style
  // rounding-tolerance range derived from the stored correct answer itself
  // (e.g. "1.10" accepts 1.09 to 1.11) — no per-question setup needed, and
  // it applies to every already-created question as well as every future
  // one, since it's computed fresh at grading time rather than stored on
  // the question. The only thing still needed after a grading-logic change
  // like this is re-checking submissions that were already marked under
  // the old (exact-match-only) logic — this action does that, across every
  // exam, in one click. Safe to re-run any time.
  const [backfillLoading, setBackfillLoading] = useState(false);
  const handleBackfillShortAnswerRanges = async () => {
    if (
      !window.confirm(
        "This re-grades every already-completed submission on every exam against the current numeric-answer grading (which now automatically accepts a rounding-tolerance range around numeric answers, e.g. \"1.10\" accepts 1.09 to 1.11). Marks and pass/fail status may change for affected students.\n\nThis cannot be undone automatically. Continue?"
      )
    ) {
      return;
    }
    setBackfillLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/exams/short-answer-range-backfill`
      );
      toast.success(response.data.message || "Re-grade complete", {
        duration: 8000,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to re-grade exams against the current numeric-answer grading"
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
              ? "Re-grading All Exams..."
              : "Re-grade All Exams (Numeric Tolerance)"}
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
