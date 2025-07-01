
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { ref, set, get, child } from "firebase/database";
import { app, database, auth } from "@/lib/firebase";
import { toast } from "sonner";

// Use either the imported auth or create a new one if the import failed
const firebaseAuth = auth || getAuth(app);
// Use either the imported database or null
const db = database;

export interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const createUser = async (name: string, email: string, password: string): Promise<UserData> => {
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
    if (db) {
      await set(ref(db, `users/${user.uid}/profile`), {
        displayName: name,
        email: email,
        createdAt: timestamp,
        lastLogin: timestamp
      });
    }
    
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
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    
    // Update last login time
    const timestamp = new Date().getTime();
    
    if (db) {
      try {
        // Get user profile data
        const snapshot = await get(child(ref(db), `users/${user.uid}/profile`));
        
        if (snapshot.exists()) {
          // Update last login
          await set(ref(db, `users/${user.uid}/profile/lastLogin`), timestamp);
          
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
          
          await set(ref(db, `users/${user.uid}/profile`), userData);
          
          return {
            id: user.uid,
            name: userData.displayName,
            email: userData.email,
            createdAt: new Date(timestamp)
          };
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Fall back to user data from auth
        return {
          id: user.uid,
          name: user.displayName || email.split('@')[0],
          email: user.email || email,
          createdAt: new Date()
        };
      }
    } else {
      // No database, just return auth user data
      return {
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email || email,
        createdAt: new Date()
      };
    }
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw new Error(error.message || "Failed to sign in");
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};

export const getCurrentUser = (): User | null => {
  return firebaseAuth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(firebaseAuth, callback);
};
