import React, { useContext } from "react";
import { Dialog } from "@mui/material";
import { MdClose } from "react-icons/md";
import { AuthContext } from "../../../context/AuthContext";
import { ExamContext } from "../../../context/ExamContext";

const EditStudentExamPopup = ({
  popupType,
  studentExamUpdateData,
  setStudentExamUpdateData,
  studentExamUpdatePopup,
  handleCloseStudentExamUpdatePopup,
  handleSubmit,
}) => {
  const { allUsersData } = useContext(AuthContext);
  const { subjects } = useContext(ExamContext);

  return (
    <Dialog
      open={studentExamUpdatePopup}
      onClose={handleCloseStudentExamUpdatePopup}
    >
      <form
        onSubmit={handleSubmit}
        className=" flex flex-col gap-5 sm:min-w-[500px] p-5 "
      >
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              {popupType === "manual pass"
                ? "Manually Pass Exam"
                : popupType === "rewrite"
                ? "Rewrite Exam"
                : "Update Exam"}
            </h1>
            <p className=" text-sm text-stone-500 font-work-sans">
              Select the user, subject, sub-topic, and level for the rewrite
              exam.
              <br />
              <span className=" text-red-500">
                Note: This will overwrite the existing exam data for the user.
              </span>
            </p>
          </div>
          <MdClose
            onClick={handleCloseStudentExamUpdatePopup}
            className=" text-stone-500 font-medium text-4xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" flex flex-col gap-2 font-inter">
          <label className=" text-sm font-medium text-stone-600">User</label>
          <select
            value={studentExamUpdateData.userId}
            onChange={(e) =>
              setStudentExamUpdateData({
                ...studentExamUpdateData,
                userId: e.target.value,
              })
            }
            className=" border border-stone-300 rounded-lg p-2 focus:outline-none"
          >
            <option value="">Select User</option>
            {allUsersData
              ?.filter((user) => user.role === "student")
              ?.sort((a, b) => a?.username?.localeCompare(b?.username))
              ?.map((user) => (
                <option key={user._id} value={user._id}>
                  {`${user.username} (${user.email})`}
                </option>
              ))}
          </select>
          <select
            value={studentExamUpdateData.subjectId}
            onChange={(e) =>
              setStudentExamUpdateData({
                ...studentExamUpdateData,
                subjectId: e.target.value,
              })
            }
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
            value={studentExamUpdateData.subTopicId}
            onChange={(e) =>
              setStudentExamUpdateData({
                ...studentExamUpdateData,
                subTopicId: e.target.value,
              })
            }
            className=" border border-stone-300 rounded-lg p-2 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
            disabled={!studentExamUpdateData.subjectId}
          >
            <option value="">Select Sub-Topic</option>
            {subjects
              .find(
                (subject) => subject._id === studentExamUpdateData.subjectId
              )
              ?.subtopics.map((subtopic) => (
                <option key={subtopic._id} value={subtopic._id}>
                  {subtopic.name}
                </option>
              ))}
          </select>
          <select
            value={studentExamUpdateData.level}
            onChange={(e) =>
              setStudentExamUpdateData({
                ...studentExamUpdateData,
                level: Number(e.target.value),
              })
            }
            className=" border border-stone-300 rounded-lg p-2 focus:outline-none"
          >
            <option value={1}>Level 1</option>
            <option value={2}>Level 2</option>
            <option value={3}>Level 3</option>
            <option value={4}>Level 4</option>
          </select>
        </div>
        <div className=" grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={handleCloseStudentExamUpdatePopup}
            className=" border border-indigo-400 text-indigo-400 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className=" bg-indigo-400 text-stone-50 font-medium py-2 px-4 rounded-xl font-poppins cursor-pointer hover:opacity-85 duration-300"
          >
            Submit
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default EditStudentExamPopup;
