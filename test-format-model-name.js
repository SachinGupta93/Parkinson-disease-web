// Simple test for formatModelName function
const formatModelName = (modelType) => {
  // Safety check for undefined/null modelType
  if (!modelType || typeof modelType !== 'string') {
    return 'Unknown Model';
  }
  
  switch(modelType) {
    case 'xgboost': return 'XGBoost';
    case 'random_forest': return 'Random Forest';
    case 'randomForest': return 'Random Forest';
    case 'neural_network': return 'Neural Network';
    case 'neuralNetwork': return 'Neural Network';
    case 'svm': return 'SVM';
    case 'gradient_boosting': return 'Gradient Boosting';
    case 'adaboost': return 'AdaBoost';
    case 'extra_trees': return 'Extra Trees';
    case 'ensemble': return 'Ensemble';
    case 'ensemble_voting_classifier': return 'Ensemble';
    default: return modelType.charAt(0).toUpperCase() + modelType.slice(1).replace('_', ' ');
  }
};

// Test cases
console.log('Testing formatModelName function:');
console.log('undefined:', formatModelName(undefined));
console.log('null:', formatModelName(null));
console.log('empty string:', formatModelName(''));
console.log('number:', formatModelName(123));
console.log('xgboost:', formatModelName('xgboost'));
console.log('random_forest:', formatModelName('random_forest'));
console.log('unknown_model:', formatModelName('unknown_model'));