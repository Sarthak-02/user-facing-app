import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const isLoggedin = localStorage.getItem("token") === "true" || false; // or use cookies/context
  
    if (!isLoggedin) {
      // User is NOT logged in → redirect to login
      return <Navigate to="/login" replace />;
    }
  
    // User is authenticated → allow access
    return children;
  }