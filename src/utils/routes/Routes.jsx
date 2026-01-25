import LoginPage from "../../pages/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import Layout from "../../ui-components/layout/Layout";
import Attendance from "../../pages/staff/Attendance";
import BroadcastNotification from "../../pages/staff/BroadcastNotification";
import Home from "../../pages/staff/Home";
import StudentAttendance from "../../pages/student/Attendance";
import Homework from "../../pages/student/Homework";
import HomeworkDetail from "../../pages/student/HomeworkDetail";
import StudentExams from "../../pages/student/Exams";
import StudentExamDetail from "../../pages/student/ExamDetail";
import TeacherHomework from "../../pages/staff/Homework";
import TeacherHomeworkDetail from "../../pages/staff/HomeworkDetail";
import Exams from "../../pages/staff/Exams";
import ExamDetail from "../../pages/staff/ExamDetail";
import EnterMarks from "../../pages/staff/EnterMarks";

export const routes = [
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />{" "}
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
      
      // Teacher/Staff routes
      { 
        path: "staff/attendance", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <Attendance />
          </RoleBasedRoute>
        )
      },
      { 
        path: "staff/homework", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <TeacherHomework />
          </RoleBasedRoute>
        )
      },
      { 
        path: "staff/homework/:homeworkId", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <TeacherHomeworkDetail />
          </RoleBasedRoute>
        )
      },
      { 
        path: "staff/exams", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <Exams />
          </RoleBasedRoute>
        )
      },
      { 
        path: "staff/exams/:examId", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <ExamDetail />
          </RoleBasedRoute>
        )
      },
      { 
        path: "staff/exams/:examId/enter-marks", 
        element: (
          <RoleBasedRoute allowedRoles={["teacher", "staff"]}>
            <EnterMarks />
          </RoleBasedRoute>
        )
      },
      { 
        path: "broadcast", 
        element: (
          <RoleBasedRoute allowedRoles={["admin"]}>
            <BroadcastNotification />
          </RoleBasedRoute>
        )
      },
      
      // Student routes
      { 
        path: "student/attendance", 
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <StudentAttendance />
          </RoleBasedRoute>
        )
      },
      { 
        path: "student/homework", 
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <Homework />
          </RoleBasedRoute>
        )
      },
      { 
        path: "student/homework/:homeworkId", 
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <HomeworkDetail />
          </RoleBasedRoute>
        )
      },
      { 
        path: "student/exams", 
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <StudentExams />
          </RoleBasedRoute>
        )
      },
      { 
        path: "student/exams/:examId", 
        element: (
          <RoleBasedRoute allowedRoles={["student"]}>
            <StudentExamDetail />
          </RoleBasedRoute>
        )
      },
      
      // Catch-all route
      { path: "*", element: <Home /> },
    ],
  },
];
