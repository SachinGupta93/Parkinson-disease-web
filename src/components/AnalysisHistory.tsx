import { useEffect, useState } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export const AnalysisHistory = () => {
  const { user } = useAuth();
  const { voiceHistory, loading, error } = useData(user?.uid || '');
  const [selectedMetric, setSelectedMetric] = useState('severity');

  const metrics = [
    { key: 'severity', label: 'Severity' },
    { key: 'pitch', label: 'Pitch' },
    { key: 'amplitude', label: 'Amplitude' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'tremor', label: 'Tremor' }
  ];

  const formatData = (data: any[]) => {
    return data.map(item => ({
      date: format(new Date(item.timestamp), 'MMM dd, yyyy'),
      severity: item.analysisResults.severity,
      pitch: item.voiceMetrics.pitch,
      amplitude: item.voiceMetrics.amplitude,
      frequency: item.voiceMetrics.frequency,
      tremor: item.voiceMetrics.tremor
    }));
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div>Error loading history: {error}</div>;
  }

  const chartData = formatData(voiceHistory);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="severity" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {metrics.map(metric => (
              <TabsTrigger
                key={metric.key}
                value={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
              >
                {metric.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {metrics.map(metric => (
            <TabsContent key={metric.key} value={metric.key}>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={metric.key}
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Latest Analysis</h3>
          {voiceHistory.length > 0 ? (
            <div className="space-y-2">
              <p>
                <strong>Date:</strong>{' '}
                {format(new Date(voiceHistory[0].timestamp), 'MMMM dd, yyyy HH:mm')}
              </p>
              <p>
                <strong>Severity:</strong> {voiceHistory[0].analysisResults.severity.toFixed(2)}
              </p>
              <p>
                <strong>Confidence:</strong>{' '}
                {(voiceHistory[0].analysisResults.confidence * 100).toFixed(1)}%
              </p>
              <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc list-inside">
                  {voiceHistory[0].analysisResults.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>No analysis history available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 