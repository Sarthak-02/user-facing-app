import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import { Home, ClipboardCheck, BookOpen, Bell } from "lucide-react";
import { Outlet } from "react-router-dom";
const navItems = [
  { label: "Home", icon: Home },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Homework", icon: BookOpen },
  { label: "Alerts", icon: Bell },
];

export default function Layout() {
  // console.log("Layout",children);
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  return (
    <div className="flex bg-[var(--color-background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col ">
        {/* Header */}
        <div
          className={`${
            ["Home",""].includes(activeNav) ? "" : "hidden md:block"
          }`}
        >
          <Header />
        </div>

        {/* Page Content */}
        <main><Outlet /></main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav
          navItems={navItems}
          setActiveNav={setActiveNav}
        />
      </div>
    </div>
  );
}
