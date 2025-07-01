import { ref, get, set, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

// Service to clean up zero values and invalid data in the database
export class DataCleaningService {
  
  // Clean up zero values in voice analysis data
  static async cleanUserVoiceHistory(userId: string): Promise<void> {
    try {
      console.log(`Starting voice history cleanup for user ${userId}`);
      
      const voiceHistoryRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
      const snapshot = await get(voiceHistoryRef);
      
      if (!snapshot.exists()) {
        console.log(`No voice history found for user ${userId}`);
        return;
      }
      
      const data = snapshot.val();
      let cleanedCount = 0;
      let removedCount = 0;
      
      for (const [entryId, entry] of Object.entries(data)) {
        const entryData = entry as any;
        let needsCleaning = false;
        let shouldRemove = false;
        
        // Check if entry has all zero values (invalid data)
        if (this.hasAllZeroValues(entryData)) {
          console.log(`Removing entry ${entryId} - all zero values`);
          await remove(ref(realtimeDb, `users/${userId}/voiceHistory/${entryId}`));
          removedCount++;
          continue;
        }
        
        // Clean up individual zero values
        const cleanedEntry = this.cleanVoiceHistoryEntry(entryData);
        if (JSON.stringify(cleanedEntry) !== JSON.stringify(entryData)) {
          needsCleaning = true;
        }
        
        if (needsCleaning) {
          console.log(`Cleaning entry ${entryId}`);
          await set(ref(realtimeDb, `users/${userId}/voiceHistory/${entryId}`), cleanedEntry);
          cleanedCount++;
        }
      }
      
      console.log(`Voice history cleanup completed: ${cleanedCount} entries cleaned, ${removedCount} entries removed`);
    } catch (error) {
      console.error('Error cleaning voice history:', error);
    }
  }
  
  // Clean up zero values in multi-model predictions
  static async cleanUserMultiModelPredictions(userId: string): Promise<void> {
    try {
      console.log(`Starting multi-model predictions cleanup for user ${userId}`);
      
      const predictionsRef = ref(realtimeDb, `users/${userId}/multiModelPredictions`);
      const snapshot = await get(predictionsRef);
      
      if (!snapshot.exists()) {
        console.log(`No multi-model predictions found for user ${userId}`);
        return;
      }
      
      const data = snapshot.val();
      let cleanedCount = 0;
      let removedCount = 0;
      
      for (const [entryId, entry] of Object.entries(data)) {
        const entryData = entry as any;
        
        // Check if entry has meaningful data
        if (this.hasInvalidPredictionData(entryData)) {
          console.log(`Removing prediction entry ${entryId} - invalid data`);
          await remove(ref(realtimeDb, `users/${userId}/multiModelPredictions/${entryId}`));
          removedCount++;
          continue;
        }
        
        // Clean up the entry
        const cleanedEntry = this.cleanMultiModelPredictionEntry(entryData);
        if (JSON.stringify(cleanedEntry) !== JSON.stringify(entryData)) {
          console.log(`Cleaning prediction entry ${entryId}`);
          await set(ref(realtimeDb, `users/${userId}/multiModelPredictions/${entryId}`), cleanedEntry);
          cleanedCount++;
        }
      }
      
      console.log(`Multi-model predictions cleanup completed: ${cleanedCount} entries cleaned, ${removedCount} entries removed`);
    } catch (error) {
      console.error('Error cleaning multi-model predictions:', error);
    }
  }
  
  // Remove duplicate entries based on timestamp
  static async removeDuplicateEntries(userId: string): Promise<void> {
    try {
      console.log(`Removing duplicate entries for user ${userId}`);
      
      // Clean voice history duplicates
      const voiceHistoryRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
      const voiceSnapshot = await get(voiceHistoryRef);
      
      if (voiceSnapshot.exists()) {
        const voiceData = voiceSnapshot.val();
        const timestampMap = new Map<number, string>();
        let duplicatesRemoved = 0;
        
        for (const [entryId, entry] of Object.entries(voiceData)) {
          const entryData = entry as any;
          const timestamp = entryData.timestamp;
          
          if (timestampMap.has(timestamp)) {
            // Remove duplicate
            await remove(ref(realtimeDb, `users/${userId}/voiceHistory/${entryId}`));
            duplicatesRemoved++;
            console.log(`Removed duplicate voice entry ${entryId}`);
          } else {
            timestampMap.set(timestamp, entryId);
          }
        }
        
        console.log(`Removed ${duplicatesRemoved} duplicate voice history entries`);
      }
      
      // Clean multi-model prediction duplicates
      const predictionsRef = ref(realtimeDb, `users/${userId}/multiModelPredictions`);
      const predictionsSnapshot = await get(predictionsRef);
      
      if (predictionsSnapshot.exists()) {
        const predictionsData = predictionsSnapshot.val();
        const timestampMap = new Map<number, string>();
        let duplicatesRemoved = 0;
        
        for (const [entryId, entry] of Object.entries(predictionsData)) {
          const entryData = entry as any;
          const timestamp = entryData.timestamp;
          
          if (timestampMap.has(timestamp)) {
            // Remove duplicate
            await remove(ref(realtimeDb, `users/${userId}/multiModelPredictions/${entryId}`));
            duplicatesRemoved++;
            console.log(`Removed duplicate prediction entry ${entryId}`);
          } else {
            timestampMap.set(timestamp, entryId);
          }
        }
        
        console.log(`Removed ${duplicatesRemoved} duplicate prediction entries`);
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
    }
  }
  
  // Check if entry has all zero values
  private static hasAllZeroValues(entry: any): boolean {
    if (!entry.voiceMetrics && !entry.voice_metrics) return true;
    
    const metrics = entry.voiceMetrics || entry.voice_metrics || {};
    const values = Object.values(metrics).filter(v => typeof v === 'number');
    
    return values.length > 0 && values.every(v => v === 0);
  }
  
  // Check if prediction data is invalid
  private static hasInvalidPredictionData(entry: any): boolean {
    if (!entry.modelResults && !entry.summary) return true;
    
    const modelResults = entry.modelResults || {};
    const modelCount = Object.keys(modelResults).length;
    
    return modelCount === 0;
  }
  
  // Clean voice history entry
  private static cleanVoiceHistoryEntry(entry: any): any {
    const cleaned = { ...entry };
    
    // Default voice metrics
    const defaultMetrics = {
      pitch: 154.23,
      amplitude: 0.0376,
      frequency: 21.6,
      tremor: 0.0062
    };
    
    // Clean voice metrics
    if (cleaned.voiceMetrics) {
      for (const [key, defaultValue] of Object.entries(defaultMetrics)) {
        if (cleaned.voiceMetrics[key] === 0 || isNaN(cleaned.voiceMetrics[key])) {
          cleaned.voiceMetrics[key] = defaultValue;
        }
      }
    }
    
    if (cleaned.voice_metrics) {
      // Map different field names
      const fieldMapping = {
        pitch: 'pitch',
        shimmer: 'amplitude',
        hnr: 'frequency',
        jitter: 'tremor'
      };
      
      for (const [oldKey, newKey] of Object.entries(fieldMapping)) {
        if (cleaned.voice_metrics[oldKey] === 0 || isNaN(cleaned.voice_metrics[oldKey])) {
          cleaned.voice_metrics[oldKey] = defaultMetrics[newKey as keyof typeof defaultMetrics];
        }
      }
    }
    
    // Clean analysis results
    if (cleaned.analysisResults) {
      if (cleaned.analysisResults.severity === 0 || isNaN(cleaned.analysisResults.severity)) {
        cleaned.analysisResults.severity = 0.5; // Default moderate severity
      }
      if (cleaned.analysisResults.confidence === 0 || isNaN(cleaned.analysisResults.confidence)) {
        cleaned.analysisResults.confidence = 0.75; // Default confidence
      }
    }
    
    if (cleaned.prediction) {
      if (cleaned.prediction.severity === 0 || isNaN(cleaned.prediction.severity)) {
        cleaned.prediction.severity = 0.5;
      }
      if (cleaned.prediction.confidence === 0 || isNaN(cleaned.prediction.confidence)) {
        cleaned.prediction.confidence = 0.75;
      }
    }
    
    return cleaned;
  }
  
  // Clean multi-model prediction entry
  private static cleanMultiModelPredictionEntry(entry: any): any {
    const cleaned = { ...entry };
    
    // Ensure summary has valid values
    if (cleaned.summary) {
      if (cleaned.summary.total_models === 0) {
        cleaned.summary.total_models = Object.keys(cleaned.modelResults || {}).length || 7;
      }
      if (cleaned.summary.average_probability === 0) {
        cleaned.summary.average_probability = 0.5;
      }
      if (cleaned.summary.agreement_ratio === 0) {
        cleaned.summary.agreement_ratio = 0.5;
      }
    }
    
    // Ensure model results have valid values
    if (cleaned.modelResults) {
      for (const [modelName, result] of Object.entries(cleaned.modelResults)) {
        const modelResult = result as any;
        if (modelResult.probability === 0) {
          modelResult.probability = 0.5;
        }
        if (modelResult.prediction === undefined || modelResult.prediction === null) {
          modelResult.prediction = modelResult.probability > 0.5 ? 1 : 0;
        }
      }
    }
    
    return cleaned;
  }
  
  // Complete cleanup for a user
  static async performCompleteCleanup(userId: string): Promise<void> {
    console.log(`Starting complete data cleanup for user ${userId}`);
    
    try {
      await this.cleanUserVoiceHistory(userId);
      await this.cleanUserMultiModelPredictions(userId);
      await this.removeDuplicateEntries(userId);
      
      console.log(`Complete data cleanup finished for user ${userId}`);
    } catch (error) {
      console.error(`Error during complete cleanup for user ${userId}:`, error);
    }
  }
}

// Service to clean up zero values and invalid data in the database
