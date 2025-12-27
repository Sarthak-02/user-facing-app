import { Bell } from "lucide-react";

export default function Header() {
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
      {/* Left: Class Selector */}
      <div className="flex items-center gap-2">
        <select
          className="
            text-sm md:text-base
            px-2 py-1
            border rounded-md
            bg-transparent
            focus:outline-none
          "
        >
          <option>Class 6 - A</option>
          <option>Class 7 - B</option>
          <option>Class 8 - A</option>
        </select>
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
