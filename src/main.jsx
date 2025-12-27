import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./providers/ThemeProvider.jsx";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);


registerSW({
  onNeedRefresh() {
    console.log("New version available");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});