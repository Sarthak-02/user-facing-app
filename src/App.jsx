import "./App.css";
import { routes } from "./utils/routes/Routes";
import { useRoutes } from "react-router-dom";
import NotificationPromptBanner from "./components/NotificationPromptBanner";
import OfflineBanner from "./components/OfflineBanner";
import PWAInstallBanner from "./components/PWAInstallBanner";
import IOSInstallBanner from "./components/IOSInstallBanner";
import { Toaster } from "sonner";
import { useLoader } from "./store/loader.store";
import Loader from "./ui-components/Loader";
import { useEffect } from "react";
import { useAuth } from "./store/auth.store";
import { usePermissions } from "./store/permissions.store";
import { fetchTeacherPermissions, fetchStudentPermissions } from "./api/auth.api";


function App() {
  const element = useRoutes(routes);
  const { auth, setAuth } = useAuth();
  const { setPermissions } = usePermissions();

  useEffect(() => {
    if (!auth.userId) return;

    const role = auth.role?.toUpperCase();

    if (role === "TEACHER" || role === "STAFF") {
      fetchTeacherPermissions(auth.userId)
        .then((res) => {
          if (res?.success && res?.data) {
            const permData = res.data;
            setPermissions(permData);
            setAuth({
              ...auth,
              campus_id: permData.campus_id || auth.campus_id,
              details: permData.details || auth.details,
              campus: permData.campus || auth.campus,
              sections: permData?.sections ?? [],
            });
          }
        })
        .catch((err) => console.error("Background permissions refresh failed:", err));
    } else if (role === "STUDENT") {
      fetchStudentPermissions(auth.userId)
        .then((res) => {
          if (res?.success && res?.data) {
            const permData = res.data;
            setPermissions(permData);
            setAuth({
              ...auth,
              campus_id: permData?.campus?.campus_id || auth.campus_id,
              details: permData.details || auth.details,
              campus: permData.campus || auth.campus,
              sections: permData?.section ?? {},
            });
          }
        })
        .catch((err) => console.error("Background permissions refresh failed:", err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Only show global spinner for 'spinner' type loaders
  const hasSpinnerLoader = useLoader((state) => 
    state.isLoading || Object.values(state.loaders).some(loader => loader.type === 'spinner')
  );
  
  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        duration={5000}
        expand={true}
        visibleToasts={5}
      />
      <OfflineBanner />
      <NotificationPromptBanner />
      <PWAInstallBanner />
      <IOSInstallBanner />
      {hasSpinnerLoader && <Loader overlay message="" />}
      {element}
    </>
  );
}

export default App;
