import React from 'react';
import { useDataCleaning } from '../hooks/useDataCleaning';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

export function DataManagement() {
  const {
    isCleaningInProgress,
    cleaningError,
    cleaningSuccess,
    performDataCleanup,
    cleanVoiceHistory,
    cleanMultiModelPredictions,
    removeDuplicates,
    clearMessages
  } = useDataCleaning();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Clean up your data to remove zero values, invalid entries, and duplicates.
            This will improve the accuracy of your analysis results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cleaningError && (
            <Alert variant="destructive">
              <AlertDescription>{cleaningError}</AlertDescription>
            </Alert>
          )}
          
          {cleaningSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{cleaningSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Complete Cleanup</CardTitle>
                <CardDescription>
                  Perform a comprehensive cleanup of all your data including voice history,
                  predictions, and duplicate removal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={performDataCleanup}
                  disabled={isCleaningInProgress}
                  className="w-full"
                >
                  {isCleaningInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Complete Cleanup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice History</CardTitle>
                <CardDescription>
                  Clean up zero values and invalid entries in your voice analysis history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={cleanVoiceHistory}
                  disabled={isCleaningInProgress}
                  variant="outline"
                  className="w-full"
                >
                  {isCleaningInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Clean Voice History
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Predictions</CardTitle>
                <CardDescription>
                  Clean up invalid model prediction results and ensure data consistency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={cleanMultiModelPredictions}
                  disabled={isCleaningInProgress}
                  variant="outline"
                  className="w-full"
                >
                  {isCleaningInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Clean Predictions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remove Duplicates</CardTitle>
                <CardDescription>
                  Remove duplicate entries based on timestamp to clean up your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={removeDuplicates}
                  disabled={isCleaningInProgress}
                  variant="outline"
                  className="w-full"
                >
                  {isCleaningInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Duplicates
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {(cleaningError || cleaningSuccess) && (
            <div className="flex justify-end">
              <Button
                onClick={clearMessages}
                variant="ghost"
                size="sm"
              >
                Clear Messages
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Quality Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Zero Values:</strong> Entries with all zero values will be removed as they indicate failed analysis.</p>
            <p>• <strong>Invalid Data:</strong> Entries missing critical information will be cleaned or removed.</p>
            <p>• <strong>Duplicates:</strong> Multiple entries with the same timestamp will be deduplicated.</p>
            <p>• <strong>Default Values:</strong> Missing or zero values will be replaced with reasonable defaults where appropriate.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default DataManagement;