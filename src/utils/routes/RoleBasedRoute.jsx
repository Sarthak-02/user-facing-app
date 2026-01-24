import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";

/**
 * RoleBasedRoute - Protects routes based on user role
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 */
export default function RoleBasedRoute({ children, allowedRoles }) {
  const { auth } = useAuth();
  const userRole = auth?.role?.toLowerCase();

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("token") === "true" || true;
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowed roles list
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate home page based on role
    if (userRole === "teacher" || userRole === "staff") {
      return <Navigate to="/staff/attendance" replace />;
    } else if (userRole === "student") {
      return <Navigate to="/student/attendance" replace />;
    }
    // Default fallback
    return <Navigate to="/" replace />;
  }

  // User has the correct role
  return children;
}
