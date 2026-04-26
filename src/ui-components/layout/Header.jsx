import { LogOut, User, Phone, Mail, GraduationCap, UserCircle } from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "../../components/NotificationDropdown";

const PAGE_TITLES = {
  "/home": "Home",
  "/student/attendance": "Attendance",
  "/student/homework": "Homework",
  "/student/lesson-plans": "Lesson Plans",
  "/student/announcements": "Announcements",
  "/student/exams": "Exams",
  "/student/chat": "Messages",
  "/student/reporting": "Reporting",
  "/student/study": "Study",
  "/student/profile": "My Profile",
  "/staff/attendance": "Attendance",
  "/staff/homework": "Homework",
  "/staff/lesson-plans": "Lesson Plans",
  "/staff/exams": "Exams",
  "/staff/chat": "Messages",
  "/staff/profile": "My Profile",
  "/broadcast": "Broadcast",
  "/scholarships": "Scholarships",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + "/")) return title;
  }
  return null;
}

export default function Header() {
  const auth = useAuth((state) => state.auth);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname);

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
    } else if (userRole === "teacher" || userRole === "staff" || userRole === "admin") {
      navigate("/staff/profile");
    } else {
      navigate("/staff/profile");
    }
  };

  const userInitial =
    auth?.details?.name?.charAt(0) || auth?.username?.charAt(0) || "U";

  return (
    <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-surface border-b border-[var(--color-border)] sticky top-0 z-30">
      {/* Left: Page Title */}
      <div className="hidden md:flex items-center gap-2 min-w-0">
        {pageTitle && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="h-9 w-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold hover:bg-primary-700 transition-colors ring-2 ring-primary-200 hover:ring-primary-300"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-label="Open profile menu"
          >
            {userInitial}
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-surface border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-4 bg-primary-50 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-semibold ring-2 ring-primary-200 flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate text-gray-900">
                      {auth?.details?.name || "User"}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {auth?.role || "User"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="px-4 py-3 space-y-3">
                {auth?.details?.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm text-gray-700 break-all">{auth.details.email}</p>
                    </div>
                  </div>
                )}

                {auth?.details?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="text-sm text-gray-700">{auth.details.phone}</p>
                    </div>
                  </div>
                )}

                {auth?.role?.toLowerCase() === "student" && auth?.details?.class && (
                  <div className="flex items-start gap-3">
                    <GraduationCap size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Class</p>
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
                      <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">Designation</p>
                        <p className="text-sm text-gray-700">{auth.details.designation}</p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="border-t border-[var(--color-border)]">
                <button
                  onClick={handleViewProfile}
                  className="w-full px-4 py-3 flex items-center gap-3 text-primary-600 hover:bg-primary-50 transition-colors text-sm font-medium border-b border-[var(--color-border)]"
                >
                  <UserCircle size={17} />
                  <span>View Full Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
