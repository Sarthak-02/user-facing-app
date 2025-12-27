import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const isLoggedIn = localStorage.getItem("token") === "true" || false;

  if (isLoggedIn) {
    // If already logged in → redirect to home dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
