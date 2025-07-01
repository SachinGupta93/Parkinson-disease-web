
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { ref, set, get, child } from "firebase/database";
import { app, database, auth } from "@/lib/firebase";
import { toast } from "sonner";

// Use the imported auth only if Firebase is properly initialized
const firebaseAuth = auth;
// Initialize Google Auth Provider only if auth is available
let googleProvider = null;
if (firebaseAuth) {
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Google sign in function
export const signInWithGoogle = async (): Promise<UserData> => {
  if (!firebaseAuth || !googleProvider) {
    throw new Error("Firebase authentication is not available. Please configure Firebase properly.");
  }
  
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const user = result.user;
    
    // Check if user already exists in database
    const userSnapshot = await get(child(ref(database), `users/${user.uid}/profile`));
    const timestamp = new Date().getTime();
    
    if (!userSnapshot.exists()) {
      // Create new user profile
      await set(ref(database, `users/${user.uid}/profile`), {
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        createdAt: timestamp,
        lastLogin: timestamp
      });
    } else {
      // Update last login time
      await set(ref(database, `users/${user.uid}/profile/lastLogin`), timestamp);
    }
    
    // Get user profile data
    const snapshot = await get(child(ref(database), `users/${user.uid}/profile`));
    const userData = snapshot.val();
    
    return {
      id: user.uid,
      name: user.displayName || userData.displayName,
      email: user.email || userData.email,
      createdAt: new Date(userData.createdAt || timestamp)
    };
    
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
};

export const createUser = async (name: string, email: string, password: string): Promise<UserData> => {
  if (!firebaseAuth || !database) {
    throw new Error("Firebase authentication is not available. Please configure Firebase properly.");
  }
  
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    
    // Update profile with name
    await updateProfile(user, {
      displayName: name
    });
    
    // Save additional user data to Realtime Database
    const timestamp = new Date().getTime();
    await set(ref(database, `users/${user.uid}/profile`), {
      displayName: name,
      email: email,
      createdAt: timestamp,
      lastLogin: timestamp
    });
    
    return {
      id: user.uid,
      name: name,
      email: email,
      createdAt: new Date(timestamp)
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw new Error(error.message || "Failed to create account");
  }
};

export const signIn = async (email: string, password: string): Promise<UserData> => {
  if (!firebaseAuth || !database) {
    throw new Error("Firebase authentication is not available. Please configure Firebase properly.");
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    
    // Update last login time
    const timestamp = new Date().getTime();
    
    // Check if the profile exists before updating lastLogin
    try {
      const profileSnapshot = await get(child(ref(database), `users/${user.uid}/profile`));
      
      if (profileSnapshot.exists()) {
        await set(ref(database, `users/${user.uid}/profile/lastLogin`), timestamp);
      } else {
        // Create minimal profile if it doesn't exist
        await set(ref(database, `users/${user.uid}/profile`), {
          email: user.email,
          displayName: user.displayName || email.split('@')[0] || 'User',
          createdAt: timestamp,
          lastLogin: timestamp
        });
      }
    } catch (profileError) {
      console.error("Error checking/updating profile:", profileError);
    }
    
    // Get user profile data
    const snapshot = await get(child(ref(database), `users/${user.uid}/profile`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        id: user.uid,
        name: user.displayName || userData.displayName,
        email: user.email || userData.email,
        createdAt: new Date(userData.createdAt)
      };
    } else {
      // If profile doesn't exist yet, create basic profile
      const userData = {
        displayName: user.displayName || email.split('@')[0],
        email: user.email,
        createdAt: timestamp,
        lastLogin: timestamp
      };
      
      await set(ref(database, `users/${user.uid}/profile`), userData);
      
      return {
        id: user.uid,
        name: userData.displayName,
        email: userData.email,
        createdAt: new Date(timestamp)
      };
    }
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw new Error(error.message || "Failed to sign in");
  }
};

export const signOut = async (): Promise<void> => {
  if (!firebaseAuth) {
    console.warn("Firebase authentication is not available.");
    return;
  }
  
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};

export const getCurrentUser = (): User | null => {
  if (!firebaseAuth) {
    return null;
  }
  return firebaseAuth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!firebaseAuth) {
    // Call callback with null user if Firebase is not available
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(firebaseAuth, callback);
};
