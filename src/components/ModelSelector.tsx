
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelType } from "@/types";

interface ModelSelectorProps {
  selectedModel: ModelType | 'ensemble';
  onModelChange: (model: ModelType | 'ensemble') => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel,
  onModelChange
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="model-selector" className="text-sm font-medium">
        ML Model Selection
      </label>
      <Select 
        value={selectedModel} 
        onValueChange={(value) => onModelChange(value as ModelType | 'ensemble')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select ML model" />        </SelectTrigger>        <SelectContent>
          <SelectItem value="ensemble">Ensemble (All Models)</SelectItem>
          <SelectItem value="randomForest">Random Forest</SelectItem>
          <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
          <SelectItem value="neuralNetwork">Neural Network</SelectItem>
          <SelectItem value="svm">Support Vector Machine</SelectItem>
          <SelectItem value="adaboost">AdaBoost</SelectItem>
          <SelectItem value="extra_trees">Extra Trees</SelectItem>
          <SelectItem value="xgboost">XGBoost</SelectItem>
        </SelectContent>
      </Select>
        <div className="text-xs text-muted-foreground mt-1">
        {selectedModel === 'ensemble' ? (
          <p>Uses weighted predictions from all models for maximum accuracy (92.3% accuracy on test data)</p>
        ) : selectedModel === 'gradient_boosting' ? (
          <p>Gradient boosting model - excellent with mixed clinical & voice features (79.5% accuracy)</p>
        ) : selectedModel === 'randomForest' ? (
          <p>Robust decision tree ensemble with highest individual accuracy (92.3% accuracy)</p>
        ) : selectedModel === 'neuralNetwork' ? (
          <p>Deep learning model for complex patterns in vocal features (87.2% accuracy)</p>
        ) : selectedModel === 'svm' ? (
          <p>Support Vector Machine for separating borderline cases (82.1% accuracy)</p>
        ) : selectedModel === 'adaboost' ? (
          <p>Adaptive boosting algorithm focusing on difficult cases (84.6% accuracy)</p>
        ) : selectedModel === 'xgboost' ? (
          <p>XGBoost model - powerful gradient boosting framework (90.5% accuracy)</p>
        ) : selectedModel === 'extra_trees' ? (
          <p>Extra Trees ensemble for reduced variance and improved stability (89.7% accuracy)</p>
        ) : (
          <p>Uses weighted predictions from all models for maximum accuracy (92.3% accuracy on test data)</p>
        )}

      </div>
    </div>
  );
};

export default ModelSelector;
