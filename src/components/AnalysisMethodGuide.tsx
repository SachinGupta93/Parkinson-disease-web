import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Mic, 
  Brain, 
  BarChart4, 
  CheckCircle, 
  ArrowRight,
  Info
} from 'lucide-react';

interface AnalysisMethodGuideProps {
  className?: string;
}

const AnalysisMethodGuide: React.FC<AnalysisMethodGuideProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Choose Your Analysis Method
        </h2>
        <p className="text-muted-foreground">
          Select the assessment type that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinical Assessment */}
        <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Clinical Assessment</CardTitle>
            <CardDescription>
              Symptom-based evaluation with optional voice analysis
            </CardDescription>
            <Badge variant="secondary" className="w-fit mx-auto">
              Symptom Checker
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Clinical symptom evaluation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Optional voice recording</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Quick assessment (2-3 minutes)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Single comprehensive result</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Best for:</div>
              <div className="text-sm">
                • Initial screening
                <br />
                • Symptom tracking
                <br />
                • Quick health check
              </div>
            </div>

            <Button 
              onClick={() => navigate('/app/symptom-checker')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Clinical Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Multi-Model Analysis */}
        <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl">Multi-Model Analysis</CardTitle>
            <CardDescription>
              Advanced voice analysis using 7 AI models
            </CardDescription>
            <Badge variant="secondary" className="w-fit mx-auto">
              7 AI Models
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>7 different AI models</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Detailed voice feature analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Model comparison charts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Feature importance analysis</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Best for:</div>
              <div className="text-sm">
                • Detailed voice analysis
                <br />
                • Research purposes
                <br />
                • Comprehensive evaluation
              </div>
            </div>

            <Button 
              onClick={() => navigate('/app/multi-model-analysis')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Start Multi-Model Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3 items-start">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-300">
                Understanding the Difference
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <p>
                  <strong>Clinical Assessment</strong> focuses on traditional symptoms and provides a single, comprehensive risk score. 
                  It's perfect for quick screening and symptom tracking.
                </p>
                <p>
                  <strong>Multi-Model Analysis</strong> uses advanced voice analysis with 7 different AI models to provide 
                  detailed insights and comparisons. It's ideal for research and comprehensive evaluation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisMethodGuide;