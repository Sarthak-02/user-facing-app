import { useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import {
  Home,
  ClipboardCheck,
  BookOpen,
  Bell,
  FileText,
  Sparkles,
  GraduationCap,
  BarChart3,
  Megaphone,
  MessageCircle,
  NotebookPen,
} from "lucide-react";
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
      { label: "Home", icon: Home, path: "/home" },
    ];
    const scholarshipsNav = {
      label: "Scholarships",
      icon: GraduationCap,
      path: "/scholarships",
    };

    if (userRole === "student") {
      return [
        ...baseNavItems,
        scholarshipsNav,
        { label: "Attendance", icon: ClipboardCheck, path: "/student/attendance" },
        { label: "Homework", icon: BookOpen, path: "/student/homework" },
        { label: "Lesson plans", icon: NotebookPen, path: "/student/lesson-plans" },
        { label: "Announcements", icon: Megaphone, path: "/student/announcements" },
        { label: "Exams", icon: FileText, path: "/student/exams" },
        { label: "Messages", icon: MessageCircle, path: "/student/chat" },
        { label: "Reporting", icon: BarChart3, path: "/student/reporting" },
        { label: "Study", icon: Sparkles, path: "/student/study" },
      ];
    } else if (userRole === "teacher" || userRole === "staff") {
      return [
        ...baseNavItems,
        scholarshipsNav,
        { label: "Attendance", icon: ClipboardCheck, path: "/staff/attendance" },
        { label: "Homework", icon: BookOpen, path: "/staff/homework" },
        { label: "Lesson plans", icon: NotebookPen, path: "/staff/lesson-plans" },
        { label: "Exams", icon: FileText, path: "/staff/exams" },
        { label: "Messages", icon: MessageCircle, path: "/staff/chat" },
        { label: "Broadcast", icon: Bell, path: "/broadcast" },
      ];
    }

    // Default navigation items
    return [...baseNavItems, scholarshipsNav];
  }, [userRole]);

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          navItems={navItems}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`${
            ["Home",""].includes(activeNav) ? "" : "hidden md:block"
          }`}
        >
          <Header />
        </div>

        {/* Page Content — children use flex-1 min-h-0 + overflow-y-auto for page scroll, or internal scroll (e.g. chat) */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
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
