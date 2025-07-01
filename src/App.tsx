import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { createContext, useState, useEffect } from 'react';
import { ref, get, getDatabase } from 'firebase/database';
import { app } from './lib/firebase';
import { onAuthStateChange, UserData } from '@/services/firebaseAuth';

// Debug utilities for development
import '@/utils/geminiDebug';

// Auth Components
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Layout
import Layout from './components/Layout';

// Main Pages
import Landing from './pages/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import History from './pages/History';
import SymptomChecker from './pages/SymptomChecker';
import Results from './pages/Results';
import Resources from './pages/Resources';
import NotFound from './pages/NotFound';
import AboutPage from './pages/About'; // Import the new About page
import MultiModelAnalysis from './pages/MultiModelAnalysis'; // Import the new multi-model analysis page

// Voice Analysis Components
import EnhancedVoiceRecorder from './components/EnhancedVoiceRecorder';
import { VoiceAnalysisForm } from './components/VoiceAnalysis/VoiceAnalysisForm';
import { RealTimeAnalysis } from './components/VoiceAnalysis/RealTimeAnalysis';
import { PredictionVisualization } from './components/VoiceAnalysis/PredictionVisualization';

// Account & Profile
import UserAccount from './components/UserAccount';
import ProfileEditor from './components/ProfileEditor';

// Create a user context to manage authentication state
interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isDarkMode: boolean; // Added isDarkMode
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  theme: 'light',
  setTheme: () => {},
  isDarkMode: false, // Added default for isDarkMode
});

const App = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const database = getDatabase(app);
  
  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Use system preference if no saved preference
      setTheme('dark');
    }
    
    // Initial class will be set by the theme effect
  }, []);

  useEffect(() => {
    // Update theme in localStorage and document class when theme changes
    localStorage.setItem('theme', theme);
    
    // Remove both classes first to ensure clean state
    document.documentElement.classList.remove('light', 'dark');
    // Add the appropriate class
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Check for user in local storage on app initialization
    const savedUserString = localStorage.getItem('user');
    if (savedUserString) {
      try {
        const parsedData = JSON.parse(savedUserString);
        // Ensure createdAt is a Date object if it exists and is a string
        if (parsedData && parsedData.createdAt && typeof parsedData.createdAt === 'string') {
          parsedData.createdAt = new Date(parsedData.createdAt);
        }
        setUser(parsedData as UserData);
      } catch (e) {
        console.error("Failed to parse user data from localStorage or convert createdAt:", e);
        localStorage.removeItem('user'); // Clean up potentially corrupted data
      }
    }

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from the database
          const snapshot = await get(ref(database, `users/${firebaseUser.uid}/profile`));
          if (snapshot.exists()) {
            const userDataFromDb = snapshot.val();
            const userToSet: UserData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || userDataFromDb.displayName,
              email: firebaseUser.email || userDataFromDb.email,
              // Ensure createdAt from DB is also consistently a Date object
              createdAt: userDataFromDb.createdAt ? new Date(userDataFromDb.createdAt) : new Date()
            };
            setUser(userToSet);
            localStorage.setItem('user', JSON.stringify(userToSet));
          } else {
            // Basic user data if profile doesn't exist yet
            const userToSet: UserData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              createdAt: new Date() // Ensure this is a Date object
            };
            setUser(userToSet);
            localStorage.setItem('user', JSON.stringify(userToSet));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Consider setUser(null) and localStorage.removeItem('user') here if critical fetch error
        }
      } else {
        // No user is signed in
        setUser(null);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // `database` is stable, so empty dependency array is fine.

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
      <UserContext.Provider value={{ user, setUser, isLoading, theme, setTheme, isDarkMode: theme === 'dark' }}>
      <Router>
        <Toaster position="top-right" />
        <AnimatePresence mode="wait">
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/app/dashboard" replace /> : <LoginForm />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/app/dashboard" replace /> : <SignupForm />}
            />
            {/* Redirect for top-level /history to /app/history */}
            <Route path="/history" element={<Navigate to="/app/history" replace />} />
            
            {/* Redirect for top-level /symptom-checker to /app/symptom-check */}
            <Route path="/symptom-checker" element={<Navigate to="/app/symptom-check" replace />} />

            {/* Public Information Routes with Layout */}
            <Route element={<Layout />}>
              <Route path="/resources" element={<Resources />} />
              <Route path="/about" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">About Parkinson Insight</h1>
                    <p className="mb-4">
                      Parkinson Insight is an application designed to help monitor and analyze symptoms of Parkinson's disease using voice analysis and machine learning techniques.
                    </p>
                  </div>
                </motion.div>
              } />
              <Route path="/docs" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Documentation</h1>
                    <p className="mb-4">Application documentation and user guides.</p>
                  </div>
                </motion.div>
              } />
              <Route path="/api-demo" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">API Demonstration</h1>
                    <p className="mb-4">Try out our Parkinson's prediction API.</p>
                  </div>
                </motion.div>
              } />
            </Route>
            
            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              
              {/* Main Dashboard */}
              <Route
                path="dashboard"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dashboard />
                  </motion.div>
                }
              />
              
              {/* Voice Analysis with nested routes */}
              <Route path="analysis">
                <Route index element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SymptomChecker />
                  </motion.div>
                } />
                <Route path="record" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EnhancedVoiceRecorder onVoiceAnalyzed={() => {}} />
                  </motion.div>
                } />
                <Route path="manual-input" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VoiceAnalysisForm />
                  </motion.div>
                } />
                <Route path="real-time" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RealTimeAnalysis />
                  </motion.div>
                } />
                <Route path="visualization" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PredictionVisualization 
                      predictions={[
                        {
                          timestamp: new Date().toISOString(),
                          severity: 45,
                          confidence: 0.85,
                          metrics: {
                            pitch: 120,
                            jitter: 0.01,
                            shimmer: 0.05,
                            hnr: 15
                          }
                        }
                      ]} 
                    />
                  </motion.div>
                } />
              </Route>
              
              {/* Alternative path for voice analysis */}
              <Route path="voice-analysis" element={<Navigate to="/app/analysis" replace />} />
              
              {/* Redirect for symptom-checker to symptom-check */}
              <Route path="symptom-checker" element={<Navigate to="/app/symptom-check" replace />} />
              
              {/* Multi-Model Analysis */}
              <Route path="multi-model-analysis" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MultiModelAnalysis />
                </motion.div>
              } />
              
              {/* Symptom Analysis */}
              <Route path="symptom-check" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SymptomChecker />
                </motion.div>
              } />
              
              {/* Results */}
              <Route path="results" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Results />
                </motion.div>
              } />
              
              {/* History */}
              <Route path="history" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <History />
                </motion.div>
              } />
              
              {/* Profile and Account Management */}
              <Route path="profile" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserAccount />
                </motion.div>
              } />
              
              {/* Account route (alias for profile) */}
              <Route path="account" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserAccount />
                </motion.div>
              } />
              
              {/* Help & Support */}
              <Route path="help" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="container mx-auto px-8 py-8">
                    <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
                    <p className="mb-4">Help documentation and support resources will be available here.</p>
                  </div>
                </motion.div>
              } />
              <Route path="about" element={<AboutPage />} /> {/* Add route for About page */}
            </Route>

            {/* Catch all route */}
            <Route path="*" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <NotFound />
              </motion.div>
            } />
              </Routes>
        </AnimatePresence>
      </Router>
      </UserContext.Provider>
  );
};

export default App;
