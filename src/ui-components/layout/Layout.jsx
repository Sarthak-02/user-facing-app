import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import { Home, ClipboardCheck, BookOpen, Bell } from "lucide-react";
const navItems = [
  { label: "Home", icon: Home },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Homework", icon: BookOpen },
  { label: "Alerts", icon: Bell },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav,setActiveNav] = useState("Home")
  return (
    <div className="h-screen flex bg-[var(--color-background)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main Content */}

      {/* <main
        className={`
          flex-1 
          ${collapsed ? "md:ml-16" : "md:ml-64"}
        `}
      >
        {children}
      </main> */}

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {
          activeNav === "Home" && <Header />
        }
        

        {/* Page Content */}
        <main
          className={`
          flex-1 
          ${collapsed ? "md:ml-16" : "md:ml-64"}
        `}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav navItems={navItems} activeNav={activeNav} setActiveNav={setActiveNav} />
      </div>
    </div>
  );
}

// import { useState } from "react";
// import Sidebar from "./Sidebar";
// import BottomNav from "./BottomNav";

// export default function Layout({ children }) {
//   const [collapsed, setCollapsed] = useState(false);

//   return (
//     <div className="h-screen flex ">
//       {/* Desktop Sidebar */}
//       <div className="hidden md:block">
//         <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
//       </div>

//       {/* Main Content */}
//       <main className="flex-1 ">
//         {children}
//       </main>

//       {/* Mobile Bottom Navigation */}
//       <div className="md:hidden">
//         <BottomNav />
//       </div>
//     </div>
//   );
// }
