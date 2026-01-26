# Push Notification Architecture

## Overview

This PWA implements push notifications using **two separate handlers** working together - one for foreground notifications and one for background notifications. This is a **requirement** of the Firebase Cloud Messaging (FCM) architecture and browser Push API.

## Why Two Separate Handlers?

### Browser Context Separation

Browsers run web apps in **two separate contexts**:

1. **Main App Context** (Window/Tab)
   - Your React app runs here
   - Has access to DOM, React components, state
   - Active only when app is open

2. **Service Worker Context** (Background Thread)
   - Runs independently from your app
   - No access to DOM or React
   - Runs even when app is closed
   - Required for background push notifications

### FCM Architecture

Firebase Cloud Messaging provides different APIs for each context:

| Context | File | FCM Function | Use Case |
|---------|------|--------------|----------|
| **Foreground** | `src/utils/firebase-messaging.js` | `onMessage()` | App is open/focused |
| **Background** | `public/sw.js` | `onBackgroundMessage()` | App is closed/minimized |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Messaging                 │
│                    (Push Notification Server)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Push Notification
                         ├──────────────────────────────────────┐
                         │                                      │
                         ▼                                      ▼
        ┌────────────────────────────┐      ┌──────────────────────────────┐
        │   APP IS OPEN (Foreground) │      │  APP IS CLOSED (Background)  │
        └────────────────────────────┘      └──────────────────────────────┘
                         │                                      │
                         │                                      │
        ┌────────────────▼────────────┐      ┌──────────────────▼───────────┐
        │                             │      │                              │
        │  src/utils/                 │      │  public/sw.js                │
        │  firebase-messaging.js      │      │  (Service Worker)            │
        │                             │      │                              │
        │  • onMessage()              │      │  • onBackgroundMessage()     │
        │  • Main app context         │      │  • Service worker context    │
        │  • Has React/DOM access     │      │  • No React/DOM access       │
        │                             │      │                              │
        └────────────────┬────────────┘      └──────────────────┬───────────┘
                         │                                      │
                         ▼                                      ▼
        ┌────────────────────────────┐      ┌──────────────────────────────┐
        │  NotificationProvider      │      │  Browser System Notification │
        │  (React Context)           │      │                              │
        │                            │      │  • Native OS notification    │
        │  • Updates state           │      │  • Persistent                │
        │  • Triggers NotificationT  │      │  • Works when app closed     │
        └────────────────┬───────────┘      └──────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │  NotificationToast         │
        │  (In-App UI Component)     │
        │                            │
        │  • Shows toast in app      │
        │  • Type-specific icons     │
        │  • Auto-dismiss            │
        │  • Clickable navigation    │
        └────────────────────────────┘
```

## File Responsibilities

### 1. `src/utils/firebase-messaging.js` (Foreground Handler)

**Context**: Main app (React)  
**When Active**: App is open and focused  
**Handles**: Foreground notifications

```javascript
// Listens for messages when app is open
onMessage(messaging, (payload) => {
  // App is open - show in-app toast
  // Updates React state via NotificationProvider
  // Shows NotificationToast component
});
```

**Features**:
- ✅ Initialize Firebase messaging
- ✅ Request notification permissions
- ✅ Get FCM token
- ✅ Listen for foreground messages
- ✅ Trigger in-app toast notifications
- ✅ Access React state and components

### 2. `public/sw.js` (Background Handler)

**Context**: Service Worker (Background)  
**When Active**: Always (even when app is closed)  
**Handles**: Background notifications

```javascript
// Listens for messages when app is closed/minimized
onBackgroundMessage(messaging, (payload) => {
  // App is closed - show system notification
  // Uses browser's native notification API
  // No access to React or app state
  self.registration.showNotification(title, options);
});
```

**Features**:
- ✅ Run independently from main app
- ✅ Handle notifications when app is closed
- ✅ Show native system notifications
- ✅ Handle notification clicks (open app)
- ✅ Track notification events
- ✅ PWA caching (offline support)

## Notification Flow

### Scenario 1: User Has App Open (Foreground)

```
1. Backend sends notification → FCM
2. FCM delivers to user's device
3. onMessage() fires in firebase-messaging.js
4. NotificationProvider receives payload
5. NotificationToast displays in-app
6. Toast shows for 5 seconds, auto-dismisses
```

**User Sees**: In-app toast notification

### Scenario 2: User Has App Closed (Background)

```
1. Backend sends notification → FCM
2. FCM delivers to user's device
3. Service worker wakes up
4. onBackgroundMessage() fires in sw.js
5. Service worker shows system notification
6. Notification appears in system tray/notification center
```

**User Sees**: Native OS notification

### Scenario 3: User Clicks Notification

**From Toast (Foreground)**:
```javascript
// In NotificationToast.jsx
const handleClick = () => {
  if (lastNotification?.data?.url) {
    window.location.href = lastNotification.data.url;
  }
};
```

**From System Notification (Background)**:
```javascript
// In sw.js
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  self.clients.openWindow(url);
});
```

## Configuration Requirements

### Both Files MUST Have Same Firebase Config

```javascript
// src/utils/firebase-messaging.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

```javascript
// public/sw.js (hardcoded, can't use import.meta.env)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

⚠️ **Important**: Service worker can't access Vite environment variables, so you must hardcode values in `sw.js`.

## How They Work Together

### Step-by-Step Process

1. **User Enables Notifications**
   ```javascript
   // In NotificationProvider.jsx
   enableNotifications() → requestNotificationPermission()
   ```

2. **Get FCM Token**
   ```javascript
   // In firebase-messaging.js
   getFCMToken() → Returns token string
   ```

3. **Save Token to Backend**
   ```javascript
   // In auth.api.js
   saveFCMToken({ userId, role, token })
   ```

4. **Backend Sends Notification**
   ```javascript
   // Your backend using Firebase Admin SDK
   admin.messaging().send({
     token: userFCMToken,
     notification: { title, body },
     data: { type, url }
   })
   ```

5. **FCM Routes to Appropriate Handler**
   - **App open?** → `onMessage()` in firebase-messaging.js
   - **App closed?** → `onBackgroundMessage()` in sw.js

## Testing Both Handlers

### Test Foreground (App Open)

1. Open the app
2. Enable notifications
3. Keep the app open and focused
4. Send test notification from Firebase Console
5. **Expected**: Toast appears in app

### Test Background (App Closed)

1. Open the app
2. Enable notifications
3. Close the browser tab completely
4. Send test notification from Firebase Console
5. **Expected**: System notification appears

### Test Notification Click

**Foreground**:
1. Click the toast notification
2. **Expected**: Navigates to URL in notification data

**Background**:
1. Click the system notification
2. **Expected**: Opens app and navigates to URL

## Common Questions

### Q: Why can't I handle both in one file?

**A**: Service workers run in a separate thread with no access to the main app's JavaScript context. They can't access React, DOM, or your app's state. This separation is enforced by the browser for security and performance.

### Q: Can I remove the service worker and handle everything in firebase-messaging.js?

**A**: No. Background notifications MUST be handled by a service worker. Without it, users won't receive notifications when the app is closed.

### Q: Why does sw.js need hardcoded config instead of .env?

**A**: Service workers are compiled separately from the main app and don't have access to Vite's `import.meta.env`. You must hardcode the values (same as in .env) or use a build script to inject them.

### Q: Do I need both files even if I only want background notifications?

**A**: You need both:
- Service worker for background notifications
- Main app handler for token generation and permission requests
- You can remove the toast UI if you don't want foreground notifications

### Q: How do I know which handler is being used?

**A**: Check the console logs:
- Foreground: `"Message received in foreground:"`
- Background: `"[SW] Background message received:"`

## Debugging

### Check Foreground Handler

```javascript
// In browser console
console.log("Has messaging?", !!messaging);
```

### Check Background Handler (Service Worker)

1. Open DevTools
2. Go to **Application** tab
3. Click **Service Workers**
4. Look for your service worker status
5. Click **Update** or **Unregister** if needed

### Force Test Background

```javascript
// Simulate app in background
document.addEventListener('visibilitychange', () => {
  console.log('Page visibility:', document.visibilityState);
});
```

When `document.visibilityState === 'hidden'`, background handler should activate.

## Best Practices

1. **Keep Firebase config in sync** between both files
2. **Test both foreground and background** scenarios
3. **Include URL in notification data** for proper navigation
4. **Use notification tags** to prevent duplicates
5. **Handle notification clicks** appropriately
6. **Add error handling** for both handlers
7. **Log events** for debugging
8. **Check service worker status** regularly

## Performance Considerations

- **Service Worker**: Lightweight, wakes up only for notifications
- **Foreground Handler**: Part of main app, minimal overhead
- **Memory**: Service worker runs in separate thread, doesn't affect app memory
- **Battery**: Efficient, only processes when notifications arrive

## Security

- ✅ Both use same Firebase config (secure)
- ✅ FCM tokens are unique per device
- ✅ Service worker runs in isolated context
- ✅ Permissions requested explicitly from user
- ✅ HTTPS required (except localhost)

## Summary

| Aspect | Foreground Handler | Background Handler |
|--------|-------------------|-------------------|
| **File** | `src/utils/firebase-messaging.js` | `public/sw.js` |
| **Context** | Main App (React) | Service Worker |
| **When Active** | App is open | Always (even when closed) |
| **Shows** | In-app toast | System notification |
| **Access to** | React, DOM, State | None (isolated) |
| **Function** | `onMessage()` | `onBackgroundMessage()` |
| **Required?** | Yes (for token & permission) | Yes (for background) |

Both handlers are **essential** and work together to provide complete push notification coverage for all app states.

---

For implementation details, see:
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup guide
- [PUSH_NOTIFICATIONS_IMPLEMENTATION.md](./PUSH_NOTIFICATIONS_IMPLEMENTATION.md) - Technical docs
