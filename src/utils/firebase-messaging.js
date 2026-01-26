
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration (MUST match the config in public/sw.js)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase app
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} True if permission granted, false otherwise
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

/**
 * Get the FCM token for this device
 * @param {string} vapidKey - Your VAPID key from Firebase Console
 * @returns {Promise<string|null>} The FCM token or null if failed
 */
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      console.error("Firebase messaging not initialized");
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.error("No service worker registration found");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    if (currentToken) {
      return currentToken;
    }
    
    return null;
  } catch (error) {
    console.error("Error retrieving FCM token:", error);
    return null;
  }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback function to handle received messages
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    if (payload.notification && !document.hasFocus()) {
      const notificationTitle = payload.notification.title || "Digi School";
      const notificationOptions = {
        body: payload.notification.body || "",
        icon: payload.notification.icon || "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: payload.data || {},
      };
      new Notification(notificationTitle, notificationOptions);
    }

    if (callback) {
      callback(payload);
    }
  });
};

export { messaging };
