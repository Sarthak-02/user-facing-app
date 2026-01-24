import { Bell } from "lucide-react";
import { useAuth } from "../../store/auth.store";

export default function Header() {
  const auth = useAuth((state) => state.auth);
  const sections = auth?.details?.sections || [];

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
        <button className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center">
          S
        </button>
      </div>
    </header>
  );
}
