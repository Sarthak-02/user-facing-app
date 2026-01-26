# Push Notifications Implementation - PWA

## Overview

Push notifications have been implemented as a **global feature** for the entire PWA application. This means notifications work across all pages and for all notification types (attendance, homework, exams, broadcasts, etc.).

### 📖 Understanding the Architecture

Push notifications work in **two contexts** - foreground (app open) and background (app closed). This is handled by two separate files working together:

- **Foreground**: `src/utils/firebase-messaging.js` - Handles notifications when app is open
- **Background**: `public/sw.js` - Handles notifications when app is closed

**→ For a detailed explanation, see [NOTIFICATION_ARCHITECTURE.md](./NOTIFICATION_ARCHITECTURE.md)**

## Architecture

### 1. Global Notification System

The notification system is implemented at the application level using React Context:

```
App Root
└── NotificationProvider (Context Provider)
    ├── NotificationPromptBanner (Global banner)
    ├── NotificationToast (In-app notifications)
    └── App Routes (All pages)
```

### 2. Files Created/Modified

#### New Files Created:

1. **`src/providers/NotificationProvider.jsx`**
   - Global context provider for notification state
   - Manages FCM token, permission state, and incoming messages
   - Handles notification listeners and token saving

2. **`src/components/NotificationPromptBanner.jsx`**
   - Banner component that prompts users to enable notifications
   - Shows after 3 seconds of login
   - Can be dismissed temporarily or permanently

3. **`src/components/NotificationToast.jsx`**
   - In-app toast notification component
   - Shows notifications when app is in foreground
   - Different icons for different notification types
   - Auto-dismisses after 5 seconds
   - Clickable to navigate to relevant pages

4. **`src/utils/firebase-messaging.js`**
   - Firebase messaging utilities
   - Functions to request permissions, get FCM token, listen for messages
   - Handles foreground message listening

5. **`FIREBASE_SETUP.md`**
   - Complete setup guide for Firebase configuration
   - Step-by-step instructions
   - Backend implementation examples

6. **`PUSH_NOTIFICATIONS_IMPLEMENTATION.md`** (this file)
   - Technical documentation of the implementation

#### Modified Files:

1. **`src/main.jsx`**
   - Added `NotificationProvider` wrapper around the app

2. **`src/App.jsx`**
   - Added `NotificationPromptBanner` and `NotificationToast` components

3. **`src/api/auth.api.js`**
   - Added `saveFCMToken` API function to save tokens to backend

4. **`public/sw.js`**
   - Already had Firebase messaging setup for background notifications

## How It Works

### User Flow

1. **Login**: User logs into the application
2. **Prompt**: After 3 seconds, notification prompt banner appears
3. **Enable**: User clicks "Enable Notifications"
4. **Permission**: Browser requests notification permission
5. **Token**: FCM token is generated and saved to backend
6. **Receive**: User can now receive notifications

### Notification Handling

#### Background (App Closed/Minimized)
- Service worker (`sw.js`) receives the notification
- Shows as system notification
- Clicking opens the app (optional URL from notification data)

#### Foreground (App Open)
- `NotificationProvider` receives the message
- `NotificationToast` displays the notification
- Shows for 5 seconds then auto-dismisses
- User can click to navigate to relevant page

### Notification Types

The app supports 5 notification types, each with a unique icon:

1. **ATTENDANCE** - Checkmark circle icon
2. **HOMEWORK** - Book icon
3. **EXAM** - Document icon
4. **BROADCAST** - Megaphone icon
5. **SYSTEM** - Bell icon (default)

## Usage

### For Frontend Developers

#### Access Notification Context

```javascript
import { useNotification } from "../providers/NotificationProvider";

function MyComponent() {
  const {
    notificationPermission,  // "default" | "granted" | "denied"
    showNotificationPrompt,  // boolean
    fcmToken,                // string | null
    lastNotification,        // object | null
    enableNotifications,     // function
    dismissNotificationPrompt, // function
    showPromptAgain,         // function
    clearLastNotification    // function
  } = useNotification();

  // Use the context values as needed
}
```

#### Manually Show Notification Prompt

```javascript
const { showPromptAgain } = useNotification();

// In settings page or user profile
<button onClick={showPromptAgain}>
  Enable Notifications
</button>
```

#### Check Notification Status

```javascript
const { notificationPermission, fcmToken } = useNotification();

if (notificationPermission === "granted" && fcmToken) {
  // User has enabled notifications
} else if (notificationPermission === "denied") {
  // User has denied notifications
} else {
  // User hasn't decided yet
}
```

### For Backend Developers

#### 1. Save FCM Token

Implement the `/fcm-token` endpoint:

