import { useEffect, useState } from 'react';
import { calculateProgress, getAssessmentHistory, Assessment } from '@/utils/assessmentHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ProgressTrackerProps {
  assessments?: Assessment[];
}

const ProgressTracker = ({ assessments: propAssessments }: ProgressTrackerProps) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [progress, setProgress] = useState<{
    dates: string[];
    riskScores: number[];
    mostRecentChange?: {
      value: number;
      percentage: number;
      improved: boolean;
    };
  }>({ dates: [], riskScores: [] });
  const [isLoading, setIsLoading] = useState(true); // Initialize isLoading to true
  const [error, setError] = useState<string | null>(null); // Initialize error to null

  useEffect(() => {
    // If assessments are provided as props, use them directly
    if (propAssessments && propAssessments.length > 0) {
      setAssessments(propAssessments);
      const progressData = calculateProgress(propAssessments);
      setProgress(progressData);
      setIsLoading(false);
      return;
    }

    // Otherwise, load assessments from history
    async function loadHistory() {
      setIsLoading(true); // Set loading to true when starting
      setError(null); // Reset error state
      try {
        const history = await getAssessmentHistory();
        setAssessments(history);
        
        if (history.length > 0) {
          const progressData = calculateProgress(history);
          setProgress(progressData);
        } else {
          // Reset progress if history is empty
          setProgress({ dates: [], riskScores: [] });
        }
      } catch (err) {
        console.error("Failed to load assessment history:", err);
        setError("Failed to load assessment history. Please try again later.");
        // Reset progress on error
        setProgress({ dates: [], riskScores: [] });
      } finally {
        setIsLoading(false); // Set loading to false when done
      }
    }
    
    loadHistory();
  }, [propAssessments]); // Added propAssessments to dependency array
  
  if (isLoading) { // Added loading state UI
    return (
      <Card className="card-gradient-blue">
        <CardHeader>
          <CardTitle className="neon-text">Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading progress data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) { // Added error state UI
    return (
      <Card className="card-gradient-red">
        <CardHeader>
          <CardTitle className="neon-text">Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (assessments.length === 0) { // Changed to strict equality and check after loading/error
    return (
      <Card className="card-gradient-blue">
        <CardHeader>
          <CardTitle className="neon-text">Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No assessment history found. Complete an assessment to track your progress over time.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Format data for the chart
  const chartData = progress.dates.map((date, index) => ({
    date,
    riskScore: progress.riskScores[index]
  }));
  
  return (
    <Card className="card-gradient-green overflow-hidden">
      <CardHeader>
        <CardTitle className="neon-text">Progress Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {progress.mostRecentChange && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center p-4 rounded-lg ${
              progress.mostRecentChange.improved ? 'bg-green-500/20' : 'bg-red-500/20'
            } backdrop-blur-sm border ${
              progress.mostRecentChange.improved ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="mr-3">
                {progress.mostRecentChange.improved ? (
                  <div className="bg-green-100 p-2 rounded-full">
                    <ArrowDown className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="bg-red-100 p-2 rounded-full">
                    <ArrowUp className="h-5 w-5 text-red-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {progress.mostRecentChange.improved 
                    ? 'Improvement from last assessment' 
                    : 'Change from last assessment'
                  }
                </p>
                <p className="text-xl font-bold">
                  {progress.mostRecentChange.improved ? '-' : '+'}{progress.mostRecentChange.value} points
                </p>
                <p className="text-sm">
                  {progress.mostRecentChange.percentage}% {progress.mostRecentChange.improved ? 'decrease' : 'increase'}
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50 backdrop-blur-sm border border-secondary md:col-span-2">
              <h4 className="font-medium mb-2">Assessment Summary</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-lg font-medium">{assessments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latest Risk Score</p>
                  <p className="text-lg font-medium">
                    {progress.riskScores.length > 0 
                      ? `${progress.riskScores[progress.riskScores.length - 1]}/100` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-lg font-medium">
                    {progress.riskScores.length > 0 
                      ? `${(progress.riskScores.reduce((a, b) => a + b, 0) / progress.riskScores.length).toFixed(1)}/100`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">First Assessment</p>
                  <p className="text-lg font-medium">{new Date(assessments[0].date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-[300px] chart-container bg-white/60 dark:bg-background/30 backdrop-blur-sm rounded-lg border border-border/30">
          <ChartContainer config={{
            riskScore: {
              theme: {
                light: "hsl(var(--chart-1))",
                dark: "hsl(var(--chart-1))"
              },
              label: "Risk Score"
            }
          }}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <ReferenceLine
                y={50}
                label={{ value: "Moderate Risk", position: "insideRight", fill: "var(--foreground)", fontSize: 10 }}
                stroke="rgba(102, 102, 102, 0.5)"
                strokeDasharray="3 3"
              />
              <Area 
                type="monotone" 
                dataKey="riskScore" 
                name="Risk Score" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2} 
                fillOpacity={1}
                fill="url(#colorScore)"
                dot={{ 
                  stroke: "hsl(var(--chart-1))", 
                  strokeWidth: 2, 
                  r: 4, 
                  fill: "white" 
                }}
                activeDot={{ 
                  stroke: "hsl(var(--chart-1))", 
                  strokeWidth: 2, 
                  r: 6, 
                  fill: "white" 
                }}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        
        <div className="text-sm text-muted-foreground bg-white/50 dark:bg-black/10 p-4 rounded-lg">
          <p>
            This chart shows your risk assessment scores over time. A lower score indicates reduced risk factors associated with Parkinson's disease.
            Continue tracking your symptoms regularly to monitor changes.
          </p>
          <p className="mt-2 text-xs opacity-80">
            <span className="font-medium">Interpretation: </span>
            0-20: Low Risk, 
            21-50: Moderate Risk, 
            51-70: High Risk, 
            71-100: Very High Risk
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
