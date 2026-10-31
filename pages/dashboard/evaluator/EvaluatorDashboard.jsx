import React from "react";
import Sidebar from "../../../components/dashboard/admin/Sidebar";
import Navbar from "../../../components/common/Navbar";
import { Route, Routes } from "react-router-dom";
import CommentDashboard from "../common/CommentDashboard";

const EvaluatorDashboard = () => {
  return (
    <div className=" min-h-screen h-full flex gap-1 sm:gap-5 p-2 sm:p-5">
      <Sidebar />
      <div className=" flex flex-col gap-3 w-full">
        <Navbar dashboard={true} />
        <div className=" bg-white rounded-3xl py-5 px-3 sm:py-7 sm:px-10 w-full h-full">
          <Routes>
            <Route index path="/" element={<div>sample page</div>} />
            <Route path="/comment" element={<CommentDashboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
