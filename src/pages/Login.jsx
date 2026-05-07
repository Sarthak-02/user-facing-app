import React, { useState } from "react";
import { Button, TextField } from "../ui-components";
import { loginApi, fetchTeacherPermissions, fetchStudentPermissions } from "../api/auth.api";
import { useAuth } from "../store/auth.store";
import { usePermissions } from "../store/permissions.store";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import logo_upscaled from "../assets/logo_upscaled.png";
import logo_vectorized from "../assets/logo_vectorized.svg";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const activeLng = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
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
      setError(t("login.errorRequired"));
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await loginApi({ userid, password });

      const { data } = response || {};

      if (!data) {
        throw new Error(t("login.errorInvalidResponse"));
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
            const permData = permissionsResponse.data;
            setPermissions(permData);
            setAuth({
              ...authData,
              campus_id: permData.campus_id || authData.campus_id,
              details: permData.details || authData.details,
              campus: permData.campus || authData.campus,
              sections: permData?.sections ?? [],
            });
          }
        } catch (permissionsErr) {
          console.error("Failed to fetch teacher permissions:", permissionsErr);
          setPermissionsError(permissionsErr?.message || t("login.permissionsFetchFailed"));
        } finally {
          setLoading(false);
        }
      } else if (data.role === "STUDENT") {
        try {
          setLoading(true);
          const permissionsResponse = await fetchStudentPermissions(data.userid);

          if (permissionsResponse?.success && permissionsResponse?.data) {
            const permData = permissionsResponse.data;
            setPermissions(permData);

            setAuth({
              ...authData,
              campus_id: permData?.campus?.campus_id || authData.campus_id,
              details: permData.details || authData.details,
              campus: permData.campus || authData.campus,
              sections:permData?.section ?? {},
            });
          }
        } catch (permissionsErr) {
          console.error("Failed to fetch student permissions:", permissionsErr);
        } finally {
          setLoading(false);
        }
      }

      navigate("/home");
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        t("login.errorFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-background)] px-4 py-10 sm:px-6 sm:py-12">
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
                alt={t("app.logoAlt", { name: t("app.name") })}
                width={2008}
                height={1832}
                className="h-auto max-h-36 w-auto max-w-[min(100%,280px)] object-contain sm:max-h-40 sm:max-w-[min(100%,320px)]"
                decoding="async"
              />
            </div>
            <p className="mt-1.5 text-sm text-gray-800 ">
              {t("login.subtitle")}
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
              placeholder={t("login.userIdPlaceholder")}
              label={t("login.userId")}
              value={userid}
              icon={<User className="h-5 w-5" aria-hidden />}
              autoComplete="username"
              onChange={(e) => setUserid(e.target.value.trim())}
            />

            <TextField
              placeholder={t("login.passwordPlaceholder")}
              label={t("login.password")}
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
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
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
              {isSubmitting ? t("login.signingIn") : t("login.signIn")}
            </Button>
          </form>

          <div
            className="mt-8 flex flex-col items-center gap-3 border-t border-[var(--color-border)] pt-6"
            role="group"
            aria-label={t("login.language")}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("login.language")}
            </span>
            <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 dark:bg-black/20">
              <button
                type="button"
                onClick={() => i18n.changeLanguage("en")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  activeLng === "en"
                    ? "bg-[var(--color-surface)] text-primary-700 shadow-sm dark:text-primary-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                aria-pressed={activeLng === "en"}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage("hi")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  activeLng === "hi"
                    ? "bg-[var(--color-surface)] text-primary-700 shadow-sm dark:text-primary-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                aria-pressed={activeLng === "hi"}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage("kn")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  activeLng === "kn"
                    ? "bg-[var(--color-surface)] text-primary-700 shadow-sm dark:text-primary-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                aria-pressed={activeLng === "kn"}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
