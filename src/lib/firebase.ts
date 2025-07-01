
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

// Import Firestore conditionally to avoid unnecessary connections
const USE_FIRESTORE = false; // Set to false since you're using Realtime Database

// Default configuration for testing/development - DO NOT use in production
const defaultConfig = {
  // Use a valid demo Firebase API key for development
  apiKey: "AIzaSyDemo-Key-For-Development-Only-Replace-In-Production",
  authDomain: "parkinson-disease-1deeb.firebaseapp.com",
  projectId: "parkinson-disease-1deeb",
  storageBucket: "parkinson-disease-1deeb.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  databaseURL: "https://parkinson-disease-1deeb-default-rtdb.firebaseio.com"
};

// Check if Firebase environment variables are properly configured
const hasValidFirebaseConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ];
  
  return requiredVars.every(varName => {
    const value = import.meta.env[varName];
    return value && value.length > 0 && !value.includes('your-') && !value.includes('demo');
  });
};

// Firebase configuration - use environment variables or disable Firebase
const firebaseConfig = hasValidFirebaseConfig() ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
} : null;

// Initialize Firebase
let app = null;
let database = null;
let auth = null;
let realtimeDb = null;
let db = null;

if (firebaseConfig) {
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

  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize Firebase services
    database = getDatabase(app);
    auth = getAuth(app);
    realtimeDb = database; // Alias for compatibility
    
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Don't show error toast immediately, let the app handle offline mode gracefully
  }
} else {
  console.log("Firebase configuration not available. Running in offline mode.");
  // Show info message about offline mode
  setTimeout(() => {
    toast.info("Running in offline mode. Some features may be limited.", {
      duration: 4000,
      description: "Configure Firebase environment variables for full functionality."
    });
  }, 2000);
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
