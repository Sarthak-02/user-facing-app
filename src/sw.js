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

import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseConfig } from "./firebase-config.js";
import {
  DEFAULT_NOTIFICATION_BADGE_URL,
  DEFAULT_NOTIFICATION_ICON_URL,
} from "./utils/notification-default-icon.js";

// ⚠️ CRITICAL: This placeholder MUST be present for workbox-build to inject the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Cache GET API responses — tries network first, falls back to cache when offline
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/userfacing") && request.method === "GET",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache static assets (fonts, images not in precache) with stale-while-revalidate
registerRoute(
  ({ request }) =>
    request.destination === "font" || request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "static-assets-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// Cache specific POST endpoints that behave as read operations.
// The Cache API only supports GET natively, so we build a synthetic cache key
// from URL + a hash of the request body, giving each unique payload its own entry.
const CACHED_POST_ROUTES = ["/teacher/summary", "/attendance/student"];

function bodyHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    CACHED_POST_ROUTES.some((route) => url.pathname.endsWith(route))
  ) {
    event.respondWith(handleCachedPost(event.request));
  }
});

async function handleCachedPost(request) {
  const cache = await caches.open("post-api-cache");
  const bodyText = await request.clone().text();
  const cacheKey = `${request.url}__${bodyHash(bodyText)}`;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, message: "You are offline and this data hasn't been cached yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handle SPA navigation - return index.html for all navigation requests
// Must use /app/index.html to match the base path configured in vite.config.js
const handler = createHandlerBoundToURL("/app/index.html");
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
});
registerRoute(navigationRoute);

// Initialize Firebase in service worker context
try {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Handle background push notifications
  onBackgroundMessage(messaging, (payload) => {
    const notificationTitle = payload?.notification?.title ?? "Digi School";
    const notificationOptions = {
      body: payload?.notification?.body ?? "",
      icon: payload?.notification?.icon || DEFAULT_NOTIFICATION_ICON_URL,
      badge: DEFAULT_NOTIFICATION_BADGE_URL,
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
