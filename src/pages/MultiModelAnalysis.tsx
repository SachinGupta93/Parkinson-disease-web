import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMultiModelPrediction } from '@/hooks/useMultiModelPrediction';
import { CompleteVoiceData } from '@/services/api';
import ModelComparison from '@/components/ModelComparison';
import ModelComparisonChart from '@/components/ModelComparisonChart';
import MultiModelFeatureImportance from '@/components/MultiModelFeatureImportance';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Loader2 } from 'lucide-react';

const MultiModelAnalysis: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('record');
  const { loading, error, results, analyzeAndPredictFromVoiceFile, reset } = useMultiModelPrediction();

  const handleVoiceFileUploaded = async (file: File) => {
    try {
      await analyzeAndPredictFromVoiceFile(file);
      setActiveTab('results');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to analyze voice recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    reset();
    setActiveTab('record');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Multi-Model Analysis</h1>
        <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Analysis with Multiple Models</CardTitle>
          <CardDescription>
            Compare predictions from different machine learning models to get a more comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record" disabled={loading}>Record Voice</TabsTrigger>
              <TabsTrigger value="results" disabled={!results}>View Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="record" className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-6">
                  Record or upload a voice sample to analyze with multiple Parkinson's detection models
                </p>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Analyzing voice sample with multiple models...</p>
                  </div>
                ) : (
                  <VoiceRecorder onVoiceRecorded={handleVoiceFileUploaded} />
                )}
                
                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-6 py-4">
              {results ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ModelComparison multiModelResults={results} />
                    <ModelComparisonChart multiModelResults={results} />
                  </div>
                  
                  <MultiModelFeatureImportance multiModelResults={results} />
                  
                  <div className="flex justify-center mt-6">
                    <Button onClick={handleReset}>
                      Analyze Another Voice Sample
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p>No results available. Please record or upload a voice sample first.</p>
                  <Button variant="outline" onClick={() => setActiveTab('record')} className="mt-4">
                    Go to Recording
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiModelAnalysis;