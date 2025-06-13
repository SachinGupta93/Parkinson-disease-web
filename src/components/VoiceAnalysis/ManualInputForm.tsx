import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { mlService } from '../../services/mlService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

interface VoiceMetrics {
  // Basic metrics
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  // Advanced metrics
  mdvp_fo: number;
  mdvp_fhi: number;
  mdvp_flo: number;
  mdvp_jitter_abs: number;
  mdvp_rap: number;
  mdvp_ppq: number;
  jitter_ddp: number;
  mdvp_shimmer_db: number;
  shimmer_apq3: number;
  shimmer_apq5: number;
  mdvp_apq: number;
  shimmer_dda: number;
  nhr: number;
  rpde: number;
  dfa: number;
  spread1: number;
  spread2: number;
  d2: number;
  ppe: number;
  [key: string]: number;
}

export const ManualInputForm: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    // Basic metrics
    pitch: 0,
    jitter: 0,
    shimmer: 0,
    hnr: 0,
    // Advanced metrics
    mdvp_fo: 0,
    mdvp_fhi: 0,
    mdvp_flo: 0,
    mdvp_jitter_abs: 0,
    mdvp_rap: 0,
    mdvp_ppq: 0,
    jitter_ddp: 0,
    mdvp_shimmer_db: 0,
    shimmer_apq3: 0,
    shimmer_apq5: 0,
    mdvp_apq: 0,
    shimmer_dda: 0,
    nhr: 0,
    rpde: 0,
    dfa: 0,
    spread1: 0,
    spread2: 0,
    d2: 0,
    ppe: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetrics(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Format metrics according to FastAPI backend expectations - backend only needs these 4 fields
      const voiceData = {
        pitch: activeTab === 'basic' ? metrics.pitch : metrics.mdvp_fo,
        jitter: activeTab === 'basic' ? metrics.jitter : metrics.mdvp_jitter_abs,
        shimmer: activeTab === 'basic' ? metrics.shimmer : metrics.mdvp_shimmer_db,
        hnr: metrics.hnr
      };
      
      const prediction = await mlService.predictVoiceMetrics(voiceData);
      await mlService.saveAnalysisResult(user?.uid || 'guest', metrics, prediction);
      setSuccess(true);
      // Reset only basic metrics
      setMetrics(prev => ({
        ...prev,
        pitch: 0,
        jitter: 0,
        shimmer: 0,
        hnr: 0
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicMetrics = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="pitch">Pitch (Hz)</Label>
        <Input
          id="pitch"
          name="pitch"
          type="number"
          step="0.01"
          value={metrics.pitch}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jitter">Jitter (%)</Label>
        <Input
          id="jitter"
          name="jitter"
          type="number"
          step="0.0001"
          value={metrics.jitter}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shimmer">Shimmer (%)</Label>
        <Input
          id="shimmer"
          name="shimmer"
          type="number"
          step="0.0001"
          value={metrics.shimmer}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hnr">HNR (dB)</Label>
        <Input
          id="hnr"
          name="hnr"
          type="number"
          step="0.01"
          value={metrics.hnr}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>
  );

  const renderAdvancedMetrics = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="mdvp_fo">MDVP:Fo (Hz)</Label>
        <Input
          id="mdvp_fo"
          name="mdvp_fo"
          type="number"
          step="0.01"
          value={metrics.mdvp_fo}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mdvp_fhi">MDVP:Fhi (Hz)</Label>
        <Input
          id="mdvp_fhi"
          name="mdvp_fhi"
          type="number"
          step="0.01"
          value={metrics.mdvp_fhi}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mdvp_flo">MDVP:Flo (Hz)</Label>
        <Input
          id="mdvp_flo"
          name="mdvp_flo"
          type="number"
          step="0.01"
          value={metrics.mdvp_flo}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mdvp_jitter_abs">MDVP:Jitter(Abs)</Label>
        <Input
          id="mdvp_jitter_abs"
          name="mdvp_jitter_abs"
          type="number"
          step="0.0001"
          value={metrics.mdvp_jitter_abs}
          onChange={handleInputChange}
        />
      </div>
      {/* Add more advanced metrics here */}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Voice Analysis</CardTitle>
        <CardDescription>
          Enter voice metrics for Parkinson's disease prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Metrics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderBasicMetrics()}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>Analysis saved successfully!</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Voice Metrics'
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="advanced">
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderAdvancedMetrics()}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>Analysis saved successfully!</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Advanced Metrics'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 