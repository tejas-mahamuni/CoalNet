import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const hasRequiredConfig = firebaseConfig.apiKey && 
                          firebaseConfig.authDomain && 
                          firebaseConfig.projectId &&
                          firebaseConfig.storageBucket &&
                          firebaseConfig.messagingSenderId &&
                          firebaseConfig.appId;

if (!hasRequiredConfig) {
  console.error('Firebase configuration is missing required values. Please check your .env.local file.');
  console.error('Required environment variables:');
  console.error('VITE_FIREBASE_API_KEY');
  console.error('VITE_FIREBASE_AUTH_DOMAIN');
  console.error('VITE_FIREBASE_PROJECT_ID');
  console.error('VITE_FIREBASE_STORAGE_BUCKET');
  console.error('VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('VITE_FIREBASE_APP_ID');
  console.warn('Using placeholder config. App will work but Firebase features will not function.');
}

// Initialize Firebase with error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Use placeholder config if real config is missing
  const configToUse = hasRequiredConfig ? firebaseConfig : {
    apiKey: 'demo-key',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
    measurementId: 'G-XXXXXXXXXX',
  };

  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  // Create mock objects to prevent app crash
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

// Export Firebase services
export { auth };
export { db };

// Initialize Analytics (only if available)
let analytics: Analytics | undefined;
try {
  if (app && typeof window !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Firebase Analytics initialization failed:', error);
  console.warn('Analytics will be disabled. This is normal in development or if Analytics is not enabled.');
}
export { analytics };

export default app;
