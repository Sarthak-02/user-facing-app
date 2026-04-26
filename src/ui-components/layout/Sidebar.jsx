import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ collapsed, setCollapsed, navItems }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
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
          collapsed ? "justify-center px-0" : "px-4 gap-3"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
        </div>
        {!collapsed && (
          <>
            <span className="font-bold text-gray-900 text-base truncate flex-1">
              Digi School
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <div key={label} className="relative group">
              <button
                onClick={() => navigate(path)}
                className={`
                  w-full flex items-center rounded-lg text-left transition-all duration-150
                  ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"}
                  ${
                    active
                      ? "bg-primary-100 text-primary-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 transition-colors ${
                    active
                      ? "text-primary-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                {!collapsed && (
                  <span className="text-sm truncate">{label}</span>
                )}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                )}
              </button>

              {/* Tooltip — only in collapsed state */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="relative bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                    {label}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Expand button — only when collapsed */}
      {collapsed && (
        <div className="flex-shrink-0 px-2 pt-3 pb-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
