import { useNavigate, useLocation } from "react-router-dom";

const routeMap = {
  Home: "/",
  Attendance: "/attendance",
  Homework: "student/homework",
  Alerts: "/alerts",
};

export default function BottomNav({navItems, setActiveNav}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (label) => {
    setActiveNav(label);
    const route = routeMap[label] || "/";
    navigate(route);
  };

  const isActive = (label) => {
    const route = routeMap[label] || "/";
    return location.pathname === route;
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        h-14 bg-[var(--color-surface)]
        border-t border-[var(--color-border)]
        flex justify-around items-center
      "
    >
      {navItems.map(({ label, icon: IconComponent }) => {
        const Icon = IconComponent;
        return (
          <button
            key={label}
            className={`flex flex-col items-center text-xs transition-colors ${
              isActive(label) 
                ? "text-[var(--color-primary)]" 
                : "text-[var(--color-text-muted)]"
            }`}
            onClick={() => handleNavClick(label)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
