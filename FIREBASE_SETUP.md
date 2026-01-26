# Firebase Push Notifications Setup Guide

This guide will help you configure Firebase Cloud Messaging (FCM) for push notifications in the application.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Your app registered with Firebase

## Step 1: Get Firebase Configuration

1. Go to your Firebase Console
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on the web app (</>) icon or select your existing web app
7. Copy the Firebase configuration object

## Step 2: Configure Environment Variables

Create or update your `.env` file with the following Firebase configuration:

```env
# API Configuration
VITE_API_URL=http://127.0.0.1:5001/app

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

## Step 3: Get VAPID Key (Web Push Certificates)

1. In Firebase Console, go to Project Settings
2. Navigate to the "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Under "Web Push certificates", click "Generate key pair"
5. Copy the key pair (this is your VAPID key)
6. Add it to your `.env` file as `VITE_FIREBASE_VAPID_KEY`

## Step 4: Update Service Worker Configuration

Update the Firebase configuration in `/public/sw.js`:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
};
```

**Important:** The configuration in `sw.js` should match the environment variables in `.env`.

## Step 5: Enable Cloud Messaging in Firebase

1. In Firebase Console, go to "Cloud Messaging"
2. Enable the "Cloud Messaging API" if not already enabled
3. Note: You may need to enable the Cloud Messaging API in Google Cloud Console as well

## Step 6: Add PWA Icons (Optional but Recommended)

For better notification display, add PWA icons to the `public` folder:

1. Create icons in these sizes: 192x192, 512x512
2. Save them as `pwa-192x192.png` and `pwa-512x512.png` in the `public` folder
3. These icons will be used in notifications and when the app is installed on mobile devices

You can use tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## How Push Notifications Work in This App

### Global PWA Implementation

Push notifications are implemented at the application level (not page-specific), making them available throughout the entire PWA:

1. **NotificationProvider**: Wraps the entire app and manages notification state globally
2. **NotificationPromptBanner**: Shows a banner after 3 seconds of user login, prompting them to enable notifications
3. **NotificationToast**: Displays in-app toast notifications when messages arrive in the foreground
4. **Service Worker**: Handles background notifications when the app is closed or in another tab

### User Experience Flow

1. User logs into the app
2. After 3 seconds, a notification prompt banner appears at the top
3. User clicks "Enable Notifications":
   - Browser requests notification permission
   - FCM token is generated
   - Token is saved to the backend via `/fcm-token` endpoint
   - User can now receive push notifications for all types (attendance, homework, exams, broadcasts)
4. When notifications arrive:
   - **App in foreground**: Shows toast notification in app
   - **App in background/closed**: Shows system notification via service worker

### Notification Types

The app supports various notification categories:

1. **ATTENDANCE**: Attendance marked/updated notifications
2. **HOMEWORK**: New homework assignments or submission reminders
3. **EXAM**: Exam schedules, results, or updates
4. **BROADCAST**: Important announcements from staff
5. **SYSTEM**: System-wide notifications

### Notification Delivery Modes

1. **Background Notifications**: When the app is closed or in the background
   - Handled by the service worker (`/public/sw.js`)
   - Shows as system notifications
   - User can click to open the app

2. **Foreground Notifications**: When the app is open
   - Handled by `NotificationProvider` and displayed via `NotificationToast`
   - Shows as in-app toast notifications with icons based on type
   - Auto-dismisses after 5 seconds
   - Clickable to navigate to relevant pages

### Backend Requirements

Your backend needs to implement:

1. **Save FCM Token Endpoint**: `POST /fcm-token`
   ```json
   {
     "user_id": "student_id",
     "role": "student",
     "token": "fcm_token_string"
   }
   ```

2. **Send Notification**: Use Firebase Admin SDK to send notifications

   #### Example: Attendance Notification
   ```javascript
   // Example using Firebase Admin SDK (Node.js)
   const admin = require('firebase-admin');
   
   admin.messaging().send({
     token: userFCMToken,
     notification: {
       title: 'Attendance Marked',
       body: 'Your attendance has been marked as Present for Period 1'
     },
     data: {
       type: 'ATTENDANCE',
       date: '2026-01-26',
       status: 'PRESENT',
       period: 'PERIOD_1',
       url: '/student/attendance' // Optional: where to navigate on click
     }
   });
   ```

   #### Example: Homework Notification
   ```javascript
   admin.messaging().send({
     token: userFCMToken,
     notification: {
       title: 'New Homework Assignment',
       body: 'Mathematics: Complete exercises 1-10, Due: Jan 30'
     },
     data: {
       type: 'HOMEWORK',
       homework_id: '12345',
       subject: 'Mathematics',
       due_date: '2026-01-30',
       url: '/student/homework/12345'
     }
   });
   ```

   #### Example: Exam Notification
   ```javascript
   admin.messaging().send({
     token: userFCMToken,
     notification: {
       title: 'Exam Results Published',
       body: 'Your Science exam results are now available'
     },
     data: {
       type: 'EXAM',
       exam_id: '67890',
       subject: 'Science',
       url: '/student/exams/67890'
     }
   });
   ```

   #### Example: Broadcast Notification
   ```javascript
   admin.messaging().send({
     token: userFCMToken,
     notification: {
       title: 'Important Announcement',
       body: 'School will remain closed tomorrow due to weather conditions'
     },
     data: {
       type: 'BROADCAST',
       broadcast_id: '555',
       priority: 'high',
       url: '/student/home'
     }
   });
   ```

   #### Send to Multiple Users (Topic-based)
   ```javascript
   // Subscribe users to topics (e.g., by class/section)
   admin.messaging().subscribeToTopic(
     [token1, token2, token3],
     'class_10A'
   );

   // Send to topic
   admin.messaging().send({
     topic: 'class_10A',
     notification: {
       title: 'Class Announcement',
       body: 'Tomorrow\'s class is rescheduled to 10 AM'
     },
     data: {
       type: 'BROADCAST',
       class: '10A'
     }
   });
   ```

## Testing Push Notifications

### Test with Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (check browser console for the token)
6. Click "Test"

### Test with Backend

1. Ensure the student has enabled notifications
2. Trigger an attendance event from your backend
3. Backend should send push notification using Firebase Admin SDK
4. Student should receive the notification

## Troubleshooting

### Notification Permission Denied
- Clear browser data and refresh the page
- Check browser notification settings
- Some browsers block notifications by default in incognito mode

### FCM Token Not Generated
- Ensure Firebase configuration is correct
- Check browser console for errors
- Verify VAPID key is correct
- Check if service worker is registered properly

### Notifications Not Received
- Verify FCM token is saved in backend
- Check Firebase Cloud Messaging is enabled
- Ensure backend is using the correct FCM token
- Check notification payload format

### Service Worker Not Registered
- Clear cache and reload
- Check service worker registration in browser DevTools (Application → Service Workers)
- Ensure `vite-plugin-pwa` is properly configured

## Security Considerations

1. **Environment Variables**: Never commit `.env` file with real Firebase credentials
2. **VAPID Key**: Keep your VAPID key private
3. **Token Storage**: Store FCM tokens securely in your backend
4. **Token Refresh**: Implement token refresh logic (tokens can expire or change)

## Next Steps

1. Configure Firebase as described above
2. Update your backend to handle FCM tokens
3. Implement notification sending logic in your backend
4. Test notifications in different scenarios
5. Customize notification UI/UX as needed

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
