/**
 * Service Worker for PWA and Push Notifications
 * 
 * ARCHITECTURE NOTE:
 * ==================
 * This service worker handles:
 * 1. PWA caching and offline functionality (via Workbox)
 * 2. BACKGROUND push notifications (when app is closed/minimized)
 * 
 * FOREGROUND notifications (when app is open) are handled in:
 * src/utils/firebase-messaging.js
 * 
 * @see src/utils/firebase-messaging.js for foreground notification handling
 */

/* eslint-env serviceworker */
/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

precacheAndRoute(self.__WB_MANIFEST);

// Firebase config (MUST match src/utils/firebase-messaging.js)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "YOUR_DATABASE_URL",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase in service worker context
try {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Handle background push notifications
  onBackgroundMessage(messaging, (payload) => {
    const notificationTitle = payload?.notification?.title ?? "Digi School";
    const notificationOptions = {
      body: payload?.notification?.body ?? "",
      icon: payload?.notification?.icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: payload?.data?.type || "general",
      data: {
        ...payload?.data,
        _notificationTitle: notificationTitle,
        _notificationBody: payload?.notification?.body ?? "",
        _timestamp: Date.now(),
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };
      
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error("[SW] Firebase initialization failed:", error);
}

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  const notificationData = {
    title: event.notification.title,
    body: event.notification.body,
    data: event.notification.data,
    tag: event.notification.tag,
    timestamp: Date.now(),
  };
  
  event.notification.close();

  const urlToOpen = new URL(event.notification?.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              notification: notificationData,
            });
            return client.focus();
          }
        }
        
        // eslint-disable-next-line no-undef
        return clients.openWindow(urlToOpen).then((windowClient) => {
          if (windowClient) {
            const sendMessage = () => {
              windowClient.postMessage({
                type: "NOTIFICATION_CLICKED",
                notification: notificationData,
              });
            };
            
            sendMessage();
            setTimeout(sendMessage, 500);
            setTimeout(sendMessage, 1500);
            setTimeout(sendMessage, 3000);
          }
          return windowClient;
        });
      })
  );
});

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  // Track notification dismissals here if needed
});

// Service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
