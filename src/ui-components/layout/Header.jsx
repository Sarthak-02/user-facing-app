import { Bell, LogOut, User, Phone, Mail, GraduationCap, UserCircle } from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const auth = useAuth((state) => state.auth);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const sections = auth?.details?.sections || [];
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
    
    console.log("Navigating to profile, user role:", userRole);
    
    if (userRole === "student") {
      navigate("/student/profile");
    } else if (userRole === "teacher" || userRole === "staff" || userRole === "admin") {
      navigate("/staff/profile");
    } else {
      // Fallback - try to determine from other context
      console.warn("Unknown role:", auth?.role);
      navigate("/staff/profile");
    }
  };

  return (
    <header
      className="
        h-14 md:h-16
        flex items-center justify-between
        px-4 md:px-6
        bg-surface
        border-b border-[var(--color-border)]
        sticky top-0 z-30
      "
    >
      {/* Left: Section Selector/Label */}
      <div className="flex items-center gap-2">
        {sections.length === 1 ? (
          <span className="text-sm md:text-base font-medium">
            {sections[0].name || sections[0].section_name || "Section"}
          </span>
        ) : sections.length > 1 ? (
          <select
            className="
              text-sm md:text-base
              px-2 py-1
              border rounded-md
              bg-transparent
              focus:outline-none
            "
            value={auth.section_id}
            onChange={(e) => {
              // Handle section change
              // You may want to add a setActiveSection method in auth store
              console.log("Selected section:", e.target.value);
            }}
          >
            {sections.map((section) => (
              <option key={section.id || section.section_id} value={section.id || section.section_id}>
                {section.name || section.section_name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative">
          <Bell size={20} />
          <span
            className="
              absolute -top-1 -right-1
              h-2 w-2 rounded-full
              bg-red-500
            "
          />
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            {auth?.details?.name?.charAt(0) || auth?.username?.charAt(0) || "U"}
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div
              className="
                absolute right-0 top-full mt-2
                w-72 md:w-80
                bg-surface
                border border-[var(--color-border)]
                rounded-lg shadow-lg
                overflow-hidden
                z-50
              "
            >
              {/* Header */}
              <div className="px-4 py-3 bg-primary-50 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-semibold">
                    {auth?.details?.name?.charAt(0) || auth?.username?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {auth?.details?.name || "User"}
                    </h3>
                    <p className="text-xs text-text-secondary capitalize">
                      {auth?.role || "User"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="px-4 py-3 space-y-3">
                {/* Email */}
                {auth?.details?.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary">Email</p>
                      <p className="text-sm break-all">{auth.details.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {auth?.details?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary">Phone</p>
                      <p className="text-sm">{auth.details.phone}</p>
                    </div>
                  </div>
                )}

                {/* Class/Section for Students */}
                {auth?.role?.toLowerCase() === "student" && auth?.details?.class && (
                  <div className="flex items-start gap-3">
                    <GraduationCap size={18} className="text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary">Class</p>
                      <p className="text-sm">
                        {auth.details.class}
                        {auth.details.section && ` - ${auth.details.section}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Department/Designation for Staff */}
                {(auth?.role?.toLowerCase() === "staff" || auth?.role?.toLowerCase() === "teacher" || auth?.role?.toLowerCase() === "admin") && auth?.details?.designation && (
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary">Designation</p>
                      <p className="text-sm">{auth.details.designation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-[var(--color-border)]">
                {/* View Profile Button */}
                <button
                  onClick={handleViewProfile}
                  className="
                    w-full px-4 py-3
                    flex items-center gap-3
                    text-primary-600 hover:bg-primary-50
                    transition-colors
                    text-sm font-medium
                    border-b border-[var(--color-border)]
                  "
                >
                  <UserCircle size={18} />
                  <span>View Full Profile</span>
                </button>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3
                    flex items-center gap-3
                    text-red-600 hover:bg-red-50
                    transition-colors
                    text-sm font-medium
                  "
                >
                  <LogOut size={18} />
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
