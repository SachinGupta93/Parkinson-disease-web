import { useState } from 'react';
import { DataCleaningService } from '../services/dataCleaningService';
import { useAuth } from './useAuth';

export function useDataCleaning() {
  const [isCleaningInProgress, setIsCleaningInProgress] = useState(false);
  const [cleaningError, setCleaningError] = useState<string | null>(null);
  const [cleaningSuccess, setCleaningSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  const performDataCleanup = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.performCompleteCleanup(user.uid);
      setCleaningSuccess('Data cleanup completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Data cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const cleanVoiceHistory = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.cleanUserVoiceHistory(user.uid);
      setCleaningSuccess('Voice history cleaned successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Voice history cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const cleanMultiModelPredictions = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.cleanUserMultiModelPredictions(user.uid);
      setCleaningSuccess('Multi-model predictions cleaned successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Multi-model predictions cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const removeDuplicates = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.removeDuplicateEntries(user.uid);
      setCleaningSuccess('Duplicate entries removed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Duplicate removal failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const clearMessages = () => {
    setCleaningError(null);
    setCleaningSuccess(null);
  };

  return {
    isCleaningInProgress,
    cleaningError,
    cleaningSuccess,
    performDataCleanup,
    cleanVoiceHistory,
    cleanMultiModelPredictions,
    removeDuplicates,
    clearMessages
  };
}import { useState } from 'react';
import { DataCleaningService } from '../services/dataCleaningService';
import { useAuth } from './useAuth';

export function useDataCleaning() {
  const [isCleaningInProgress, setIsCleaningInProgress] = useState(false);
  const [cleaningError, setCleaningError] = useState<string | null>(null);
  const [cleaningSuccess, setCleaningSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  const performDataCleanup = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.performCompleteCleanup(user.uid);
      setCleaningSuccess('Data cleanup completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Data cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const cleanVoiceHistory = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.cleanUserVoiceHistory(user.uid);
      setCleaningSuccess('Voice history cleaned successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Voice history cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const cleanMultiModelPredictions = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.cleanUserMultiModelPredictions(user.uid);
      setCleaningSuccess('Multi-model predictions cleaned successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Multi-model predictions cleanup failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const removeDuplicates = async () => {
    if (!user?.uid) {
      setCleaningError('User not authenticated');
      return;
    }

    setIsCleaningInProgress(true);
    setCleaningError(null);
    setCleaningSuccess(null);

    try {
      await DataCleaningService.removeDuplicateEntries(user.uid);
      setCleaningSuccess('Duplicate entries removed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCleaningError(`Duplicate removal failed: ${errorMessage}`);
    } finally {
      setIsCleaningInProgress(false);
    }
  };

  const clearMessages = () => {
    setCleaningError(null);
    setCleaningSuccess(null);
  };

  return {
    isCleaningInProgress,
    cleaningError,
    cleaningSuccess,
    performDataCleanup,
    cleanVoiceHistory,
    cleanMultiModelPredictions,
    removeDuplicates,
    clearMessages
  };
}