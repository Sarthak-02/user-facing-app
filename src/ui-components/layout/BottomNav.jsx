import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav({navItems, setActiveNav}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (label, path) => {
    setActiveNav(label);
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
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
      {navItems.map(({ label, icon: IconComponent, path }) => {
        const Icon = IconComponent;
        return (
          <button
            key={label}
            className={`flex flex-col items-center text-xs transition-colors ${
              isActive(path) 
                ? "text-[var(--color-primary)]" 
                : "text-[var(--color-text-muted)]"
            }`}
            onClick={() => handleNavClick(label, path)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
