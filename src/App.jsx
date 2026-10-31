import React, { lazy, useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
import { Toaster } from "react-hot-toast";
import Home from "./pages/home/Home";
import { AuthContext } from "./context/AuthContext";
import StudentActivities from "./pages/activities/student/StudentActivities";
import RecordedClassesStudent from "./pages/activities/student/RecordedClassesStudent";
import AttachmentsStudent from "./pages/activities/student/AttachmentsStudent";
import MyProgressStudent from "./pages/activities/student/MyProgressStudent";
import StudentHome from "./pages/activities/student/StudentHome";
import StudentMe from "./pages/activities/student/StudentMe";
import MyNotebookStudent from "./pages/activities/student/MyNotebookStudent";
import PerformanceAnalyticsStudent from "./pages/activities/student/PerformanceAnalyticsStudent";
import StudentProfilePage from "./pages/activities/student/StudentProfilePage";
import AttemptedExamSubmissionDetail from "./pages/activities/examDetailedView/AttemptedExamSubmissionDetail";
import EvaluatorActivities from "./pages/activities/evaluator/EvaluatorActivities";
import EvaluatorDashboard from "./pages/dashboard/evaluator/EvaluatorDashboard";
import AttendExamStudent from "./pages/exam/AttendExamStudent";
import CompletedExamSubmissionDetail from "./pages/activities/examDetailedView/CompletedExamSubmissionDetail";
import PendingVideosPopup from "./components/common/popup/PendingVideosPopup";
import StudyTrackerPopup from "./components/common/popup/StudyTrackerPopup";

const AdminDashboard = lazy(
  () => import("./pages/dashboard/admin/AdminDashboard"),
);
const ExamDetailPage = lazy(() => import("./pages/exams/ExamDetailPage"));
const Careers = lazy(() => import("./pages/careers/Careers"));
const FreeTestPage = lazy(() => import("./pages/freeTest/FreeTestPage"));
const OnlineTestSeries = lazy(
  () => import("./pages/onlineTestSeries/OnlineTestSeries"),
);
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsAndConditions = lazy(
  () => import("./pages/legal/TermsAndConditions"),
);

function App() {
  const { userData, loading } = useContext(AuthContext);

  if (loading) {
    // Logo splash instead of a blank white screen while the app starts.
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-4"
        style={{ backgroundColor: "#0f2a4a" }}
      >
        <img src="/logo.png" alt="Dr. A.D. Academy" width={96} height={96} className="ad-splash-logo rounded-2xl" />
        <p style={{ color: "#e8b94a", fontFamily: "Poppins, Inter, sans-serif" }} className="text-sm font-semibold tracking-wide">
          Dr. A.D. Academy of Excellence
        </p>
      </div>
    );
  }

  // A student who hasn't completed (submitted) their profile is locked out
  // of every other student-facing screen — see requireCompletedProfile.js
  // on the backend for the matching, actually-enforcing check on the APIs
  // themselves; this is what makes the lock visible/navigable rather than
  // just a wall of 403s. Never true for admin/evaluator.
  // Free Test accounts never fill the student profile.
  const profileLocked =
    userData?.role === "student" &&
    userData?.accountType !== "free_trial" &&
    !userData?.profileCompleted;

  // Wraps a student-only route: unauthenticated -> /login, incomplete
  // profile -> /profile, otherwise the real page.
  const studentGate = (element) =>
    !userData ? (
      <Navigate to={"/login"} />
    ) : profileLocked ? (
      <Navigate to={"/profile"} replace />
    ) : (
      element
    );

  return (
    <div className=" text-stone-800 bg-[#fafafa] min-h-screen">
      <Routes>
        {/* Enrolled students opening the site/app go straight to their own
            Home (/my); visitors still see the public front page. */}
        <Route
          index
          path="/"
          element={
            userData?.role === "student" &&
            userData?.accountType !== "free_trial" &&
            userData?.profileCompleted ? (
              <Navigate to="/my" replace />
            ) : (
              <Home />
            )
          }
        />
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
                ) : profileLocked ? (
                  <Navigate to={"/profile"} replace />
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
          path="/recorded-classes"
          element={studentGate(<RecordedClassesStudent />)}
        />
        <Route
          path="/attachments"
          element={studentGate(<AttachmentsStudent />)}
        />
        {/* New look (2026-10-29): the student's own Home and "Me" pages. */}
        <Route path="/my" element={studentGate(<StudentHome />)} />
        <Route path="/me" element={studentGate(<StudentMe />)} />
        <Route path="/progress" element={studentGate(<MyProgressStudent />)} />
        <Route path="/notebook" element={studentGate(<MyNotebookStudent />)} />
        <Route
          path="/performance-analytics"
          element={studentGate(<PerformanceAnalyticsStudent />)}
        />
        <Route
          path="/profile"
          element={
            userData ? <StudentProfilePage /> : <Navigate to={"/login"} />
          }
        />
        <Route
          path="/attend-exam/:examCode"
          element={studentGate(<AttendExamStudent />)}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/exams/:examSlug" element={<ExamDetailPage />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/free-test" element={<FreeTestPage />} />
        <Route path="/online-test-series" element={<OnlineTestSeries />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditions />}
        />
      </Routes>
      {/* Students: pending recorded classes + "finish by" dates, every time the app opens. */}
      <PendingVideosPopup />
      {/* TNPSC JDO (or admin-chosen) students: daily study update reminder from 5:30 PM. */}
      <StudyTrackerPopup />
      <Toaster />
    </div>
  );
}

export default App;
