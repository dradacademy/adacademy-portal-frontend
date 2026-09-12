import React, { useState } from "react";
import SubjectsAdminPage from "./subpages/SubjectsAdminPage";
import { Button } from "@mui/material";
import AdminExamPage from "./subpages/AdminExamPage";
import Sidebar from "../../../components/dashboard/admin/Sidebar";
import Navbar from "../../../components/common/Navbar";
import { Route, Routes } from "react-router-dom";
import CreateExamAdminPage from "./subpages/CreateExamAdminPage";
import ViewQuestionOfExamAdminPage from "./subpages/ViewQuestionOfExamAdminPage";
import UsersAdminPage from "./subpages/UsersAdminPage";
import TriggerMailAdminPage from "./subpages/TriggerMailAdminPage";
import CommentDashboard from "../common/CommentDashboard";
import MarkAndDurationAdmin from "../../../components/dashboard/admin/MarkAndDurationAdmin";
import ExamDashboard from "./subpages/ExamDashboard";
import StudentDashboard from "./subpages/StudentDashboard";

const AdminDashboard = () => {
  return (
    <div className=" min-h-screen h-full flex gap-1 sm:gap-5 p-2 sm:p-5">
      <Sidebar />
      <div className=" flex flex-col gap-3 w-full">
        <Navbar dashboard={true} />
        <div className=" bg-white rounded-3xl py-7 px-10 w-full h-full">
          <Routes>
            <Route index path="/" element={<ExamDashboard />} />
            <Route index path="/user-based" element={<StudentDashboard />} />
            <Route path="/create-subject" element={<SubjectsAdminPage />} />
            <Route path="/exam" element={<AdminExamPage />} />
            <Route path="/exam/create-exam" element={<CreateExamAdminPage />} />
            <Route
              path="/exam/view-questions/:examId"
              element={<ViewQuestionOfExamAdminPage />}
            />
            <Route path="/users" element={<UsersAdminPage />} />
            {/* <Route path="/trigger-mail" element={<TriggerMailAdminPage />} /> */}
            <Route path="/comment" element={<CommentDashboard />} />
            <Route path="/controllers" element={<MarkAndDurationAdmin />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
