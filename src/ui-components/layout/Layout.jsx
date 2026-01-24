import { useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import { Home, ClipboardCheck, BookOpen, Bell, FileText } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth.store";

export default function Layout() {
  const { auth } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  
  // Get user role
  const userRole = auth?.role?.toLowerCase();
  console.log("userRole", auth);
  // Define navigation items based on role
  const navItems = useMemo(() => {
    const baseNavItems = [
      { label: "Home", icon: Home, path: "/" },
    ];

    if (userRole === "student") {
      return [
        ...baseNavItems,
        { label: "Attendance", icon: ClipboardCheck, path: "/student/attendance" },
        { label: "Homework", icon: BookOpen, path: "/student/homework" },
        { label: "Alerts", icon: Bell, path: "/alerts" },
      ];
    } else if (userRole === "teacher" || userRole === "staff") {
      return [
        ...baseNavItems,
        { label: "Attendance", icon: ClipboardCheck, path: "/staff/attendance" },
        { label: "Homework", icon: BookOpen, path: "/staff/homework" },
        { label: "Exams", icon: FileText, path: "/staff/exams" },
        { label: "Broadcast", icon: Bell, path: "/broadcast" },
      ];
    }

    // Default navigation items
    return baseNavItems;
  }, [userRole]);

  return (
    <div className="flex bg-[var(--color-background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          navItems={navItems}
        />
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
