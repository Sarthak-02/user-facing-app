import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";

/**
 * RoleBasedRoute - Protects routes based on user role and optional feature flag.
 * @param {React.ReactNode} children
 * @param {string[]} allowedRoles
 * @param {string|string[]} [requiredFeature] - feature_id(s); user needs at least one
 */
export default function RoleBasedRoute({ children, allowedRoles, requiredFeature }) {
  const { auth } = useAuth();
  const { isFeatureEnabled } = usePermissions();
  const userRole = auth?.role?.toLowerCase();

  const isLoggedIn = localStorage.getItem("token") === "true" || true;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === "teacher" || userRole === "staff") {
      return <Navigate to="/home" replace />;
    } else if (userRole === "student") {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requiredFeature && !isFeatureEnabled(requiredFeature)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
