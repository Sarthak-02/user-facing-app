import "./App.css";
import { routes } from "./utils/routes/Routes";
import { useRoutes } from "react-router-dom";
import NotificationPromptBanner from "./components/NotificationPromptBanner";
import { Toaster } from "sonner";


function App() {
  const element = useRoutes(routes);
  
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
      <NotificationPromptBanner />
      {element}
    </>
  );
}

export default App;
