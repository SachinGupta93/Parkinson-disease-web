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
} from 'recharts';
import { format } from 'date-fns';
import { Assessment } from '@/utils/assessmentHistory';

interface SymptomTrendsChartProps {
  assessments: Assessment[];
}

const SymptomTrendsChart: React.FC<SymptomTrendsChartProps> = ({ assessments = [] }) => {
  // Process data for visualization
  const processData = () => {
    console.log('SymptomTrendsChart - Input assessments:', assessments);
    
    // Early return if no assessments
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      console.log('SymptomTrendsChart - No assessments available, returning empty data');
      return [];
    }
    
    // Sort assessments by date (oldest first)
    const sortedAssessments = [...assessments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    console.log('SymptomTrendsChart - Sorted assessments:', sortedAssessments);
    
    // Map to charting data format
    const chartData = sortedAssessments.map(assessment => {
      // Safety check for assessment structure
      if (!assessment || !assessment.features || !assessment.result || !assessment.date) {
        console.warn('SymptomTrendsChart - Invalid assessment data:', assessment);
        return null;
      }
      
      // Get all symptom values with fallbacks
      const { tremor, rigidity, bradykinesia, posturalInstability, voiceChanges, handwriting } = assessment.features;
      
      return {
        date: format(new Date(assessment.date), 'MMM d'),
        tremor: tremor || 0,
        rigidity: rigidity || 0,
        bradykinesia: bradykinesia || 0,
        posturalInstability: posturalInstability || 0,
        voiceChanges: voiceChanges || 0,
        handwriting: handwriting || 0,
        riskScore: assessment.result.riskScore || 0,
      };
    }).filter(Boolean); // Remove null entries
    
    console.log('SymptomTrendsChart - Processed chart data:', chartData);
    return chartData;
  };

  const data = processData();
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 text-sm text-muted-foreground">
        <h3 className="text-base font-medium text-foreground mb-1">Symptom Progression Trends</h3>
        <p className="mb-1"><span className="font-semibold">Purpose:</span> This chart tracks how your Parkinson's symptoms and overall risk score change over time.</p>
        <p className="mb-1"><span className="font-semibold">What it shows:</span> The severity of six key symptoms (0-10 scale) and your risk score (0-100) across multiple assessments.</p>
        <ul className="list-disc list-inside ml-2 mb-1">
          <li><span className="font-semibold">Left axis:</span> Symptom severity ratings (0-10)</li>
          <li><span className="font-semibold">Right axis:</span> Overall risk score (0-100, dashed red line)</li>
          <li><span className="font-semibold">X-axis:</span> Assessment dates in chronological order</li>
        </ul>
        <p><span className="font-semibold">Technical note:</span> Upward trends may indicate disease progression, while stable or downward trends could suggest effective management or treatment response.</p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          yAxisId="left" 
          label={{ 
            value: 'Symptom Severity (0-10)', 
            angle: -90, 
            position: 'insideLeft', 
            style: { fill: 'var(--foreground)', fontSize: 12 } 
          }}
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          domain={[0, 100]} 
          label={{ 
            value: 'Risk Score', 
            angle: 90, 
            position: 'insideRight', 
            style: { fill: 'var(--foreground)', fontSize: 12 } 
          }}
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="tremor" stroke="#8B5CF6" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="left" type="monotone" dataKey="rigidity" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="left" type="monotone" dataKey="bradykinesia" stroke="#F97316" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="left" type="monotone" dataKey="posturalInstability" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="left" type="monotone" dataKey="voiceChanges" stroke="#EC4899" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="left" type="monotone" dataKey="handwriting" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#EF4444" strokeWidth={3} activeDot={{ r: 8 }} strokeDasharray="5 5" />
      </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SymptomTrendsChart;