import React, { useContext, useState } from "react";
import UpdateDurationAdminPopup from "../../common/popup/UpdateDurationAdminPopup";
import { DurationContext } from "../../../context/DurationContext";
import { MarkContext } from "../../../context/MarkContext";
import UpdateMarkAdminPopup from "../../common/popup/UpdateMarkAdminPopup";
import EditStudentExamPopup from "../../common/popup/EditStudentExamPopup";
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
  });
  const [popupType, setPopupType] = useState("");

  const [studentExamUpdatePopup, setStudentExamUpdatePopup] = useState(false);
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
      toast.error(error.response?.data?.message || "Failed to rewrite exam");
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
            Here you can update the exam duration, marks, or rewrite any exam
            for a student. Please ensure that the student has already passed the
            exam before rewriting it.
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
    </div>
  );
};

export default MarkAndDurationAdmin;
