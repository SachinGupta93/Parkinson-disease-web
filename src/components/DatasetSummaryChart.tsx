import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Assessment } from '@/utils/assessmentHistory';

interface DatasetSummaryChartProps {
  assessments: Assessment[];
}

const DatasetSummaryChart: React.FC<DatasetSummaryChartProps> = ({ assessments = [] }) => {
  // Process data for visualization
  const processData = () => {
    console.log('DatasetSummaryChart - Input assessments:', assessments);
    
    // Early return if no assessments
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      console.log('DatasetSummaryChart - No assessments available, returning empty data');
      return [
        { name: 'Low Risk', value: 0 },
        { name: 'Moderate Risk', value: 0 },
        { name: 'High Risk', value: 0 },
        { name: 'Very High Risk', value: 0 },
      ];
    }
    
    // Count assessments by risk category
    const riskCounts = {
      'Low Risk': 0,
      'Moderate Risk': 0,
      'High Risk': 0,
      'Very High Risk': 0,
    };

    assessments.forEach(assessment => {
      // Safety check for assessment structure
      if (!assessment || !assessment.result || typeof assessment.result.riskScore !== 'number') {
        console.warn('DatasetSummaryChart - Invalid assessment data:', assessment);
        return;
      }
      
      const riskScore = assessment.result.riskScore;
      console.log(`DatasetSummaryChart - Assessment risk score: ${riskScore}`);
      
      if (riskScore < 20) {
        riskCounts['Low Risk']++;
      } else if (riskScore < 50) {
        riskCounts['Moderate Risk']++;
      } else if (riskScore < 80) {
        riskCounts['High Risk']++;
      } else {
        riskCounts['Very High Risk']++;
      }
    });

    console.log('DatasetSummaryChart - Risk counts:', riskCounts);

    // Convert to array format for Recharts
    const chartData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
    console.log('DatasetSummaryChart - Processed chart data:', chartData);
    
    return chartData;
  };

  const data = processData();

  // Color mapping for risk categories
  const getColor = (entry: { name: string }) => {
    switch (entry.name) {
      case 'Low Risk':
        return '#10B981'; // green
      case 'Moderate Risk':
        return '#F59E0B'; // yellow/amber
      case 'High Risk':
        return '#F97316'; // orange
      case 'Very High Risk':
        return '#EF4444'; // red
      default:
        return '#6366F1'; // indigo
    }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 text-sm text-muted-foreground">
        <h3 className="text-base font-medium text-foreground mb-1">Risk Assessment Distribution</h3>
        <p className="mb-1"><span className="font-semibold">Purpose:</span> This chart summarizes your assessment history by risk category.</p>
        <p className="mb-1"><span className="font-semibold">What it shows:</span> The number of assessments falling into each risk level:</p>
        <ul className="list-disc list-inside ml-2 mb-1">
          <li><span className="font-semibold text-green-500">Low Risk:</span> Risk scores below 20</li>
          <li><span className="font-semibold text-amber-500">Moderate Risk:</span> Risk scores between 20-49</li>
          <li><span className="font-semibold text-orange-500">High Risk:</span> Risk scores between 50-79</li>
          <li><span className="font-semibold text-red-500">Very High Risk:</span> Risk scores 80 and above</li>
        </ul>
        <p><span className="font-semibold">Technical note:</span> This distribution helps identify patterns in your assessment results over time and provides context for your current risk level.</p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            barSize={60}
          >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          label={{ 
            value: 'Number of Assessments', 
            angle: -90, 
            position: 'insideLeft', 
            style: { fill: 'var(--foreground)', fontSize: 12 }
          }}
          tick={{ fill: 'var(--foreground)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--foreground)', opacity: 0.3 }}
        />
        <Tooltip 
          formatter={(value) => [`${value} assessment(s)`, 'Count']}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Legend />
        <Bar dataKey="value" name="Assessments">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry)} />
          ))}
        </Bar>
      </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DatasetSummaryChart;