import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./providers/ThemeProvider.jsx";
import { NotificationProvider } from "./providers/NotificationProvider.jsx";
import { registerSW } from "virtual:pwa-register";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

// Register service worker with enhanced logging
console.log("📱 Initializing PWA registration...");

try {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log("🔄 New version available - reload to update");
    },
    onOfflineReady() {
      console.log("✅ App ready to work offline");
    },
    onRegistered(registration) {
      console.log("✅ Service Worker registered successfully:", registration);
      console.log("   SW scope:", registration.scope);
      console.log("   SW state:", registration.active?.state);
    },
    onRegisterError(error) {
      console.error("❌ Service Worker registration failed:", error);
      console.error("   Make sure you're on localhost or HTTPS");
    },
  });
  console.log("📱 PWA registration initialized:", updateSW);
} catch (error) {
  console.error("❌ Error during PWA setup:", error);
}

// Additional check for service worker support
if ('serviceWorker' in navigator) {
  console.log("✅ Service Worker API is supported");
  // Check registration status after a short delay
  setTimeout(() => {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        console.log("✅ Service Worker is registered:", reg);
      } else {
        console.warn("⚠️ No service worker registered yet");
      }
    });
  }, 2000);
} else {
  console.error("❌ Service Worker API not supported in this browser");
}
