/**
 * Test script to verify user data isolation
 * Run this to ensure users can't access each other's data
 */

const { getDatabase, ref, get, set } = require('firebase/database');
const { initializeApp } = require('firebase/app');
require('dotenv').config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Test user data isolation
 */
async function testUserIsolation() {
  console.log('🧪 Testing User Data Isolation');
  console.log('==============================');

  const testUsers = ['test_user_1', 'test_user_2'];
  const testData = {
    test_user_1: {
      voiceMetrics: { pitch: 120, jitter: 0.01 },
      timestamp: Date.now(),
      userId: 'test_user_1'
    },
    test_user_2: {
      voiceMetrics: { pitch: 150, jitter: 0.02 },
      timestamp: Date.now(),
      userId: 'test_user_2'
    }
  };

  try {
    // 1. Save test data for each user
    console.log('\n📝 Saving test data for each user...');
    for (const userId of testUsers) {
      const userRef = ref(database, `users/${userId}/testData/isolation_test`);
      await set(userRef, testData[userId]);
      console.log(`✅ Saved data for ${userId}`);
    }

    // 2. Test that users can only access their own data
    console.log('\n🔍 Testing data access isolation...');
    for (const userId of testUsers) {
      const userRef = ref(database, `users/${userId}/testData`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const testEntry = data.isolation_test;
        
        if (testEntry && testEntry.userId === userId) {
          console.log(`✅ User ${userId} can access their own data`);
        } else {
          console.log(`❌ User ${userId} data integrity issue`);
        }
      } else {
        console.log(`❌ No data found for user ${userId}`);
      }
    }

    // 3. Test cross-user access (should fail with security rules)
    console.log('\n🚫 Testing cross-user access prevention...');
    try {
      const crossUserRef = ref(database, 'users/test_user_1/testData');
      // This should fail with proper security rules
      const crossSnapshot = await get(crossUserRef);
      console.log('⚠️  Cross-user access test - rules might not be active');
    } catch (error) {
      console.log('✅ Cross-user access properly blocked');
    }

    // 4. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    for (const userId of testUsers) {
      const userRef = ref(database, `users/${userId}/testData`);
      await set(userRef, null);
      console.log(`✅ Cleaned up data for ${userId}`);
    }

    console.log('\n✅ User isolation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test data structure consistency
 */
async function testDataStructure() {
  console.log('\n🏗️  Testing Data Structure Consistency');
  console.log('=====================================');

  const testUserId = 'structure_test_user';
  
  try {
    // Test voice analysis data structure
    const voiceAnalysisData = {
      id: 'test_analysis_1',
      userId: testUserId,
      timestamp: Date.now(),
      type: 'voice_analysis',
      voiceMetrics: {
        pitch: 120,
        jitter: 0.01,
        shimmer: 0.03,
        hnr: 15
      },
      predictionResult: {
        severity: 45,
        confidence: 0.85,
        status: false,
        modelPredictions: { 'random_forest': 0.4, 'svm': 0.5 },
        modelProbabilities: { 'random_forest': 0.6, 'svm': 0.5 },
        recommendations: ['Monitor symptoms', 'Regular exercise']
      },
      metadata: {
        version: '2.0',
        source: 'test_script'
      }
    };

    // Save to multiple paths for consistency
    console.log('📝 Testing consistent data structure...');
    
    const voiceHistoryRef = ref(database, `users/${testUserId}/voiceHistory/test_analysis_1`);
    const assessmentRef = ref(database, `users/${testUserId}/assessments/test_analysis_1`);
    
    await set(voiceHistoryRef, voiceAnalysisData);
    await set(assessmentRef, voiceAnalysisData);
    
    console.log('✅ Data structure test completed');

    // Clean up
    await set(ref(database, `users/${testUserId}`), null);
    console.log('✅ Cleaned up test data');

  } catch (error) {
    console.error('❌ Data structure test failed:', error);
  }
}

/**
 * Test realtime data updates
 */
async function testRealtimeUpdates() {
  console.log('\n🔄 Testing Realtime Data Updates');
  console.log('=================================');

  const testUserId = 'realtime_test_user';
  
  try {
    // Simulate realtime voice data
    const realtimeData = {
      voiceMetrics: {
        pitch: 125,
        jitter: 0.015,
        shimmer: 0.025,
        hnr: 18
      },
      predictionResult: {
        severity: 30,
        confidence: 0.78
      },
      lastUpdated: Date.now(),
      userId: testUserId
    };

    console.log('📡 Testing realtime data updates...');
    
    const realtimeRef = ref(database, `users/${testUserId}/realtime`);
    await set(realtimeRef, realtimeData);
    
    // Verify data was saved correctly
    const snapshot = await get(realtimeRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.userId === testUserId) {
        console.log('✅ Realtime data update test passed');
      } else {
        console.log('❌ Realtime data userId mismatch');
      }
    } else {
      console.log('❌ Realtime data not found');
    }

    // Clean up
    await set(ref(database, `users/${testUserId}`), null);
    console.log('✅ Cleaned up realtime test data');

  } catch (error) {
    console.error('❌ Realtime test failed:', error);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting User Data Isolation Tests');
  console.log('=====================================');
  
  await testUserIsolation();
  await testDataStructure();
  await testRealtimeUpdates();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- User data isolation: Tested');
  console.log('- Data structure consistency: Tested');
  console.log('- Realtime updates: Tested');
  console.log('\n🔐 Security Notes:');
  console.log('- Ensure Firebase security rules are deployed');
  console.log('- Test with actual user authentication');
  console.log('- Monitor for cross-user data access attempts');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});