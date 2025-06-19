import React, { useState, useContext } from 'react';
import { UserContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { testFirebaseConnection, testVoiceHistoryWrite } from '../utils/firebaseTest';

const DebugFirebase: React.FC = () => {
  const { user } = useContext(UserContext);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runFullDebug = async () => {
    if (!user?.id) {
      toast.error('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { ref, get, getDatabase } = await import('firebase/database');
      const { app } = await import('@/lib/firebase');
      const database = getDatabase(app);

      console.log('=== FULL FIREBASE DEBUG ===');
      console.log('Current user:', user);
      console.log('User ID:', user.id);

      const results: any = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        paths: {}
      };

      // Check multiple possible paths
      const pathsToCheck = [
        `users/${user.id}`,
        `users/${user.id}/profile`,
        `users/${user.id}/voiceHistory`,
        `users/${user.id}/assessments`,
        `users/${user.id}/realtime`,
        `voiceHistory/${user.id}`,
        `assessments/${user.id}`,
        `userProfiles/${user.id}`
      ];

      for (const path of pathsToCheck) {
        try {
          const snapshot = await get(ref(database, path));
          results.paths[path] = {
            exists: snapshot.exists(),
            data: snapshot.exists() ? snapshot.val() : null,
            keys: snapshot.exists() && typeof snapshot.val() === 'object' ? Object.keys(snapshot.val()) : []
          };
          console.log(`Path ${path}:`, results.paths[path]);
        } catch (error) {
          results.paths[path] = { error: error.message };
          console.error(`Error checking path ${path}:`, error);
        }
      }

      // Check if there are any users at all
      try {
        const allUsersSnapshot = await get(ref(database, 'users'));
        if (allUsersSnapshot.exists()) {
          const allUsers = allUsersSnapshot.val();
          results.allUserIds = Object.keys(allUsers);
          console.log('All user IDs in database:', results.allUserIds);
          
          // Check if current user ID exists in the list
          results.currentUserExists = results.allUserIds.includes(user.id);
          console.log('Current user exists in database:', results.currentUserExists);
        } else {
          results.allUserIds = [];
          results.currentUserExists = false;
          console.log('No users found in database');
        }
      } catch (error) {
        console.error('Error checking all users:', error);
        results.allUsersError = error.message;
      }

      setDebugResults(results);
      
      // Show summary
      const hasData = Object.values(results.paths).some((path: any) => path.exists);
      toast.success(`Debug complete. User has data: ${hasData}`);

    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Debug failed - check console');
    } finally {
      setLoading(false);
    }
  };

  const checkSpecificUserId = async (userId: string) => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      const { ref, get, getDatabase } = await import('firebase/database');
      const { app } = await import('@/lib/firebase');
      const database = getDatabase(app);

      const snapshot = await get(ref(database, `users/${userId}`));
      if (snapshot.exists()) {
        console.log(`Data for user ${userId}:`, snapshot.val());
        toast.success(`Found data for user ${userId}`);
      } else {
        console.log(`No data found for user ${userId}`);
        toast.info(`No data found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Error checking user');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p><strong>Current User:</strong> {user?.email} ({user?.id})</p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={runFullDebug} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Running Debug...' : 'Run Full Firebase Debug'}
              </Button>
              
              <Button 
                onClick={() => testFirebaseConnection(user?.id || '')} 
                disabled={loading || !user?.id}
                variant="outline"
                className="w-full"
              >
                Test Firebase Connection
              </Button>
              
              <Button 
                onClick={() => testVoiceHistoryWrite(user?.id || '')} 
                disabled={loading || !user?.id}
                variant="outline"
                className="w-full"
              >
                Test Voice History Write
              </Button>
            </div>

            {debugResults && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold mb-2">Debug Results:</h3>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugFirebase;