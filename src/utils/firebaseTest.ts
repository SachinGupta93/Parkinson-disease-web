import { ref, set, get, getDatabase } from "firebase/database";
import { app } from "@/lib/firebase";

const database = getDatabase(app);

export const testFirebaseConnection = async (userId: string) => {
  try {
    console.log("Testing Firebase connection for user:", userId);
    
    // Test write
    const testData = {
      timestamp: Date.now(),
      test: true,
      message: "Firebase connection test"
    };
    
    await set(ref(database, `users/${userId}/test`), testData);
    console.log("✅ Firebase write test successful");
    
    // Test read
    const snapshot = await get(ref(database, `users/${userId}/test`));
    if (snapshot.exists()) {
      console.log("✅ Firebase read test successful:", snapshot.val());
      
      // Clean up test data
      await set(ref(database, `users/${userId}/test`), null);
      console.log("✅ Firebase cleanup successful");
      
      return true;
    } else {
      console.error("❌ Firebase read test failed: No data found");
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
};

export const testVoiceHistoryWrite = async (userId: string) => {
  try {
    console.log("Testing voice history write for user:", userId);
    
    const testAssessment = {
      timestamp: Date.now(),
      prediction: {
        status: 0,
        confidence: 0.75,
        severity: 25,
        model_predictions: {
          test_model: 25
        }
      },
      voice_metrics: {
        pitch: 120,
        jitter: 0.005,
        shimmer: 0.03,
        hnr: 15
      },
      features: {
        mdvpFo: 120,
        mdvpJitter: 0.005,
        mdvpShimmer: 0.03,
        nhr: 15
      },
      recommendations: []
    };
    
    const testId = `test_${Date.now()}`;
    await set(ref(database, `users/${userId}/voiceHistory/${testId}`), testAssessment);
    console.log("✅ Voice history write test successful");
    
    // Test read
    const snapshot = await get(ref(database, `users/${userId}/voiceHistory/${testId}`));
    if (snapshot.exists()) {
      console.log("✅ Voice history read test successful:", snapshot.val());
      
      // Clean up test data
      await set(ref(database, `users/${userId}/voiceHistory/${testId}`), null);
      console.log("✅ Voice history cleanup successful");
      
      return true;
    } else {
      console.error("❌ Voice history read test failed: No data found");
      return false;
    }
  } catch (error) {
    console.error("❌ Voice history test failed:", error);
    return false;
  }
};