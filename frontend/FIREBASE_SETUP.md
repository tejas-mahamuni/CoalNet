# Firebase Authentication Setup Guide

## 🚀 Quick Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "coalnet-zero")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (`</>`)
4. Register your app with a nickname (e.g., "CoalNet Frontend")
5. Copy the Firebase configuration object

### 4. Update Environment Variables
1. Copy `.env.example` to `.env.local`
2. Replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Test Authentication
1. Run `npm run dev`
2. Navigate to `/auth` route
3. Try creating a new account
4. Test login/logout functionality

## 🔧 Features Implemented

- ✅ **Email/Password Authentication**
- ✅ **User Registration with Display Name**
- ✅ **Protected Routes** (Dashboard, Input, Upload, Visualization)
- ✅ **User Profile Dropdown** in Navbar
- ✅ **Logout Functionality**
- ✅ **Loading States** and Error Handling
- ✅ **Responsive Design** with Glass Morphism UI
- ✅ **Toast Notifications** for Success/Error Messages

## 🛡️ Security Features

- **Protected Routes**: Unauthenticated users are redirected to login
- **Loading States**: Prevents flash of unauthenticated content
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side validation for better UX

## 📱 User Experience

- **Seamless Navigation**: Login button in navbar when not authenticated
- **User Avatar**: Shows user's initial in navbar when logged in
- **Smooth Transitions**: Glass morphism design with animations
- **Mobile Responsive**: Works on all device sizes

## 🔄 Next Steps

1. **Set up your Firebase project** using the steps above
2. **Update environment variables** with your actual Firebase config
3. **Test the authentication flow**
4. **Customize the UI** if needed
5. **Add additional authentication methods** (Google, GitHub, etc.)

## 🐛 Troubleshooting

- **"Firebase not initialized"**: Check your environment variables
- **"Authentication failed"**: Verify Firebase Auth is enabled
- **"Network error"**: Check your internet connection and Firebase project status
- **"Invalid API key"**: Double-check your Firebase configuration

## 📚 Documentation

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firebase Console](https://console.firebase.google.com/)
