/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// ✅ THIS is the required injection hook (and Rollup will NOT remove it)
precacheAndRoute(self.__WB_MANIFEST);

// 🔥 Firebase config (use your real values or Vite envs)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Background notifications
onBackgroundMessage(messaging, (payload) => {
  self.registration.showNotification(payload?.notification?.title ?? "Digi School", {
    body: payload?.notification?.body ?? "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: payload?.data || {},
  });
});

// ✅ Click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification?.data?.url || "/"));
});
