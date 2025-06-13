
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

// Import Firestore conditionally to avoid unnecessary connections
const USE_FIRESTORE = false; // Set to false since you're using Realtime Database

// Default configuration for testing/development - DO NOT use in production
const defaultConfig = {
   // Replace the hardcoded API key with environment variable
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  authDomain: "parkinsons-mock-project.firebaseapp.com",
  projectId: "parkinsons-mock-project",
  storageBucket: "parkinsons-mock-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  databaseURL: "https://parkinsons-mock-project-default-rtdb.firebaseio.com"
};

// Firebase configuration - use environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || defaultConfig.databaseURL,
};

// Log configuration state without exposing sensitive values
console.log("Firebase configuration state:", {
  apiKey: firebaseConfig.apiKey ? "Set" : "Missing",
  authDomain: firebaseConfig.authDomain ? "Set" : "Missing",
  projectId: firebaseConfig.projectId ? "Set" : "Missing",
  storageBucket: firebaseConfig.storageBucket ? "Set" : "Missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "Set" : "Missing",
  appId: firebaseConfig.appId ? "Set" : "Missing",
  databaseURL: firebaseConfig.databaseURL ? "Set" : "Missing"
});

// Initialize Firebase
let app;
let database;
let auth;
let realtimeDb;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  
  // Initialize Firebase services
  database = getDatabase(app);
  auth = getAuth(app);
  realtimeDb = database; // Alias for compatibility
  
  // Show toast message for demo mode if using default config
  if (firebaseConfig.apiKey === defaultConfig.apiKey) {
    setTimeout(() => {
      toast.info("Using Firebase in demo mode. Some features are limited.", {
        duration: 6000,
        description: "Set up your own Firebase project for full functionality."
      });
    }, 2000);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  toast.error("Firebase initialization failed. Using offline mode.");
}

// Initialize Firestore only if needed (which it's not in this application)
if (USE_FIRESTORE && app) {
  // Dynamic import to avoid loading Firestore unless needed
  import("firebase/firestore").then(({ getFirestore }) => {
    db = getFirestore(app);
    console.log("Firestore initialized");
  }).catch(err => {
    console.warn("Firestore initialization skipped:", err.message);
  });
} else {
  console.log("Firestore initialization skipped - using Realtime Database only");
}

export { app, database, auth, realtimeDb, db };

// Helper functions for user data management with error handling
export const saveUserData = async (uid: string, userData: Record<string, any>) => {
  try {
    if (!database || !uid) {
      console.warn("Cannot save user data: database or uid is missing");
      return false;
    }
    
    await set(ref(database, `users/${uid}/profile`), userData);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

export const getUserData = async (uid: string) => {
  try {
    if (!database || !uid) {
      console.warn("Cannot get user data: database or uid is missing");
      return null;
    }
    
    const snapshot = await get(child(ref(database), `users/${uid}/profile`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Helper function to check Firebase connection status
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    if (!realtimeDb) {
      console.warn("Cannot check Firebase connection: database is not initialized");
      return false;
    }
    
    // Create a reference to a test location
    const testRef = ref(realtimeDb, '.info/connected');
    const snapshot = await get(testRef);
    
    // .info/connected is a special path that returns true when connected to Firebase
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
};
