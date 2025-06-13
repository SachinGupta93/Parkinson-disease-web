import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, signIn as firebaseSignIn, signOut, UserData } from '@/services/firebaseAuth';

// Helper function to convert Firebase User to UserData
export const convertUserToUserData = (user: User | null): UserData | null => {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.displayName || 'User',
    email: user.email || '',
    createdAt: new Date()
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setUserData(convertUserToUserData(user));
      setLoading(false);
      
      // Handle auth state changes
      if (user) {
        console.log("User authenticated:", user.uid);
      } else {
        console.log("User signed out or not authenticated");
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userData = await createUser(displayName, email, password);
      return userData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const user = await firebaseSignIn(email, password);
      return user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };
  const logout = async () => {
    try {
      setError(null);
      await signOut();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    register,
    login,
    logout
  };
}; 