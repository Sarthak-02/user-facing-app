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
  Shield,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth.store";

export default function Layout() {
  const { auth } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  
  const userRole = auth?.role?.toLowerCase();

  const navItems = useMemo(() => {
    const baseNavItems = [{ labelKey: "nav.home", icon: Home, path: "/home" }];
    const scholarshipsNav = {
      labelKey: "nav.scholarships",
      icon: GraduationCap,
      path: "/scholarships",
    };

    if (userRole === "student") {
      return [
        ...baseNavItems,
        scholarshipsNav,
        { labelKey: "nav.attendance", icon: ClipboardCheck, path: "/student/attendance" },
        { labelKey: "nav.homework", icon: BookOpen, path: "/student/homework" },
        { labelKey: "nav.lessonPlans", icon: NotebookPen, path: "/student/lesson-plans" },
        { labelKey: "nav.announcements", icon: Megaphone, path: "/student/announcements" },
        { labelKey: "nav.exams", icon: FileText, path: "/student/exams" },
        { labelKey: "nav.messages", icon: MessageCircle, path: "/student/chat" },
        { labelKey: "nav.pickup", icon: Shield, path: "/student/pickup" },
        { labelKey: "nav.reporting", icon: BarChart3, path: "/student/reporting" },
        { labelKey: "nav.study", icon: Sparkles, path: "/student/study" },
      ];
    }
    if (userRole === "teacher" || userRole === "staff") {
      return [
        ...baseNavItems,
        scholarshipsNav,
        { labelKey: "nav.attendance", icon: ClipboardCheck, path: "/staff/attendance" },
        { labelKey: "nav.homework", icon: BookOpen, path: "/staff/homework" },
        { labelKey: "nav.lessonPlans", icon: NotebookPen, path: "/staff/lesson-plans" },
        { labelKey: "nav.exams", icon: FileText, path: "/staff/exams" },
        { labelKey: "nav.messages", icon: MessageCircle, path: "/staff/chat" },
        { labelKey: "nav.pickup", icon: Shield, path: "/staff/pickup" },
        { labelKey: "nav.reporting", icon: BarChart3, path: "/staff/reporting" },
        { labelKey: "nav.broadcast", icon: Bell, path: "/broadcast" },
      ];
    }

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
            ["nav.home", ""].includes(activeNav) ? "" : "hidden md:block"
          }`}
        >
          <Header />
        </div>

        {/* Page Content — bottom padding reserves space for fixed BottomNav + safe area (mobile) */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
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
