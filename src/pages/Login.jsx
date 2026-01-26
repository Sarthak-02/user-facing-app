import React, { useState } from "react";
import { Button, TextField } from "../ui-components";
import { loginApi, fetchTeacherPermissions } from "../api/auth.api";
import { useAuth } from "../store/auth.store";
import { usePermissions } from "../store/permissions.store";
// import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setAuth } = useAuth();
  const { setPermissions, setLoading, setError: setPermissionsError } = usePermissions();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!userid || !password) {
      setError("User ID and password are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await loginApi({ userid, password });
      
      // Extract data from the API response
      const { data } = response || {};
      
      if (!data) {
        throw new Error("Invalid response from server");
      }

      // Map the API response to the auth store structure
      const authData = {
        userId: data.userid || "",
        username: data.username || "",
        role: data.role || "",
        campus_id: data.details?.campus_id || "",
        sections: data.details?.sections || [],
        details: data.details || {},
        campus: data.campus || {},
      };
      localStorage.setItem("token", true);

      setAuth(authData);

      // Fetch teacher permissions if the user is a teacher/staff
      if (data.role === "TEACHER" || data.role === "STAFF") {
        try {
          setLoading(true);
          const permissionsResponse = await fetchTeacherPermissions(data.userid);
          
          if (permissionsResponse?.success && permissionsResponse?.data) {
            setPermissions(permissionsResponse.data);
          }
        } catch (permissionsErr) {
          console.error("Failed to fetch teacher permissions:", permissionsErr);
          setPermissionsError(permissionsErr?.message || "Failed to fetch permissions");
          // Don't block login if permissions fetch fails
        } finally {
          setLoading(false);
        }
      }
    
      // navigate("/attendance");
      navigate("/");
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md space-y-5">
        {/* USER ID */}
        <TextField
          placeholder="Enter User ID"
          label="User ID"
          onChange={(e) => setUserid(e.target.value.trim())}
        />

        {/* PASSWORD */}
        <div className="relative">
          <TextField
            placeholder="Enter Password"
            label="Password"
            type={showPassword ? "text" : "password"}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-12"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute 
              right-3 
              top-1/2 
              -translate-y-1/2 
              text-gray-500 
              hover:text-gray-700
            "
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {error ? (
          <div className="text-sm text-red-600" role="alert">
            {error}
          </div>
        ) : null}

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={!(userid && password) || isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </div>
    </div>
  );
}
