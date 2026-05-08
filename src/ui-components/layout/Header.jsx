import { LogOut, User, Phone, Mail, GraduationCap, UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "../../components/NotificationDropdown";
import ReadabilitySettings from "../../components/ReadabilitySettings";
import { useTranslation } from "react-i18next";

const PAGE_TITLE_KEYS = {
  "/home": "nav.home",
  "/student/attendance": "nav.attendance",
  "/student/homework": "nav.homework",
  "/student/lesson-plans": "nav.lessonPlans",
  "/student/announcements": "nav.announcements",
  "/student/exams": "nav.exams",
  "/student/chat": "nav.messages",
  "/student/pickup": "nav.pickup",
  "/student/reporting": "nav.reporting",
  "/student/study": "nav.study",
  "/student/profile": "nav.myProfile",
  "/staff/attendance": "nav.attendance",
  "/staff/homework": "nav.homework",
  "/staff/lesson-plans": "nav.lessonPlans",
  "/staff/exams": "nav.exams",
  "/staff/chat": "nav.messages",
  "/staff/pickup": "nav.pickup",
  "/staff/profile": "nav.myProfile",
  "/broadcast": "nav.broadcast",
  "/scholarships": "nav.scholarships",
};

function getPageTitleKey(pathname) {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname];
  for (const [path, key] of Object.entries(PAGE_TITLE_KEYS)) {
    if (pathname.startsWith(path + "/")) return key;
  }
  return null;
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const activeLng = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const auth = useAuth((state) => state.auth);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitleKey = getPageTitleKey(location.pathname);
  const pageTitle = pageTitleKey ? t(pageTitleKey) : null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = () => {
    logout();
  };

  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    const userRole = auth?.role?.toLowerCase();
    if (userRole === "student") {
      navigate("/student/profile");
    } else {
      navigate("/staff/profile");
    }
  };

  const userInitial =
    auth?.details?.name?.charAt(0) || auth?.username?.charAt(0) || "U";

  return (
    <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm sticky top-0 z-30">

      {/* Left: Page Title */}
      <div className="hidden md:flex items-center gap-3 min-w-0">
        {pageTitle && (
          <>
            <span className="w-[3px] h-5 rounded-full bg-[var(--color-primary-600)] flex-shrink-0" />
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {pageTitle}
            </h1>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label={t("header.openProfileMenu")}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors border border-transparent hover:border-[var(--color-border)]"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {userInitial}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px] leading-tight">
                {auth?.details?.name || "User"}
              </p>
              <p className="text-sm text-gray-600 capitalize leading-tight">
                {auth?.role || ""}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden lg:block text-gray-500 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${showProfileDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-4 bg-[var(--color-primary-50)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center text-lg font-semibold ring-2 ring-[var(--color-primary-100)] flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate text-gray-900">
                      {auth?.details?.name || "User"}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize mt-0.5">
                      {auth?.role || "User"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="px-4 py-3 space-y-3">
                {auth?.details?.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-0.5">{t("header.email")}</p>
                      <p className="text-sm text-gray-700 break-all">{auth.details.email}</p>
                    </div>
                  </div>
                )}

                {auth?.details?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-0.5">{t("header.phone")}</p>
                      <p className="text-sm text-gray-700">{auth.details.phone}</p>
                    </div>
                  </div>
                )}

                {auth?.role?.toLowerCase() === "student" && auth?.details?.class && (
                  <div className="flex items-start gap-3">
                    <GraduationCap size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-0.5">{t("header.class")}</p>
                      <p className="text-sm text-gray-700">
                        {auth.details.class}
                        {auth.details.section && ` - ${auth.details.section}`}
                      </p>
                    </div>
                  </div>
                )}

                {(auth?.role?.toLowerCase() === "staff" ||
                  auth?.role?.toLowerCase() === "teacher" ||
                  auth?.role?.toLowerCase() === "admin") &&
                  auth?.details?.designation && (
                    <div className="flex items-start gap-3">
                      <User size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 mb-0.5">{t("header.designation")}</p>
                        <p className="text-sm text-gray-700">{auth.details.designation}</p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Text size (same pattern as language below) */}
              <div className="px-4 py-3 border-t border-[var(--color-border)]">
                <ReadabilitySettings variant="menu" />
              </div>

              {/* Language */}
              <div className="px-4 py-3 border-t border-[var(--color-border)]">
                <p className="text-sm text-gray-600 mb-2">{t("login.language")}</p>
                <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-0.5">
                  {[
                    { code: "en", label: "EN" },
                    { code: "hi", label: "हि" },
                    { code: "kn", label: "ಕ" },
                  ].map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => i18n.changeLanguage(code)}
                      className={`flex-1 rounded-md py-2 min-h-[40px] text-sm font-semibold transition-colors ${
                        activeLng === code
                          ? "bg-[var(--color-surface)] text-[var(--color-primary-600)] shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-[var(--color-border)]">
                <button
                  onClick={handleViewProfile}
                  className="w-full px-4 py-3 flex items-center gap-3 text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] transition-colors text-sm font-medium border-b border-[var(--color-border)]"
                >
                  <UserCircle size={17} />
                  <span>{t("header.viewFullProfile")}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut size={17} />
                  <span>{t("header.logout")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
