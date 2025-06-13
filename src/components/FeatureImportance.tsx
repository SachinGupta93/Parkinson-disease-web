
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureImportanceProps {
  featureImportance: Record<string, number>;
}

const FeatureImportance: React.FC<FeatureImportanceProps> = ({ featureImportance }) => {
  // Sort features by importance (descending)
  const sortedFeatures = Object.entries(featureImportance)
    .sort(([, valueA], [, valueB]) => valueB - valueA);
  
  // Feature name formatting
  const formatFeatureName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Feature Importance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedFeatures.map(([feature, importance]) => {
            const percentImportance = (importance * 100).toFixed(1);
            
            return (
              <div key={feature} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{formatFeatureName(feature)}</span>
                  <span className="font-mono">{percentImportance}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${percentImportance}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportance;
