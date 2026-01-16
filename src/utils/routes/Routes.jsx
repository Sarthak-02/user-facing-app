import LoginPage from "../../pages/Login";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../../ui-components/layout/Layout";
import Attendance from "../../pages/Attendance";
import BroadcastNotification from "../../pages/BroadcastNotification";
import Home from "../../pages/Home";

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
      // {path:"class", element: <Class />},
      // {path:"section", element: <Section />},
      // {path:"teacher", element: <Teacher />},
      // {path:"student", element: <Student />},
      // {path:"users", element: <User />},

      { path: "*", element: <Home /> },
    ],
  },
];
