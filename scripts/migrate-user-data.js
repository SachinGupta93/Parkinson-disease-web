/**
 * User Data Migration Script
 * Migrates existing data to secure user-isolated structure
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (requires service account key)
// You'll need to download service account key from Firebase Console
const serviceAccount = require('./firebase-service-account-key.json'); // You need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parkinson-disease-1deeb-default-rtdb.firebaseio.com'
});

const db = admin.database();

/**
 * Migrate user data to secure structure
 */
async function migrateUserData() {
  console.log('🔄 Starting user data migration...');
  
  try {
    // Get all users
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      console.log('❌ No users found to migrate');
      return;
    }
    
    const userIds = Object.keys(users);
    console.log(`📊 Found ${userIds.length} users to migrate`);
    
    for (const userId of userIds) {
      console.log(`\n🔄 Migrating data for user: ${userId}`);
      await migrateUserSpecificData(userId, users[userId]);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

/**
 * Migrate data for a specific user
 */
async function migrateUserSpecificData(userId, userData) {
  const migrations = [];
  
  try {
    // 1. Ensure voice history has proper structure
    if (userData.voiceHistory) {
      console.log(`  📝 Migrating voice history for ${userId}`);
      const updates = {};
      
      Object.entries(userData.voiceHistory).forEach(([key, data]) => {
        // Add userId if missing
        if (!data.userId) {
          updates[`users/${userId}/voiceHistory/${key}/userId`] = userId;
        }
        
        // Add metadata if missing
        if (!data.metadata) {
          updates[`users/${userId}/voiceHistory/${key}/metadata`] = {
            version: '2.0',
            migratedAt: new Date().toISOString(),
            source: 'migration_script'
          };
        }
        
        // Ensure consistent data structure
        if (data.voice_metrics && !data.voiceMetrics) {
          updates[`users/${userId}/voiceHistory/${key}/voiceMetrics`] = data.voice_metrics;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        migrations.push(db.ref().update(updates));
      }
    }
    
    // 2. Create assessments collection from voice history
    if (userData.voiceHistory) {
      console.log(`  📊 Creating assessments collection for ${userId}`);
      const assessmentUpdates = {};
      
      Object.entries(userData.voiceHistory).forEach(([key, data]) => {
        assessmentUpdates[`users/${userId}/assessments/${key}`] = {
          ...data,
          id: key,
          userId: userId,
          type: 'voice_analysis',
          metadata: {
            version: '2.0',
            migratedAt: new Date().toISOString(),
            source: 'migration_script'
          }
        };
      });
      
      if (Object.keys(assessmentUpdates).length > 0) {
        migrations.push(db.ref().update(assessmentUpdates));
      }
    }
    
    // 3. Migrate graph data to user-specific paths
    const graphsSnapshot = await db.ref('graphs').once('value');
    const graphsData = graphsSnapshot.val();
    
    if (graphsData) {
      console.log(`  📈 Migrating graph data for ${userId}`);
      const graphUpdates = {};
      
      // Look for any graph data that might belong to this user
      Object.entries(graphsData).forEach(([key, data]) => {
        if (Array.isArray(data)) {
          // Handle array of graph data
          data.forEach((item, index) => {
            if (item.userId === userId || (!item.userId && shouldBelongToUser(item, userId))) {
              graphUpdates[`graphs/${userId}/migrated/${key}_${index}`] = {
                ...item,
                userId: userId,
                timestamp: item.timestamp || Date.now(),
                metadata: {
                  version: '2.0',
                  migratedAt: new Date().toISOString(),
                  originalKey: key
                }
              };
            }
          });
        } else if (typeof data === 'object') {
          // Handle object graph data
          if (data.userId === userId || (!data.userId && shouldBelongToUser(data, userId))) {
            graphUpdates[`graphs/${userId}/migrated/${key}`] = {
              ...data,
              userId: userId,
              timestamp: data.timestamp || Date.now(),
              metadata: {
                version: '2.0',
                migratedAt: new Date().toISOString(),
                originalKey: key
              }
            };
          }
        }
      });
      
      if (Object.keys(graphUpdates).length > 0) {
        migrations.push(db.ref().update(graphUpdates));
      }
    }
    
    // 4. Ensure user profile is complete
    if (!userData.profile) {
      console.log(`  👤 Creating profile for ${userId}`);
      const profileUpdate = {};
      profileUpdate[`users/${userId}/profile`] = {
        userId: userId,
        createdAt: Date.now(),
        version: '2.0',
        migrated: true
      };
      migrations.push(db.ref().update(profileUpdate));
    }
    
    // Execute all migrations for this user
    await Promise.all(migrations);
    console.log(`  ✅ Migration completed for user: ${userId}`);
    
  } catch (error) {
    console.error(`  ❌ Migration failed for user ${userId}:`, error);
  }
}

/**
 * Helper function to determine if data should belong to a user
 */
function shouldBelongToUser(data, userId) {
  // Add logic to determine data ownership based on timestamps, patterns, etc.
  // For now, return false to be safe
  return false;
}

/**
 * Validate migration results
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration results...');
  
  try {
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val();
    
    if (!users) {
      console.log('❌ No users found after migration');
      return;
    }
    
    let validationErrors = 0;
    
    for (const [userId, userData] of Object.entries(users)) {
      console.log(`\n🔍 Validating user: ${userId}`);
      
      // Check voice history
      if (userData.voiceHistory) {
        Object.entries(userData.voiceHistory).forEach(([key, data]) => {
          if (!data.userId || data.userId !== userId) {
            console.error(`  ❌ Voice history ${key} missing or incorrect userId`);
            validationErrors++;
          }
          if (!data.metadata) {
            console.error(`  ❌ Voice history ${key} missing metadata`);
            validationErrors++;
          }
        });
      }
      
      // Check assessments
      if (userData.assessments) {
        Object.entries(userData.assessments).forEach(([key, data]) => {
          if (!data.userId || data.userId !== userId) {
            console.error(`  ❌ Assessment ${key} missing or incorrect userId`);
            validationErrors++;
          }
        });
      }
      
      console.log(`  ✅ User ${userId} validation completed`);
    }
    
    // Check graphs
    const graphsSnapshot = await db.ref('graphs').once('value');
    const graphs = graphsSnapshot.val();
    
    if (graphs) {
      Object.entries(graphs).forEach(([userId, userGraphs]) => {
        if (users[userId]) { // User exists
          Object.entries(userGraphs).forEach(([graphKey, graphData]) => {
            if (Array.isArray(graphData)) {
              graphData.forEach((item, index) => {
                if (!item.userId || item.userId !== userId) {
                  console.error(`  ❌ Graph ${graphKey}[${index}] missing or incorrect userId`);
                  validationErrors++;
                }
              });
            } else {
              if (!graphData.userId || graphData.userId !== userId) {
                console.error(`  ❌ Graph ${graphKey} missing or incorrect userId`);
                validationErrors++;
              }
            }
          });
        }
      });
    }
    
    if (validationErrors === 0) {
      console.log('\n✅ Migration validation passed! All data is properly isolated.');
    } else {
      console.log(`\n❌ Migration validation found ${validationErrors} issues.`);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

/**
 * Cleanup old data structures (RUN WITH CAUTION)
 */
async function cleanupOldData() {
  console.log('\n⚠️  Starting cleanup of old data structures...');
  console.log('⚠️  This will remove non-user-specific data paths');
  
  // Add confirmation prompt in production
  const shouldCleanup = process.argv.includes('--cleanup');
  
  if (!shouldCleanup) {
    console.log('⚠️  Add --cleanup flag to perform cleanup');
    return;
  }
  
  try {
    // Remove old graph structure (if exists at root level)
    await db.ref('graphs').remove();
    console.log('✅ Removed old graph data structure');
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Firebase User Data Migration Tool');
  console.log('=====================================');
  
  await migrateUserData();
  await validateMigration();
  
  if (process.argv.includes('--cleanup')) {
    await cleanupOldData();
  }
  
  console.log('\n🎉 Migration process completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});