```javascript
// Example: Node.js/Express
app.post('/fcm-token', async (req, res) => {
  const { user_id, role, token } = req.body;
  
  try {
    // Save to database
    await db.collection('fcm_tokens').insertOne({
      user_id,
      role,
      token,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### 2. Send Notifications

Use Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin (do this once at app startup)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey)
});

// Send notification to a user
async function sendNotificationToUser(userId, notificationData) {
  // Get user's FCM token from database
  const userToken = await db.collection('fcm_tokens')
    .findOne({ user_id: userId });
  
  if (!userToken) {
    console.log('No FCM token for user:', userId);
    return;
  }
  
  const message = {
    token: userToken.token,
    notification: {
      title: notificationData.title,
      body: notificationData.body,
      icon: '/pwa-192x192.png'
    },
    data: {
      type: notificationData.type,
      url: notificationData.url || '/',
      ...notificationData.customData
    }
  };
  
  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Handle invalid tokens (user uninstalled app, etc.)
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      // Delete invalid token from database
      await db.collection('fcm_tokens').deleteOne({ user_id: userId });
    }
  }
}

// Example usage
sendNotificationToUser('student_123', {
  title: 'Attendance Marked',
  body: 'Your attendance has been marked as Present',
  type: 'ATTENDANCE',
  url: '/student/attendance',
  customData: {
    date: '2026-01-26',
    status: 'PRESENT'
  }
});
```

#### 3. Send to Multiple Users (Topics)

```javascript
// Subscribe users to topics
async function subscribeUsersToTopic(userIds, topic) {
  const tokens = await db.collection('fcm_tokens')
    .find({ user_id: { $in: userIds } })
    .toArray();
  
  const tokenStrings = tokens.map(t => t.token);
  
  await admin.messaging().subscribeToTopic(tokenStrings, topic);
  console.log(`Subscribed ${tokenStrings.length} users to topic: ${topic}`);
}

// Send to topic
async function sendToTopic(topic, notificationData) {
  const message = {
    topic: topic,
    notification: {
      title: notificationData.title,
      body: notificationData.body
    },
    data: {
      type: notificationData.type,
      ...notificationData.customData
    }
  };
  
  await admin.messaging().send(message);
}

// Example: Send to all students in class 10A
await sendToTopic('class_10A', {
  title: 'Class Announcement',
  body: 'Tomorrow\'s class is rescheduled',
  type: 'BROADCAST'
});
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### Service Worker Configuration

Update `public/sw.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
};
```

## Features

### ✅ Implemented Features

- [x] Global notification provider
- [x] Notification permission request
- [x] FCM token generation and storage
- [x] Foreground message handling
- [x] Background message handling (via service worker)
- [x] In-app toast notifications
- [x] Type-based notification icons
- [x] Auto-dismiss after 5 seconds
- [x] Clickable notifications with navigation
- [x] Permission prompt banner (shows after 3s)
- [x] Dismiss temporarily or permanently
- [x] Persistent storage of user's dismiss preference

### 🔄 Possible Future Enhancements

- [ ] Notification center/history
- [ ] Mark notifications as read
- [ ] Notification filters (by type)
- [ ] Custom notification sounds
- [ ] Vibration patterns
- [ ] Do Not Disturb mode
- [ ] Notification preferences (per type)
- [ ] Badge count on app icon
- [ ] Rich notifications (images, action buttons)

## Testing

### Test Locally

1. **Enable Notifications**:
   - Run the app
   - Wait for prompt banner
   - Click "Enable Notifications"
   - Grant permission in browser

2. **Get FCM Token**:
   - Check browser console for the token
   - Verify it's saved in your backend

3. **Send Test Notification** (Firebase Console):
   - Go to Firebase Console > Cloud Messaging
   - Click "Send your first message"
   - Enter title and body
   - Click "Send test message"
   - Paste your FCM token
   - Click "Test"

4. **Send from Backend**:
   - Use the examples above
   - Send notifications for different types
   - Test both foreground and background scenarios

### Test Checklist

- [ ] Notification prompt appears after login
- [ ] Permission is requested correctly
- [ ] FCM token is generated
- [ ] Token is saved to backend
- [ ] Foreground notifications show as toast
- [ ] Background notifications show as system notifications
- [ ] Clicking notification navigates to correct page
- [ ] Different notification types show correct icons
- [ ] Dismiss options work correctly
- [ ] "Don't ask again" persists across sessions

## Troubleshooting

### Notification Prompt Doesn't Show
- Check browser console for errors
- Ensure user is logged in (`auth.userId` exists)
- Check localStorage for `notificationPromptDismissed`
- Clear localStorage and refresh

### FCM Token Not Generated
- Verify Firebase configuration in `.env` and `sw.js`
- Check VAPID key is correct
- Ensure service worker is registered
- Check browser console for Firebase errors

### Notifications Not Received
- Verify permission is granted
- Check FCM token is saved in backend
- Test notification payload format
- Ensure Firebase Cloud Messaging API is enabled
- Check service worker is active (DevTools > Application > Service Workers)

### Background Notifications Don't Work
- Ensure service worker is properly registered
- Check `sw.js` has correct Firebase config
- Verify `onBackgroundMessage` handler is set up
- Test with app completely closed (not just minimized)

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive Firebase credentials
2. **Rotate VAPID keys periodically** - Especially if exposed
3. **Validate tokens on backend** - Ensure tokens belong to authenticated users
4. **Implement token refresh** - Handle expired/invalid tokens
5. **Rate limit notifications** - Prevent spam/abuse
6. **Encrypt sensitive data** - In notification payloads if needed
7. **Use HTTPS** - Required for service workers and push notifications

## Browser Support

Push notifications are supported in:
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 16+ (macOS 13+, iOS not supported)
- ✅ Edge 79+
- ✅ Opera 37+

**Note**: iOS Safari does not support web push notifications. Consider implementing native mobile apps for iOS users.

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
