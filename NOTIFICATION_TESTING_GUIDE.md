# 🔔 Notification Testing Guide

## Step 1: Get Your VAPID Key (CRITICAL!)

The VAPID key is **required** for FCM token generation. Without it, you won't receive notifications.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `project-f3d5a115-432b-432d-ad2`
3. Click the **gear icon** ⚙️ > **Project Settings**
4. Go to **Cloud Messaging** tab
5. Scroll to **Web configuration** > **Web Push certificates**
6. If you see a key pair, **copy the Key pair value**
7. If no key exists, click **Generate key pair**
8. Add it to your `.env` file:
   ```
   VITE_FIREBASE_VAPID_KEY=YOUR_ACTUAL_VAPID_KEY_HERE
   ```
9. **Restart your dev server** after updating .env

## Step 2: Check Your Setup

1. Open your app in the browser
2. Open **DevTools Console** (F12 or Cmd+Option+I)
3. You should see a debug output starting with `🔍 Notification Setup Debug`
4. Verify all items show ✅, especially the **VAPID Key**

## Step 3: Enable Notifications

1. Trigger the notification prompt (banner/button in your app)
2. Click **Allow** when browser asks for permission
3. Watch the console for these logs:
   ```
   🔔 enableNotifications called
   📱 Permission granted: true
   🎫 Requesting FCM token...
   ✅ FCM Token obtained: [your-token]
   📤 Sending token to backend...
   ✅ FCM token saved successfully to backend
   ```
4. You should see a notification: **"Notifications Enabled"**

## Step 4: Test Receiving Notifications

### Option A: Test from Firebase Console

1. Go to Firebase Console > **Engage** > **Messaging**
2. Click **Create your first campaign** > **Firebase Notification messages**
3. Fill in:
   - **Notification title**: "Test Notification"
   - **Notification text**: "Testing from Firebase Console"
4. Click **Next** > Select **User segment** > **All users**
5. Click **Review** > **Publish**

### Option B: Test with curl (Backend)

If you have a backend API to send notifications:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_FCM_TOKEN_FROM_CONSOLE",
    "notification": {
      "title": "Test from Backend",
      "body": "This is a test notification"
    },
    "data": {
      "type": "test",
      "url": "/"
    }
  }'
```

Replace:
- `YOUR_SERVER_KEY`: Get from Firebase Console > Project Settings > Cloud Messaging > Server key
- `YOUR_FCM_TOKEN_FROM_CONSOLE`: The token logged in console (or from localStorage)

### Option C: Manual Console Test

In your browser console, run:

```javascript
// Debug your setup
debugNotifications()

// Send a test notification (if permission granted)
testNotification()
```

## Step 5: Check for Messages

### Foreground (App is open):
- Open **Console** in DevTools
- Look for: `Message received in foreground: [payload]`
- Check the **NotificationToast** component appears on screen

### Background (App is closed/minimized):
- Minimize or close the browser tab
- Send a notification from Firebase Console
- You should see a **system notification** from your OS

## Common Issues & Solutions

### ❌ "No registration token available"
- **Cause**: Missing VAPID key
- **Fix**: Add `VITE_FIREBASE_VAPID_KEY` to `.env` and restart dev server

### ❌ "Firebase messaging not initialized"
- **Cause**: Invalid Firebase config in `.env`
- **Fix**: Verify all Firebase env variables are correct (no quotes, no commas)

### ❌ "Service worker registration failed"
- **Cause**: Not running on HTTPS or localhost
- **Fix**: Use `localhost` for development or deploy to HTTPS

### ❌ Token generated but not receiving notifications
- **Cause**: 
  1. Token not sent to backend correctly
  2. Backend not configured properly
  3. Service worker not registered
- **Fix**: 
  1. Check backend API logs
  2. Verify service worker is active: `navigator.serviceWorker.getRegistration()`
  3. Check Application tab > Service Workers in DevTools

### ❌ Receiving notifications but not showing
- **Cause**: Browser notifications blocked at OS level
- **Fix**: 
  - **Mac**: System Settings > Notifications > [Your Browser]
  - **Windows**: Settings > Notifications > [Your Browser]

## Debugging Checklist

- [ ] VAPID key added to `.env`
- [ ] Dev server restarted after `.env` update
- [ ] Browser permission set to "Allow"
- [ ] Console shows "✅ FCM Token obtained"
- [ ] Token saved to backend successfully
- [ ] Service worker is active (check DevTools > Application > Service Workers)
- [ ] Firebase project has Cloud Messaging API enabled
- [ ] Sending notifications to the correct FCM token
- [ ] Notification payload format is correct (has `notification` object)

## Notification Payload Format

When sending from your backend, use this format:

```json
{
  "token": "user-fcm-token-here",
  "notification": {
    "title": "Your Title",
    "body": "Your message",
    "icon": "/pwa-192x192.png"
  },
  "data": {
    "type": "announcement",
    "url": "/dashboard"
  }
}
```

## Need Help?

Run in console to see your current setup:
```javascript
debugNotifications()
```

This will show you exactly what's missing or misconfigured.
