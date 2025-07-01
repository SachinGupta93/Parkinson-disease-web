import { useState, useMemo } from 'react';
import { Assessment } from '@/utils/assessmentHistory';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Unique color palette for AssessmentComparisonChart (greens & yellows)
const CHART_COLORS = [
  '#10b981', // Emerald
  '#facc15', // Yellow
  '#22c55e', // Green
  '#fde68a', // Light Yellow
  '#65a30d', // Olive
  '#fbbf24', // Amber
];

interface AssessmentComparisonChartProps {
  assessments: Assessment[];
}

const AssessmentComparisonChart = ({ assessments }: AssessmentComparisonChartProps) => {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'pie'>('area');
  // Format assessment data for the chart
  const chartData = useMemo(() => {
    if (!assessments.length) return [];
    return assessments
      .filter(a => a.result)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => ({
        date: format(new Date(a.date), 'MM/dd/yy'),
        riskScore: a.result.riskScore,
        probability: Math.round(a.result.probability * 100)
      }));
  }, [assessments]);

  if (assessments.length === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-black/30 rounded-lg border border-purple-500/30">
        <p className="text-muted-foreground">No assessment data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
        <TabsList>
          <TabsTrigger value="area">Area</TabsTrigger>
          <TabsTrigger value="line">Line</TabsTrigger>
          <TabsTrigger value="bar">Bar</TabsTrigger>
          <TabsTrigger value="pie">Pie</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="h-[300px] chart-container bg-white/50 dark:bg-black/10 rounded-lg border border-purple-500/30">
        <ResponsiveContainer width="100%" height="100%">
          <>
            {chartType === 'area' && (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="colorRiskScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorProbability" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.1}/>
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
                <Legend />
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
                  stroke={CHART_COLORS[0]} 
                  strokeWidth={2} 
                  fill="url(#colorRiskScore)"
                  fillOpacity={1}
                  dot={{ 
                    stroke: CHART_COLORS[0], 
                    strokeWidth: 2, 
                    r: 4, 
                    fill: "white" 
                  }}
                  activeDot={{ 
                    stroke: CHART_COLORS[0], 
                    strokeWidth: 2, 
                    r: 6, 
                    fill: "white" 
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  dataKey="probability" 
                  name="Probability (%)" 
                  stroke={CHART_COLORS[1]} 
                  strokeWidth={2} 
                  fill="url(#colorProbability)"
                  fillOpacity={1}
                  dot={{ 
                    stroke: CHART_COLORS[1], 
                    strokeWidth: 2, 
                    r: 4, 
                    fill: "white" 
                  }}
                  activeDot={{ 
                    stroke: CHART_COLORS[1], 
                    strokeWidth: 2, 
                    r: 6, 
                    fill: "white" 
                  }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </AreaChart>
            )}
            {chartType === 'line' && (
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fill: 'var(--foreground)', fontSize: 12 }} axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--foreground)', fontSize: 12 }} axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={50} label={{ value: "Moderate Risk", position: "insideRight", fill: "var(--foreground)", fontSize: 10 }} stroke="rgba(102, 102, 102, 0.5)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS[0] }} />
                <Line type="monotone" dataKey="probability" name="Probability (%)" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS[1] }} />
              </LineChart>
            )}
            {chartType === 'bar' && (
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fill: 'var(--foreground)', fontSize: 12 }} axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--foreground)', fontSize: 12 }} axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="riskScore" name="Risk Score" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="probability" name="Probability (%)" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
            {chartType === 'pie' && (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={chartData} dataKey="riskScore" nameKey="date" cx="30%" cy="50%" outerRadius={70} label>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-risk-${idx}`} fill={CHART_COLORS[0]} />
                  ))}
                </Pie>
                <Pie data={chartData} dataKey="probability" nameKey="date" cx="70%" cy="50%" outerRadius={70} label>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-prob-${idx}`} fill={CHART_COLORS[1]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssessmentComparisonChart;
