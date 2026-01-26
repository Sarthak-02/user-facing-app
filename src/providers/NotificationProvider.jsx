/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  requestNotificationPermission,
  getFCMToken,
  onMessageListener,
} from "../utils/firebase-messaging";
import { saveFCMToken } from "../api/auth.api";
import { useAuth } from "../store/auth.store";
import { toast } from "sonner";
import { showCustomNotification } from "../components/CustomNotificationToast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { auth } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  // Function to show browser notification
  const showBrowserNotification = useCallback((title, options) => {
    if (notificationPermission === "granted") {
      try {
        new Notification(title, options);
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  }, [notificationPermission]);
  
  // Helper function to show toast notification
  const showToastNotification = useCallback((payload) => {
    // Use custom notification component for rich display
    showCustomNotification(toast, payload);
  }, []);

  // Setup FCM listener on mount
  useEffect(() => {
    if (typeof Notification === "undefined") {
      return;
    }

    const unsubscribe = onMessageListener((payload) => {
      setLastNotification({
        title: payload.notification?.title || "New Notification",
        body: payload.notification?.body || "",
        data: payload.data || {},
        timestamp: Date.now(),
      });

      showToastNotification(payload);

      if (!document.hasFocus() && payload.notification) {
        showBrowserNotification(
          payload.notification.title || "Digi School",
          {
            body: payload.notification.body || "",
            icon: payload.notification.icon || "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: payload.data || {},
          }
        );
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [showBrowserNotification, showToastNotification]);

  // Listen for messages from service worker (when notification is clicked)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "NOTIFICATION_CLICKED") {
        const notification = event.data.notification;

        const payload = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
        };

        showToastNotification(payload);

        setLastNotification({
          title: notification.title || "New Notification",
          body: notification.body || "",
          data: notification.data || {},
          timestamp: notification.timestamp || Date.now(),
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [showToastNotification]);

  // Listen for browser-level permission changes
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return;
    }

    let permissionStatus;

    const checkPermissionChange = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'notifications' });
        
        const handlePermissionChange = async () => {
          setNotificationPermission(permissionStatus.state);
          
          if (permissionStatus.state === 'granted' && !fcmToken && auth.userId) {
            const token = await getFCMToken();
            
            if (token) {
              setFcmToken(token);
              localStorage.setItem('fcmToken', token);
              
              try {
                await saveFCMToken({
                  userId: auth.userId,
                  role: auth.role,
                  token: token,
                });
                toast.success("Notifications Enabled!", {
                  description: "You will now receive push notifications",
                  duration: 3000,
                });
              } catch (error) {
                console.error("Failed to save FCM token:", error);
              }
            }
          }
        };
        
        permissionStatus.addEventListener('change', handlePermissionChange);
      } catch {
        // Permission API not supported
      }
    };

    checkPermissionChange();

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', () => {});
      }
    };
  }, [auth.userId, auth.role, fcmToken]);

  // Sync FCM token when user logs in with already-granted permissions
  useEffect(() => {
    const syncTokenAfterLogin = async () => {
      if (!auth.userId || notificationPermission !== "granted") {
        return;
      }

      const storedToken = localStorage.getItem('fcmToken');
      if (fcmToken || storedToken) {
        return;
      }

      try {
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          localStorage.setItem('fcmToken', token);
          
          await saveFCMToken({
            userId: auth.userId,
            role: auth.role,
            token: token,
          });
        }
      } catch (error) {
        console.error('Failed to sync FCM token:', error);
      }
    };

    syncTokenAfterLogin();
  }, [auth.userId, auth.role, notificationPermission, fcmToken]);

  // Check if we should show notification prompt
  useEffect(() => {
    if (auth.userId && notificationPermission === "default") {
      // Check if user has previously dismissed the prompt (you can store this in localStorage)
      const dismissed = localStorage.getItem("notificationPromptDismissed");
      if (!dismissed) {
        // Show prompt after a short delay (to not overwhelm on first load)
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [auth.userId, notificationPermission]);

  // Handle enabling notifications
  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();

    if (granted) {
      setNotificationPermission("granted");
      setShowNotificationPrompt(false);

      const token = await getFCMToken();
      
      if (!token) {
        console.error("Failed to get FCM token");
        return;
      }
      
      localStorage.setItem('fcmToken', token);
      setFcmToken(token);

      try {
        await saveFCMToken({
          userId: auth.userId,
          role: auth.role,
          token: token,
        });
        
        toast.success("Notifications Enabled!", {
          description: "You will now receive push notifications",
          duration: 3000,
        });
      } catch (error) {
        console.error("Failed to save FCM token:", error);
      }
    } else {
      setNotificationPermission("denied");
      setShowNotificationPrompt(false);
    }
  };

  // Handle dismissing the notification prompt
  const dismissNotificationPrompt = (permanent = false) => {
    setShowNotificationPrompt(false);
    if (permanent) {
      localStorage.setItem("notificationPromptDismissed", "true");
    }
  };

  // Handle showing the prompt again (if user wants to enable later)
  const showPromptAgain = () => {
    localStorage.removeItem("notificationPromptDismissed");
    if (notificationPermission === "default") {
      setShowNotificationPrompt(true);
    }
  };

  const value = {
    notificationPermission,
    showNotificationPrompt,
    fcmToken,
    lastNotification,
    enableNotifications,
    dismissNotificationPrompt,
    showPromptAgain,
    clearLastNotification: () => setLastNotification(null),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
