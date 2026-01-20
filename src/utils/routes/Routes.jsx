import LoginPage from "../../pages/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../../ui-components/layout/Layout";
import Attendance from "../../pages/staff/Attendance";
import BroadcastNotification from "../../pages/staff/BroadcastNotification";
import Home from "../../pages/staff/Home";
import StudentAttendance from "../../pages/student/Attendance";
import Homework from "../../pages/student/Homework";
import HomeworkDetail from "../../pages/student/HomeworkDetail";
import TeacherHomework from "../../pages/staff/Homework";
// import TeacherHomeworkDetail from "../../pages/staff/HomeworkDetail";

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
      { path: "attendance", element: <Attendance /> },
      { path: "broadcast", element: <BroadcastNotification /> },
      { path: "student/attendance", element: <StudentAttendance /> },
      { path: "student/homework", element: <Homework /> },
      { path: "student/homework/:homeworkId", element: <HomeworkDetail /> },
      { path: "staff/homework", element: <TeacherHomework /> },
      { path: "staff/homework/:homeworkId", element: <HomeworkDetail /> },
      // {path:"class", element: <Class />},
      // {path:"section", element: <Section />},
      // {path:"teacher", element: <Teacher />},
      // {path:"student", element: <Student />},
      // {path:"users", element: <User />},

      { path: "*", element: <Home /> },
    ],
  },
];
