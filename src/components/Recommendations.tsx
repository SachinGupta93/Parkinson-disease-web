import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface RecommendationsProps {
  recommendations: string[];
  severity: number;
  confidence: number;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  severity,
  confidence
}) => {
  // Determine the recommendation severity level
  const getSeverityLevel = () => {
    if (severity < 30) return 'low';
    if (severity < 60) return 'moderate';
    return 'high';
  };

  const severityLevel = getSeverityLevel();
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {severityLevel === 'low' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {severityLevel === 'moderate' && (
            <Info className="h-5 w-5 text-amber-500" />
          )}
          {severityLevel === 'high' && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Severity Level:</span>
            <span 
              className={`text-sm font-medium ${
                severityLevel === 'low' 
                  ? 'text-green-500' 
                  : severityLevel === 'moderate' 
                    ? 'text-amber-500' 
                    : 'text-red-500'
              }`}
            >
              {severityLevel.charAt(0).toUpperCase() + severityLevel.slice(1)} ({severity}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Analysis Confidence:</span>
            <span className="text-sm font-medium">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No recommendations available</p>
        )}
      </CardContent>
    </Card>
  );
};
