# Digi School - User Facing App (PWA)

A Progressive Web App for educational management system built with React, Vite, and Firebase Cloud Messaging.

## Features

- 📱 **Progressive Web App** - Installable, offline-capable
- 🔔 **Push Notifications** - Real-time notifications for attendance, homework, exams, and broadcasts
- 🎨 **Theme Support** - Light/Dark mode with role-based themes
- 📊 **Student Portal** - View attendance, homework, exams
- 👨‍🏫 **Staff Portal** - Manage attendance, assignments, and exams
- 🔐 **Authentication** - Secure login system

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Firebase** - Push notifications (FCM)
- **Axios** - HTTP client
- **Workbox** - Service worker & PWA capabilities

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
4. Configure Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

5. Start the development server:
   ```bash
   npm run dev
   ```

## Push Notifications

This app implements a global push notification system using Firebase Cloud Messaging (FCM). Notifications work across the entire app for:

- ✅ Attendance updates
- ✅ Homework assignments
- ✅ Exam schedules and results
- ✅ School broadcasts and announcements
- ✅ System notifications

### Documentation

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Complete Firebase configuration guide
- **[PUSH_NOTIFICATIONS_IMPLEMENTATION.md](./PUSH_NOTIFICATIONS_IMPLEMENTATION.md)** - Technical implementation details

### Quick Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add your Firebase config to `.env`
3. Update Firebase config in `public/sw.js`
4. Implement the `/fcm-token` endpoint in your backend
5. Send notifications using Firebase Admin SDK

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

## Project Structure

```
src/
├── api/              # API client functions
├── components/       # React components
│   ├── attendance/
│   ├── homework/
│   ├── NotificationPromptBanner.jsx
│   └── NotificationToast.jsx
├── pages/            # Page components
│   ├── student/
│   └── staff/
├── providers/        # Context providers
│   ├── ThemeProvider.jsx
│   └── NotificationProvider.jsx
├── store/            # Zustand stores
├── ui-components/    # Reusable UI components
├── utils/            # Utility functions
│   ├── routes/
│   └── firebase-messaging.js
├── App.jsx
└── main.jsx
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Required environment variables:

```env
# API
VITE_API_URL=http://127.0.0.1:5001/app

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

**Note**: Push notifications on iOS Safari require iOS 16.4+ and macOS 13+.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
