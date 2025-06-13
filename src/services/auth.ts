import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  updateProfile
} from 'firebase/auth';
import { auth as firebaseAuth, saveUserData, getUserData } from '@/lib/firebase';

const auth = firebaseAuth;
const googleProvider = new GoogleAuthProvider();

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  try {
    console.log('Attempting login for:', data.email);
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    // Save login data to Realtime Database
    await saveUserData(user.uid, {
      email: user.email!,
      displayName: user.displayName || user.email!.split('@')[0],
      lastLogin: Date.now()
    });
    
    console.log('Login successful for:', user.email);
    return user;
  } catch (error: any) {
    console.error('Login error:', error.code, error.message);
    throw error;
  }
};

export const signup = async (data: SignupData) => {
  try {
    console.log('Attempting signup for:', data.email);
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: data.name
    });
    
    // Save user data to Realtime Database
    await saveUserData(user.uid, {
      email: user.email!,
      displayName: data.name,
      createdAt: Date.now(),
      lastLogin: Date.now()
    });
    
    console.log('Signup successful for:', user.email);
    return user;
  } catch (error: any) {
    console.error('Signup error:', error.code, error.message);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    console.log('Attempting Google login');
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google login error:', error.code, error.message);
    throw error;
  }
};

export const handleGoogleRedirect = async () => {
  try {
    console.log('Handling Google redirect');
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Save Google login data to Realtime Database
      await saveUserData(result.user.uid, {
        email: result.user.email!,
        displayName: result.user.displayName || result.user.email!.split('@')[0],
        lastLogin: Date.now()
      });
      console.log('Google login successful for:', result.user.email);
    }
    return result?.user;
  } catch (error: any) {
    console.error('Google redirect error:', error.code, error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    console.log('Attempting logout');
    await signOut(auth);
    console.log('Logout successful');
  } catch (error: any) {
    console.error('Logout error:', error.code, error.message);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  const user = auth.currentUser;
  console.log('Current user:', user?.email);
  return user;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('Setting up auth state listener');
  return onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user?.email);
    if (user) {
      // Get user data from Realtime Database
      const userData = await getUserData(user.uid);
      console.log('User data from database:', userData);
    }
    callback(user);
  });
}; 