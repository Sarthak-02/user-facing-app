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


function App() {
  const element = useRoutes(routes);
  
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
