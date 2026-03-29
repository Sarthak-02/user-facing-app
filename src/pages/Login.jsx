import React, { useState } from "react";
import { Button, TextField } from "../ui-components";
import { loginApi, fetchTeacherPermissions } from "../api/auth.api";
import { useAuth } from "../store/auth.store";
import { usePermissions } from "../store/permissions.store";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import logo_upscaled from "../assets/logo_upscaled.png";
import logo_vectorized from "../assets/logo_vectorized.svg";

const APP_NAME = "Digi School";

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

      const { data } = response || {};

      if (!data) {
        throw new Error("Invalid response from server");
      }

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
        } finally {
          setLoading(false);
        }
      }

      navigate("/home");
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-background)] px-4 py-10 sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,color-mix(in_srgb,var(--color-primary-600)_12%,transparent),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary-600/[0.06] blur-3xl dark:bg-primary-600/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-primary-600/[0.05] blur-3xl dark:bg-primary-600/[0.08]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[420px]">
        <div
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl shadow-gray-900/5 dark:shadow-black/40 sm:p-10"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex w-full justify-center px-1">
              <img
                src={logo_vectorized}
                alt={`${APP_NAME} logo`}
                width={2008}
                height={1832}
                className="h-auto max-h-36 w-auto max-w-[min(100%,280px)] object-contain sm:max-h-40 sm:max-w-[min(100%,320px)]"
                decoding="async"
              />
            </div>
            <p className="mt-1.5 text-sm text-gray-800 ">
              Sign in with your school account
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <TextField
              placeholder="Enter your user ID"
              label="User ID"
              value={userid}
              icon={<User className="h-5 w-5" aria-hidden />}
              autoComplete="username"
              onChange={(e) => setUserid(e.target.value.trim())}
            />

            <TextField
              placeholder="Enter your password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              icon={<Lock className="h-5 w-5" aria-hidden />}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
            />

            {error ? (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold"
              disabled={!(userid && password) || isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
