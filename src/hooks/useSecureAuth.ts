import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfileService } from '@/services/userDataService';

export interface SecureUserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  isAnonymous: boolean;
}

interface AuthState {
  user: SecureUserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  // Validate user context for security
  const validateUserContext = useCallback((user: User | null): boolean => {
    if (!user) return false;
    
    // Check for required fields
    if (!user.uid || user.uid.trim().length === 0) {
      console.error('useSecureAuth: Invalid user UID');
      return false;
    }
    
    // Additional security checks
    if (user.uid.includes('..') || user.uid.includes('/')) {
      console.error('useSecureAuth: Potentially malicious user UID detected');
      return false;
    }
    
    return true;
  }, []);

  // Create secure user data object
  const createSecureUserData = useCallback(async (user: User): Promise<SecureUserData> => {
    const secureUserData: SecureUserData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
      lastLoginAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
      isAnonymous: user.isAnonymous
    };

    // Ensure user profile exists in database
    try {
      let profile = await UserProfileService.getProfile(user.uid);
      
      if (!profile) {
        // Create new profile
        const newProfile = {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          createdAt: secureUserData.createdAt.getTime(),
          lastLoginAt: secureUserData.lastLoginAt.getTime(),
          preferences: {
            theme: 'light' as const,
            notifications: true,
            dataSharing: false
          }
        };
        
        await UserProfileService.saveProfile(user.uid, newProfile);
        console.log(`useSecureAuth: Created new profile for user ${user.uid}`);
      } else {
        // Update last login time
        await UserProfileService.saveProfile(user.uid, {
          ...profile,
          lastLoginAt: secureUserData.lastLoginAt.getTime()
        });
        console.log(`useSecureAuth: Updated login time for user ${user.uid}`);
      }
    } catch (error) {
      console.error('useSecureAuth: Error managing user profile:', error);
      // Don't fail authentication due to profile errors
    }

    return secureUserData;
  }, []);

  // Handle authentication state changes
  const handleAuthStateChange = useCallback(async (user: User | null) => {
    try {
      if (user && validateUserContext(user)) {
        console.log(`useSecureAuth: User authenticated: ${user.uid}`);
        
        const secureUserData = await createSecureUserData(user);
        
        setAuthState({
          user: secureUserData,
          loading: false,
          error: null,
          isAuthenticated: true
        });

        // Log authentication event for security monitoring
        console.log('useSecureAuth: Authentication event', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          timestamp: new Date().toISOString()
        });
        
      } else {
        console.log('useSecureAuth: User not authenticated or invalid');
        
        setAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('useSecureAuth: Error in auth state change:', error);
      
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication error',
        isAuthenticated: false
      });
    }
  }, [validateUserContext, createSecureUserData]);

  // Set up authentication listener
  useEffect(() => {
    if (!auth) {
      console.warn('useSecureAuth: Firebase auth not initialized');
      setAuthState(prev => ({ ...prev, loading: false, error: 'Firebase not initialized' }));
      return;
    }

    console.log('useSecureAuth: Setting up authentication listener');
    
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange, (error) => {
      console.error('useSecureAuth: Authentication listener error:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error.message,
        isAuthenticated: false
      });
    });

    return () => {
      console.log('useSecureAuth: Cleaning up authentication listener');
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Security utilities
  const securityUtils = {
    // Check if current user can access specific data
    canAccessData: (dataUserId: string): boolean => {
      if (!authState.user) return false;
      return authState.user.uid === dataUserId;
    },

    // Get secure user context for API calls
    getSecureContext: () => {
      if (!authState.user) return null;
      return {
        uid: authState.user.uid,
        email: authState.user.email,
        timestamp: Date.now()
      };
    },

    // Validate user session
    validateSession: async (): Promise<boolean> => {
      try {
        if (!auth?.currentUser) return false;
        
        // Force token refresh to check if session is still valid
        await auth.currentUser.getIdToken(true);
        return true;
      } catch (error) {
        console.error('useSecureAuth: Session validation failed:', error);
        return false;
      }
    },

    // Log security events
    logSecurityEvent: (event: string, details?: any) => {
      const logData = {
        event,
        uid: authState.user?.uid,
        timestamp: new Date().toISOString(),
        ...details
      };
      console.log('SECURITY_EVENT:', logData);
      
      // In production, send to security monitoring service
      // securityMonitoringService.log(logData);
    }
  };

  return {
    ...authState,
    securityUtils
  };
};