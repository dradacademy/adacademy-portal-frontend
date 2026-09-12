import { Dialog } from "@mui/material";
import React from "react";
import { MdClose } from "react-icons/md";
import { Link } from "react-router-dom";

const AttendExamconfirmPopup = ({
  openExamPopup,
  handleCloseExamDialog,
  examCode,
}) => {
  return (
    <Dialog open={openExamPopup} onClose={handleCloseExamDialog}>
      <div className=" flex flex-col gap-6 sm:min-w-[500px] p-5 ">
        <div className=" flex items-start justify-between gap-6 w-full">
          <div className=" flex flex-col gap-1">
            <h1 className=" text-2xl font-bold text-stone-700 font-poppins">
              Confirm Attend
            </h1>
            <p className=" text-sm text-stone-500 font-inter">
              Are you sure you want to attend this Exam ?
            </p>
          </div>
          <MdClose
            onClick={handleCloseExamDialog}
            className=" text-stone-500 font-medium text-2xl cursor-pointer hover:opacity-80 duration-300"
          />
        </div>
        <div className=" grid grid-cols-2 gap-1.5 font-inter">
          <button
            onClick={handleCloseExamDialog}
            className=" border border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-xl cursor-pointer hover:opacity-85 duration-300"
          >
            Cancel
          </button>
          <Link
            to={`/attend-exam/${examCode}`}
            className=" bg-blue-600 text-stone-50 font-medium py-2 px-4 rounded-xl cursor-pointer hover:opacity-85 duration-300 text-center"
          >
            Attend
          </Link>
        </div>
      </div>
    </Dialog>
  );
};

export default AttendExamconfirmPopup;
