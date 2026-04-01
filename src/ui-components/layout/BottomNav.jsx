import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

const MAX_BOTTOM_ICONS = 5;
/** When overflowing, show this many primary tabs plus "More" (total = MAX_BOTTOM_ICONS). */
const PRIMARY_COUNT_BEFORE_MORE = MAX_BOTTOM_ICONS - 1;

export default function BottomNav({ navItems, setActiveNav }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const { barItems, overflowItems } = useMemo(() => {
    if (navItems.length <= MAX_BOTTOM_ICONS) {
      return { barItems: navItems, overflowItems: [] };
    }
    return {
      barItems: navItems.slice(0, PRIMARY_COUNT_BEFORE_MORE),
      overflowItems: navItems.slice(PRIMARY_COUNT_BEFORE_MORE),
    };
  }, [navItems]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const handleNavClick = (label, path) => {
    setActiveNav(label);
    navigate(path);
  };

  const isActive = (path) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname === path;
  };

  const overflowHasActive = overflowItems.some((item) => isActive(item.path));

  const navButtonClass = (active) =>
    `flex flex-col items-center text-xs transition-colors min-w-0 flex-1 px-0.5 ${
      active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
    }`;

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[40] bg-black/25 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && overflowItems.length > 0 && (
        <div
          className="
            fixed bottom-14 left-2 right-2 z-[48] max-h-[min(50vh,20rem)] overflow-y-auto
            rounded-t-xl border border-[var(--color-border)] border-b-0
            bg-[var(--color-surface)] py-2 shadow-lg md:hidden
          "
          role="menu"
        >
          {overflowItems.map(({ label, icon: IconComponent, path }) => {
            const Icon = IconComponent;
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${
                  active
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-[var(--color-text)]"
                }`}
                onClick={() => handleNavClick(label, path)}
              >
                <Icon
                  size={20}
                  color={active ? "var(--color-primary-600)" : "black"}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-50
          h-14 bg-[var(--color-surface)]
          border-t border-[var(--color-border)]
          flex justify-around items-center
        "
      >
        {barItems.map(({ label, icon: IconComponent, path }) => {
          const Icon = IconComponent;
          const active = isActive(path);
          return (
            <button
              key={label}
              type="button"
              className={navButtonClass(active)}
              onClick={() => handleNavClick(label, path)}
            >
              <Icon
                size={20}
                color={active ? "var(--color-primary-600)" : "black"}
              />
              <span className="truncate max-w-full">{label}</span>
            </button>
          );
        })}
        {overflowItems.length > 0 && (
          <button
            type="button"
            className={navButtonClass(overflowHasActive || moreOpen)}
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal
              size={20}
              color={
                overflowHasActive || moreOpen
                  ? "var(--color-primary-600)"
                  : "black"
              }
            />
            <span>More</span>
          </button>
        )}
      </nav>
    </>
  );
}
