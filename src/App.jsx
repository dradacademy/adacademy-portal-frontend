import React, { lazy, useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
import { Toaster } from "react-hot-toast";
import Home from "./pages/home/Home";
import { AuthContext } from "./context/AuthContext";
import StudentActivities from "./pages/activities/student/StudentActivities";
import AttemptedExamSubmissionDetail from "./pages/activities/examDetailedView/AttemptedExamSubmissionDetail";
import EvaluatorActivities from "./pages/activities/evaluator/EvaluatorActivities";
import EvaluatorDashboard from "./pages/dashboard/evaluator/EvaluatorDashboard";
import AttendExamStudent from "./pages/exam/AttendExamStudent";
import CompletedExamSubmissionDetail from "./pages/activities/examDetailedView/CompletedExamSubmissionDetail";

const AdminDashboard = lazy(
  () => import("./pages/dashboard/admin/AdminDashboard"),
);

function App() {
  const { userData, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  return (
    <div className=" text-stone-800 bg-[#fafafa] min-h-screen">
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route
          path="/dashboard/*"
          element={
            userData ? (
              <div>
                {userData?.role === "admin" ? (
                  <AdminDashboard />
                ) : userData?.role === "evaluator" ? (
                  <EvaluatorDashboard />
                ) : (
                  <Navigate to={"/login"} />
                )}
              </div>
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
        <Route
          path="/activities/*"
          element={
            userData ? (
              <div>
                {userData?.role === "evaluator" ||
                userData?.role === "admin" ? (
                  <EvaluatorActivities />
                ) : (
                  <StudentActivities />
                )}
              </div>
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
        <Route
          path="/activities/attempted/:examSubmissionId"
          element={<AttemptedExamSubmissionDetail />}
        />
        <Route
          path="/activities/completed/:examSubmissionId"
          element={<CompletedExamSubmissionDetail />}
        />
        <Route
          path="/attend-exam/:examCode"
          element={
            userData ? <AttendExamStudent /> : <Navigate to={"/login"} />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
