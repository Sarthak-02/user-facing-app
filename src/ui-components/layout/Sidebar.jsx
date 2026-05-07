import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../store/auth.store";

export default function Sidebar({ collapsed, setCollapsed, navItems }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [tooltip, setTooltip] = useState(null);
  const { auth } = useAuth();

  const userName = auth?.details?.name || auth?.username || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = auth?.role;
  const profilePath =
    userRole?.toLowerCase() === "student" ? "/student/profile" : "/staff/profile";

  const isActive = (path) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>
      <aside
        className={`
          h-screen flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-60"}
          bg-[var(--color-surface)]
          border-r border-[var(--color-border)]
          flex-shrink-0
        `}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center flex-shrink-0 border-b border-[var(--color-border)] ${
            collapsed ? "justify-center px-2" : "px-4 gap-3"
          }`}
        >
          <button
            onClick={() => collapsed && setCollapsed(false)}
            className={`w-8 h-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center flex-shrink-0 shadow-sm ${collapsed ? "cursor-pointer hover:opacity-90 transition-opacity" : "cursor-default"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </button>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-gray-900 text-sm tracking-tight truncate block leading-tight">
                  {t("sidebar.brandName")}
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label={t("sidebar.collapse")}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ labelKey, label, icon: Icon, path }) => {
            const text = labelKey ? t(labelKey) : label;
            const active = isActive(path);
            return (
              <div
                key={path}
                className="relative group"
                onMouseEnter={
                  collapsed
                    ? (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ text, y: rect.top + rect.height / 2 });
                      }
                    : undefined
                }
                onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
              >
                {/* Left accent bar */}
                {active && !collapsed && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[var(--color-primary-600)]" />
                )}

                <button
                  onClick={() => navigate(path)}
                  className={`
                    w-full flex items-center rounded-lg text-left transition-all duration-150
                    ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"}
                    ${
                      active
                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={`flex-shrink-0 transition-colors ${
                      active
                        ? "text-[var(--color-primary-600)]"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  {!collapsed && (
                    <span className="text-sm truncate">{text}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div
          className={`flex-shrink-0 border-t border-[var(--color-border)] ${
            collapsed ? "p-2" : "p-3"
          }`}
        >
          <button
            onClick={() => navigate(profilePath)}
            className={`w-full flex items-center rounded-lg hover:bg-gray-50 transition-colors ${
              collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 ring-2 ring-[var(--color-primary-50)]">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 capitalize leading-tight mt-0.5">
                  {userRole || "User"}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Tooltip rendered as fixed — escapes overflow clipping of the nav scroll container */}
      {collapsed && tooltip && (
        <div
          className="pointer-events-none fixed z-[9999] -translate-y-1/2"
          style={{ top: tooltip.y, left: 76 }}
        >
          <div className="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {tooltip.text}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </>
  );
}
