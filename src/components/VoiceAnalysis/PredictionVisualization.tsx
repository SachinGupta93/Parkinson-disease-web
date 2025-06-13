import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface PredictionData {
  timestamp: string;
  severity: number;
  confidence: number;
  status?: boolean;
  recommendations?: string[];
  metrics: {
    pitch: number;
    jitter: number;
    shimmer: number;
    hnr: number;
    [key: string]: number;
  };
  modelDetails?: {
    modelPredictions: Record<string, boolean>;
    modelProbabilities: Record<string, number>;
  };
}

interface Props {
  predictions: PredictionData[];
  latestPrediction?: PredictionData;
}

export const PredictionVisualization: React.FC<Props> = ({
  predictions,
  latestPrediction
}) => {
  const formatRadarData = (metrics: PredictionData['metrics']) => {
    return Object.entries(metrics).map(([key, value]) => ({
      metric: key.charAt(0).toUpperCase() + key.slice(1),
      value: value
    }));
  };

  const formatTimeSeriesData = () => {
    return predictions.map(pred => ({
      timestamp: new Date(pred.timestamp).toLocaleTimeString(),
      severity: pred.severity,
      confidence: pred.confidence
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="latest">Latest Analysis</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="space-y-4">
            {latestPrediction && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Severity Score</CardTitle>
                    </CardHeader>
                    <CardContent>                  <div className="text-3xl font-bold">
                        {latestPrediction.severity.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {(latestPrediction.confidence * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voice Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 text-sm text-muted-foreground">
                      <p className="mb-1"><span className="font-semibold">Purpose:</span> This radar chart visualizes key acoustic properties of your voice sample.</p>
                      <p className="mb-1"><span className="font-semibold">What it shows:</span> Multiple voice biomarkers measured from your recording:</p>
                      <ul className="list-disc list-inside ml-2 mb-1">
                        <li><span className="font-semibold">Pitch:</span> Average vocal frequency (Hz)</li>
                        <li><span className="font-semibold">Jitter:</span> Cycle-to-cycle pitch variations</li>
                        <li><span className="font-semibold">Shimmer:</span> Amplitude/volume variations</li>
                        <li><span className="font-semibold">HNR:</span> Harmonics-to-Noise Ratio (voice clarity)</li>
                      </ul>
                      <p><span className="font-semibold">Technical note:</span> Values closer to the center are lower; those near the outer edge are higher. Parkinson's often shows increased jitter and shimmer with decreased HNR.</p>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={formatRadarData(latestPrediction.metrics)}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis />
                          <Radar
                            name="Metrics"
                            dataKey="value"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>                </Card>

                {latestPrediction.recommendations && latestPrediction.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-6 space-y-1">
                        {latestPrediction.recommendations.map((recommendation, i) => (
                          <li key={i} className="text-sm">{recommendation}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {latestPrediction.modelDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Model Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(latestPrediction.modelDetails.modelProbabilities).map(([model, probability]) => (
                          <div key={model} className="flex justify-between">
                            <span className="font-medium">{model}:</span>
                            <span>{(probability * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Severity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-sm text-muted-foreground">
                  <p className="mb-1"><span className="font-semibold">Purpose:</span> This line chart tracks changes in your voice analysis results over time.</p>
                  <p className="mb-1"><span className="font-semibold">What it shows:</span> Two key metrics from each voice recording session:</p>
                  <ul className="list-disc list-inside ml-2 mb-1">
                    <li><span className="font-semibold">Severity (purple):</span> The estimated severity of Parkinson's-related voice changes (0-100%)</li>
                    <li><span className="font-semibold">Confidence (green):</span> How confident the model is in its assessment (0-100%)</li>
                  </ul>
                  <p><span className="font-semibold">Technical note:</span> The X-axis shows the time of each recording. Consistent patterns are more reliable than single assessments.</p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatTimeSeriesData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="severity"
                        stroke="#8884d8"
                        name="Severity"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#82ca9d"
                        name="Confidence"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 