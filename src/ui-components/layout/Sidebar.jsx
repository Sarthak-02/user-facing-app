import {
  ChevronLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ collapsed, setCollapsed, navItems }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`
    h-screen
    transition-all duration-300
    ${collapsed ? "w-16" : "w-64"}
    bg-[var(--color-surface)]
    border-r border-[var(--color-border)]
    flex-shrink-0
  `}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b">
        {!collapsed && <span className="font-bold">Digi School</span>}
        <button onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft
            className={`transition-transform ${collapsed && "rotate-180"}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-4 space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isActive(path)
                ? "bg-primary-100 text-[var(--color-primary)] font-medium"
                : "hover:bg-primary-50"
            }`}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
