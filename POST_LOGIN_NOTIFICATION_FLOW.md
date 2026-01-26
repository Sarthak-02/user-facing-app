# Post-Login Notification Flow

## Summary
Implemented a post-login notification system that only requests and saves FCM tokens after user authentication, ensuring personalized push notifications for authenticated users only.

---

## Changes Made

### 1. **Fixed Service Worker Registration Error** (`src/utils/firebase-messaging.js`)
**Problem:** Firebase was trying to load `/firebase-messaging-sw.js` which didn't exist, causing a MIME type error.

**Solution:** Modified `getFCMToken()` to use the existing service worker registration from Vite PWA instead of creating a new one.

```javascript
// Get the existing service worker registration (registered by Vite PWA)
const registration = await navigator.serviceWorker.getRegistration();

const currentToken = await getToken(messaging, {
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  serviceWorkerRegistration: registration, // ✅ Use existing SW
});
```

### 2. **Added Auto-Sync for Returning Users** (`src/providers/NotificationProvider.jsx`)
**Purpose:** Automatically sync FCM token when a user logs in with already-granted notification permissions.

**Use Case:** User who previously enabled notifications logs back in - their token is automatically synced without showing prompts.

```javascript
useEffect(() => {
  // If user logs in with granted permission but no token, get one automatically
  if (auth.userId && notificationPermission === "granted" && !fcmToken) {
    const token = await getFCMToken();
    // Save to backend...
  }
}, [auth.userId, notificationPermission, fcmToken]);
```

### 3. **Optimized Permission Change Handler**
**Purpose:** Prevent duplicate token generation by checking localStorage first.

```javascript
// Check if token already exists before generating new one
const storedToken = localStorage.getItem('fcmToken');
if (storedToken) {
  setFcmToken(storedToken);
  return;
}
```

---

## Complete Notification Flow

### Scenario 1: New User First Login
```
1. User logs in → NotificationProvider receives auth.userId
2. After 3 seconds → Notification prompt banner appears
3. User clicks "Enable Notifications"
4. Browser permission dialog appears
5. User grants permission
6. FCM token is generated
7. Token saved to localStorage & backend
8. Success toast shown
```

### Scenario 2: Returning User (Previously Enabled Notifications)
```
1. User logs in → NotificationProvider receives auth.userId
2. Auto-sync detects granted permission
3. Token retrieved from localStorage or generated if missing
4. Token synced with backend
5. No prompts shown - seamless experience
```

### Scenario 3: User Enables via Browser Settings
```
1. User manually enables notifications in browser settings
2. Permission change listener detects the change
3. FCM token generated and saved
4. Backend notified
5. Success toast shown
```

### Scenario 4: User Previously Dismissed Prompt
```
1. User logs in → No prompt shown
2. User can manually enable from settings later
```

---

## API Requirements

Your backend must implement:

```javascript
POST /device-token/register
{
  "user_id": "string",
  "role": "staff" | "student",
  "token": "FCM_TOKEN_STRING"
}
```

---

## Environment Variables Required

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

---

## Testing the Implementation

1. **Test New User Flow:**
   ```
   - Clear browser data
   - Login
   - Wait for notification prompt
   - Click "Enable"
   - Check console for successful token save
   ```

2. **Test Returning User Flow:**
   ```
   - Login (with notifications already enabled)
   - Check console for "FCM token already exists" or "synced"
   - Verify no prompts shown
   ```

3. **Test Service Worker:**
   ```
   - Open DevTools > Application > Service Workers
   - Verify SW is registered and active
   - Check console for no MIME type errors
   ```

4. **Test Token Persistence:**
   ```
   - Enable notifications
   - Logout
   - Login again
   - Verify token is reused (no new token generated)
   ```

---

## Security & Privacy Features

✅ **Authentication Required:** FCM tokens only collected for logged-in users
✅ **Explicit Opt-In:** Users must explicitly enable notifications
✅ **Token Persistence:** Tokens persist in localStorage for seamless re-login experience
✅ **No Anonymous Tracking:** No tokens collected from visitors
✅ **Persistent Preferences:** Dismissal preferences saved
✅ **Backend Validation:** Backend should invalidate tokens on logout

---

## Troubleshooting

### Error: "The script has an unsupported MIME type"
**Cause:** Firebase trying to load non-existent `/firebase-messaging-sw.js`
**Fixed:** Now uses existing service worker registration

### Token Not Saving
**Check:**
1. User is logged in (`auth.userId` exists)
2. VAPID key is set in `.env`
3. Service worker is registered
4. Backend endpoint `/device-token/register` is working

### Notifications Not Appearing
**Check:**
1. Permission is granted (`Notification.permission === "granted"`)
2. FCM token exists in state/localStorage
3. Service worker is active
4. Backend is sending notifications correctly

---

## Files Modified

1. **src/utils/firebase-messaging.js**
   - Added service worker registration check
   - Uses existing SW instead of creating new one
   - Fixed MIME type error

2. **src/providers/NotificationProvider.jsx**
   - Added auto-sync effect for returning users with granted permissions
   - Optimized permission change handler to check localStorage first
   - Prevents duplicate token generation
   - Improved console logging for debugging

---

## Next Steps

1. ✅ Test the notification flow end-to-end
2. ✅ Verify no console errors
3. ✅ Send a test notification from backend
4. ✅ Test on mobile devices (iOS Safari, Android Chrome)
5. Consider adding notification settings page for users to manage preferences
