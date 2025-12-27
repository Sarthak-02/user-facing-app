import {
  Home,
  ClipboardCheck,
  BookOpen,
  Bell,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Homework", icon: BookOpen },
  { label: "Notifications", icon: Bell },
];

export default function Sidebar({ collapsed, setCollapsed }) {
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
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-100 text-left"
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
