import { useAuth } from "../store/auth.store";
import StudentHome from "./student/StudentHome";
import StaffHome from "./staff/Home";

export default function Home() {
  const { auth } = useAuth();
  if (auth?.role?.toLowerCase() === "student") {
    return <StudentHome />;
  }
  return <StaffHome />;
}
