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
import { usePermissions } from "../../store/permissions.store";

export default function Layout() {
  const { auth } = useAuth();
  const { isFeatureEnabled } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("");

  const userRole = auth?.role?.toLowerCase();

  const navItems = useMemo(() => {
    const baseNavItems = [{ labelKey: "nav.home", icon: Home, path: "/home" }];

    if (userRole === "student") {
      const all = [
        { labelKey: "nav.scholarships",  icon: GraduationCap, path: "/scholarships",          feature: "student_scholarships" },
        { labelKey: "nav.attendance",    icon: ClipboardCheck, path: "/student/attendance",   feature: "student_attendance_view" },
        { labelKey: "nav.homework",      icon: BookOpen,       path: "/student/homework",      feature: "student_homework" },
        { labelKey: "nav.lessonPlans",   icon: NotebookPen,    path: "/student/lesson-plans",  feature: "student_lesson_plans" },
        { labelKey: "nav.announcements", icon: Megaphone,      path: "/student/announcements", feature: "student_announcements" },
        { labelKey: "nav.exams",         icon: FileText,       path: "/student/exams",         feature: "student_exams" },
        { labelKey: "nav.messages",      icon: MessageCircle,  path: "/student/chat",          feature: "student_messages" },
        { labelKey: "nav.pickup",        icon: Shield,         path: "/student/pickup",        feature: "student_pickup" },
        { labelKey: "nav.reporting",     icon: BarChart3,      path: "/student/reporting",     feature: "student_reporting" },
        { labelKey: "nav.study",         icon: Sparkles,       path: "/student/study",         feature: "student_study_ai" },
      ];
      return [...baseNavItems, ...all.filter((item) => isFeatureEnabled(item.feature))];
    }

    if (userRole === "teacher" || userRole === "staff") {
      const all = [
        { labelKey: "nav.scholarships", icon: GraduationCap, path: "/scholarships",    feature: "staff_scholarships" },
        { labelKey: "nav.attendance",   icon: ClipboardCheck, path: "/staff/attendance", feature: "staff_attendance_mark" },
        { labelKey: "nav.homework",     icon: BookOpen,       path: "/staff/homework",   feature: "staff_homework" },
        { labelKey: "nav.lessonPlans",  icon: NotebookPen,    path: "/staff/lesson-plans", feature: "staff_lesson_plans" },
        { labelKey: "nav.exams",        icon: FileText,       path: "/staff/exams",      feature: "staff_exams" },
        { labelKey: "nav.messages",     icon: MessageCircle,  path: "/staff/chat",       feature: "staff_messages" },
        { labelKey: "nav.pickup",       icon: Shield,         path: "/staff/pickup",     feature: "staff_pickup" },
        { labelKey: "nav.reporting",    icon: BarChart3,      path: "/staff/reporting",  feature: "staff_reporting" },
        { labelKey: "nav.study",         icon: Sparkles,       path: "/staff/study",      feature: "staff_study_ai" },
        { labelKey: "nav.broadcast",    icon: Bell,           path: "/broadcast",        feature: "staff_broadcast" },
      ];
      return [...baseNavItems, ...all.filter((item) => isFeatureEnabled(item.feature))];
    }

    return baseNavItems;
  }, [userRole, isFeatureEnabled]);

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
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
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
