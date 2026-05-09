import { useAuth } from "../store/auth.store";
import StudentHome from "./student/StudentHome";
import StaffHome from "./staff/Home";

export default function Home() {
  const { auth } = useAuth();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {auth?.role?.toLowerCase() === "student" ? (
        <StudentHome />
      ) : (
        <StaffHome />
      )}
    </div>
  );
}
