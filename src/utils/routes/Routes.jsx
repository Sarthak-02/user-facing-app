import { Navigate } from "react-router-dom";
import LoginPage from "../../pages/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import Layout from "../../ui-components/layout/Layout";
import StaffAttendanceHome from "../../pages/staff/StaffAttendanceHome";
import StaffAttendanceSection from "../../pages/staff/StaffAttendanceSection";
import BroadcastNotification from "../../pages/staff/BroadcastNotification";
import Home from "../../pages/Home";
import StudentAttendance from "../../pages/student/Attendance";
import HomeworkDetail from "../../pages/student/HomeworkDetail";
import StudentHomeworkSubjectHome from "../../pages/student/StudentHomeworkSubjectHome";
import StudentHomeworkBrowse from "../../pages/student/StudentHomeworkBrowse";
import StudentExams from "../../pages/student/Exams";
import StudentExamDetail from "../../pages/student/ExamDetail";
import TeacherHomework from "../../pages/staff/Homework";
import TeacherHomeworkDetail from "../../pages/staff/HomeworkDetail";
import StaffHomeworkHome from "../../pages/staff/StaffHomeworkHome";
import StaffHomeworkSubjectPick from "../../pages/staff/StaffHomeworkSubjectPick";
import StaffHomeworkStudentPick from "../../pages/staff/StaffHomeworkStudentPick";
import Exams from "../../pages/staff/Exams";
import ExamDetail from "../../pages/staff/ExamDetail";
import EnterMarks from "../../pages/staff/EnterMarks";
import StudentProfile from "../../pages/student/Profile";
import StudyChat from "../../pages/student/StudyChat";
import StudentMessages from "../../pages/student/StudentMessages";
import StaffMessages from "../../pages/staff/StaffMessages";
import StaffChatBroadcast from "../../pages/staff/StaffChatBroadcast";
import StudentReporting from "../../pages/student/Reporting";
import Announcements from "../../pages/student/Announcements";
import AnnouncementDetail from "../../pages/student/AnnouncementDetail";
import StaffProfile from "../../pages/staff/Profile";
import Scholarships from "../../pages/Scholarships";
import StudentPickup from "../../pages/student/Pickup";
import StaffPickup from "../../pages/staff/StaffPickup";
import StaffReportingHome from "../../pages/staff/StaffReportingHome";
import TeacherReporting from "../../pages/staff/Reporting";
import StaffLessonPlansHome from "../../pages/staff/StaffLessonPlansHome";
import StaffLessonPlansSubjectPick from "../../pages/staff/StaffLessonPlansSubjectPick";
import StaffLessonPlansBrowse from "../../pages/staff/StaffLessonPlansBrowse";
import StaffLessonPlanDetail from "../../pages/staff/StaffLessonPlanDetail";
import StaffTopicDetail from "../../pages/staff/StaffTopicDetail";
import StudentLessonPlansHome from "../../pages/student/StudentLessonPlansHome";
import StudentLessonPlansBrowse from "../../pages/student/StudentLessonPlansBrowse";
import StudentTopicDetail from "../../pages/student/StudentTopicDetail";

export const routes = [
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },

      // ── Staff / Teacher routes ────────────────────────────────────────────
      {
        path: "staff/profile",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff", "admin"]}>
            <StaffProfile />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/attendance/section/:sectionId/history",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_attendance_mark">
            <StaffAttendanceSection readOnly />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/attendance/section/:sectionId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_attendance_mark">
            <StaffAttendanceSection />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/attendance",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_attendance_mark">
            <StaffAttendanceHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/homework/section/:sectionId/subject/:subjectId/student/:studentId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_homework">
            <TeacherHomework />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/homework/section/:sectionId/subject/:subjectId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_homework">
            <TeacherHomework />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/homework/section",
        element: <Navigate to="/staff/homework" replace />,
      },
      {
        path: "staff/homework/section/:sectionId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_homework">
            <StaffHomeworkSubjectPick />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/homework",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_homework">
            <StaffHomeworkHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/homework/:homeworkId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_homework">
            <TeacherHomeworkDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/lesson-plans/section/:sectionId/subject/:subjectId/plan/:classPlanId/topic/:topicId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_lesson_plans">
            <StaffTopicDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/lesson-plans/section/:sectionId/subject/:subjectId/plan/:planId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_lesson_plans">
            <StaffLessonPlanDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/lesson-plans/section/:sectionId/subject/:subjectId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_lesson_plans">
            <StaffLessonPlansBrowse />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/lesson-plans/section/:sectionId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_lesson_plans">
            <StaffLessonPlansSubjectPick />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/lesson-plans",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_lesson_plans">
            <StaffLessonPlansHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/exams",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_exams">
            <Exams />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/exams/:examId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_exams">
            <ExamDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/exams/:examId/enter-marks",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_exams">
            <EnterMarks />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/chat",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_messages">
            <StaffMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/chat/broadcast",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_messages">
            <StaffChatBroadcast />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/chat/new",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_messages">
            <StaffMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/chat/:conversationId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_messages">
            <StaffMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/pickup",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff", "admin"]} requiredFeature="staff_pickup">
            <StaffPickup />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/reporting",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_reporting">
            <StaffReportingHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "staff/reporting/section/:sectionId",
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]} requiredFeature="staff_reporting">
            <TeacherReporting />
          </RoleBasedRoute>
        ),
      },
      {
        path: "broadcast",
        element: (
          <RoleBasedRoute allowedRoles={["admin", "teacher", "staff"]} requiredFeature="staff_broadcast">
            <BroadcastNotification />
          </RoleBasedRoute>
        ),
      },

      // ── Student routes ────────────────────────────────────────────────────
      {
        path: "student/profile",
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/attendance",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_attendance_view">
            <StudentAttendance />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/homework/subject/:subjectId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_homework">
            <StudentHomeworkBrowse />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/homework/subject",
        element: <Navigate to="/student/homework" replace />,
      },
      {
        path: "student/homework",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_homework">
            <StudentHomeworkSubjectHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/homework/:homeworkId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_homework">
            <HomeworkDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/lesson-plans/subject/:subjectId/topic/:topicId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_lesson_plans">
            <StudentTopicDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/lesson-plans/subject/:subjectId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_lesson_plans">
            <StudentLessonPlansBrowse />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/lesson-plans",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_lesson_plans">
            <StudentLessonPlansHome />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/announcements",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_announcements">
            <Announcements />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/announcements/:announcementId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_announcements">
            <AnnouncementDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/exams",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_exams">
            <StudentExams />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/exams/:examId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_exams">
            <StudentExamDetail />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/study",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_study_ai">
            <StudyChat />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/chat",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_messages">
            <StudentMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/chat/new",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_messages">
            <StudentMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/chat/:conversationId",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_messages">
            <StudentMessages />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/reporting",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_reporting">
            <StudentReporting />
          </RoleBasedRoute>
        ),
      },
      {
        path: "student/pickup",
        element: (
          <RoleBasedRoute allowedRoles={["student"]} requiredFeature="student_pickup">
            <StudentPickup />
          </RoleBasedRoute>
        ),
      },

      // ── Shared routes ─────────────────────────────────────────────────────
      {
        path: "scholarships",
        element: (
          <RoleBasedRoute
            allowedRoles={["student", "teacher", "staff", "admin"]}
            requiredFeature={["student_scholarships", "staff_scholarships"]}
          >
            <Scholarships />
          </RoleBasedRoute>
        ),
      },

      // Catch-all
      { path: "*", element: <Home /> },
    ],
  },
];
