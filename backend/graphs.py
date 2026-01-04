"""
Complete Model Visualization Generator for Parkinson's Insight
This script generates all the evaluation graphs for the machine learning models.
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from sklearn.metrics import (
    confusion_matrix, classification_report, roc_curve, auc,
    precision_recall_curve, average_precision_score
)
try:
    from sklearn.calibration import calibration_curve
except ImportError:
    try:
        from sklearn.metrics import calibration_curve
    except ImportError:
        print("Warning: calibration_curve not available, calibration plots will be skipped")
        calibration_curve = None
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Set style for better looking plots
try:
    plt.style.use('seaborn-v0_8')
except OSError:
    try:
        plt.style.use('seaborn')
    except OSError:
        plt.style.use('default')
        
sns.set_palette("husl")

class ModelVisualizationGenerator:
    def __init__(self, model_dir="model", data_file="parkinsons.data"):
        self.model_dir = model_dir
        self.data_file = data_file
        self.models = {}
        self.scaler = None
        self.X_test = None
        self.y_test = None
        self.feature_names = None
        
        # Create model directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)
        
    def load_data(self):
        """Load and prepare the Parkinson's dataset"""
        try:
            # Load the dataset
            data = pd.read_csv(self.data_file)
            print(f"Dataset shape: {data.shape}")
            print(f"Columns: {data.columns.tolist()}")
            
            # Remove name column (it contains string identifiers)
            if 'name' in data.columns:
                data = data.drop('name', axis=1)
                print("Removed 'name' column")
            
            # Remove any other non-numeric columns
            numeric_columns = data.select_dtypes(include=[np.number]).columns
            if len(numeric_columns) < len(data.columns):
                non_numeric = data.select_dtypes(exclude=[np.number]).columns
                print(f"Removing non-numeric columns: {non_numeric.tolist()}")
                data = data[numeric_columns]
            
            # Assuming 'status' is the target column (1 = Parkinson's, 0 = Healthy)
            if 'status' not in data.columns:
                print("Error: 'status' column not found in dataset")
                return self._create_synthetic_data()
                
            y = data['status']
            X = data.drop('status', axis=1)
            
            # Store feature names
            self.feature_names = X.columns.tolist()
            print(f"Features: {len(self.feature_names)}")
            
            # Split the data
            X_train, self.X_test, y_train, self.y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale the features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            self.X_test_scaled = self.scaler.transform(self.X_test)
            
            print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
            print(f"Training set: {X_train.shape[0]} samples")
            print(f"Test set: {self.X_test.shape[0]} samples")
            print(f"Class distribution: {np.bincount(y)}")
            
            return X_train_scaled, self.X_test_scaled, y_train, self.y_test
            
        except FileNotFoundError:
            print(f"Dataset file '{self.data_file}' not found. Creating synthetic data.")
            return self._create_synthetic_data()
        except Exception as e:
            print(f"Error loading dataset: {e}")
            print("Creating synthetic data instead.")
            return self._create_synthetic_data()
    
    def _create_synthetic_data(self):
        """Create synthetic data for demonstration"""
        np.random.seed(42)
        n_samples = 200
        n_features = 22
        
        # Create synthetic features
        X = np.random.randn(n_samples, n_features)
        
        # Create target with some correlation to features
        y = (X[:, 0] + X[:, 1] + np.random.randn(n_samples) * 0.5 > 0).astype(int)
        
        # Feature names similar to Parkinson's dataset
        self.feature_names = [
            'MDVP_Fo', 'MDVP_Fhi', 'MDVP_Flo', 'MDVP_Jitter_percent',
            'MDVP_Jitter_Abs', 'MDVP_RAP', 'MDVP_PPQ', 'Jitter_DDP',
            'MDVP_Shimmer', 'MDVP_Shimmer_dB', 'Shimmer_APQ3', 'Shimmer_APQ5',
            'MDVP_APQ', 'Shimmer_DDA', 'NHR', 'HNR', 'RPDE', 'DFA',
            'spread1', 'spread2', 'D2', 'PPE'
        ]
        
        # Split the data
        X_train, self.X_test, y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale the features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        print("Created synthetic dataset for demonstration")
        return X_train_scaled, self.X_test_scaled, y_train, self.y_test
    
    def load_models(self):
        """Load all available models"""
        model_files = {
            'svm': 'svm_fixed.joblib',
            'random_forest': 'random_forest_fixed.joblib',
            'neural_network': 'neural_network_fixed.joblib',
            'extra_trees': 'extra_trees_fixed.joblib',
            'ensemble': 'ensemble_fixed.joblib',
            'adaboost': 'adaboost_fixed.joblib',
            'gradient_boosting': 'gradient_boosting.joblib'  # Assuming this exists
        }
        
        for model_name, filename in model_files.items():
            model_path = os.path.join(self.model_dir, filename)
            try:
                if os.path.exists(model_path):
                    model = joblib.load(model_path)
                    self.models[model_name] = model
                    print(f"Loaded {model_name} from {filename}")
                else:
                    print(f"Model file not found: {filename}")
            except Exception as e:
                print(f"Error loading {model_name}: {e}")
        
        if not self.models:
            print("No models loaded. Creating dummy models for demonstration.")
            self._create_dummy_models()
    
    def _create_dummy_models(self):
        """Create dummy models for demonstration"""
        from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, ExtraTreesClassifier
        from sklearn.svm import SVC
        from sklearn.neural_network import MLPClassifier
        from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
        
        # Create and train dummy models
        X_train, _, y_train, _ = self.load_data()
        
        models_to_create = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'svm': SVC(probability=True, random_state=42),
            'neural_network': MLPClassifier(hidden_layer_sizes=(100,), random_state=42),
            'extra_trees': ExtraTreesClassifier(n_estimators=100, random_state=42),
            'adaboost': AdaBoostClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
        }
        
        for name, model in models_to_create.items():
            try:
                model.fit(X_train, y_train)
                self.models[name] = model
                print(f"Created and trained dummy {name} model")
            except Exception as e:
                print(f"Error creating {name}: {e}")
        
        # Create ensemble model
        if len(self.models) >= 3:
            ensemble_models = list(self.models.items())[:3]
            ensemble = VotingClassifier(
                estimators=ensemble_models,
                voting='soft'
            )
            ensemble.fit(X_train, y_train)
            self.models['ensemble'] = ensemble
            print("Created ensemble model")
    
    def generate_confusion_matrix(self, model_name, model):
        """Generate confusion matrix heatmap"""
        try:
            y_pred = model.predict(self.X_test_scaled)
            cm = confusion_matrix(self.y_test, y_pred)
            
            plt.figure(figsize=(8, 6))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                       xticklabels=['Healthy', 'Parkinson\'s'], 
                       yticklabels=['Healthy', 'Parkinson\'s'])
            plt.title(f'{model_name.title()} - Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            
            # Add accuracy text
            accuracy = (cm[0,0] + cm[1,1]) / cm.sum()
            plt.text(0.5, -0.1, f'Accuracy: {accuracy:.3f}', 
                    transform=plt.gca().transAxes, ha='center')
            
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_confusion_matrix.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated confusion matrix for {model_name}")
            
        except Exception as e:
            print(f"Error generating confusion matrix for {model_name}: {e}")
    
    def generate_roc_curve(self, model_name, model):
        """Generate ROC curve"""
        try:
            if hasattr(model, 'predict_proba'):
                y_prob = model.predict_proba(self.X_test_scaled)[:, 1]
            elif hasattr(model, 'decision_function'):
                y_prob = model.decision_function(self.X_test_scaled)
            else:
                print(f"Cannot generate ROC curve for {model_name}: no probability method")
                return
            
            fpr, tpr, _ = roc_curve(self.y_test, y_prob)
            roc_auc = auc(fpr, tpr)
            
            plt.figure(figsize=(8, 6))
            plt.plot(fpr, tpr, color='darkorange', lw=2, 
                    label=f'ROC curve (AUC = {roc_auc:.3f})')
            plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', 
                    label='Random Classifier')
            plt.xlim([0.0, 1.0])
            plt.ylim([0.0, 1.05])
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title(f'{model_name.title()} - ROC Curve')
            plt.legend(loc="lower right")
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_roc_curve.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated ROC curve for {model_name}")
            
        except Exception as e:
            print(f"Error generating ROC curve for {model_name}: {e}")
    
    def generate_precision_recall_curve(self, model_name, model):
        """Generate Precision-Recall curve"""
        try:
            if hasattr(model, 'predict_proba'):
                y_prob = model.predict_proba(self.X_test_scaled)[:, 1]
            elif hasattr(model, 'decision_function'):
                y_prob = model.decision_function(self.X_test_scaled)
            else:
                print(f"Cannot generate PR curve for {model_name}: no probability method")
                return
            
            precision, recall, _ = precision_recall_curve(self.y_test, y_prob)
            avg_precision = average_precision_score(self.y_test, y_prob)
            
            plt.figure(figsize=(8, 6))
            plt.plot(recall, precision, color='darkorange', lw=2,
                    label=f'PR curve (AP = {avg_precision:.3f})')
            plt.xlabel('Recall')
            plt.ylabel('Precision')
            plt.title(f'{model_name.title()} - Precision-Recall Curve')
            plt.legend(loc="lower left")
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_precision_recall_curve.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated Precision-Recall curve for {model_name}")
            
        except Exception as e:
            print(f"Error generating PR curve for {model_name}: {e}")
    
    def generate_feature_importance(self, model_name, model):
        """Generate feature importance plot"""
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            elif hasattr(model, 'coef_'):
                importances = np.abs(model.coef_[0])
            else:
                print(f"Cannot generate feature importance for {model_name}: no importance attribute")
                return
            
            # Sort features by importance
            indices = np.argsort(importances)[::-1]
            top_features = min(15, len(importances))  # Show top 15 features
            
            plt.figure(figsize=(10, 8))
            plt.barh(range(top_features), importances[indices[:top_features]])
            plt.yticks(range(top_features), [self.feature_names[i] for i in indices[:top_features]])
            plt.xlabel('Feature Importance')
            plt.title(f'{model_name.title()} - Feature Importance')
            plt.gca().invert_yaxis()
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_feature_importance.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated feature importance for {model_name}")
            
        except Exception as e:
            print(f"Error generating feature importance for {model_name}: {e}")
    
    def generate_calibration_curve(self, model_name, model):
        """Generate calibration curve"""
        try:
            if calibration_curve is None:
                print(f"Calibration curve not available for {model_name}: calibration_curve function not imported")
                return
                
            if hasattr(model, 'predict_proba'):
                y_prob = model.predict_proba(self.X_test_scaled)[:, 1]
            else:
                print(f"Cannot generate calibration curve for {model_name}: no predict_proba method")
                return
            
            fraction_of_positives, mean_predicted_value = calibration_curve(
                self.y_test, y_prob, n_bins=10
            )
            
            plt.figure(figsize=(8, 6))
            plt.plot(mean_predicted_value, fraction_of_positives, "s-", 
                    label=f'{model_name.title()}', linewidth=2, markersize=8)
            plt.plot([0, 1], [0, 1], "k--", label="Perfectly calibrated")
            plt.xlabel('Mean Predicted Probability')
            plt.ylabel('Fraction of Positives')
            plt.title(f'{model_name.title()} - Calibration Curve')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_calibration_curve.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated calibration curve for {model_name}")
            
        except Exception as e:
            print(f"Error generating calibration curve for {model_name}: {e}")
    
    def generate_probability_distribution(self, model_name, model):
        """Generate probability distribution plot"""
        try:
            if hasattr(model, 'predict_proba'):
                y_prob = model.predict_proba(self.X_test_scaled)[:, 1]
            else:
                print(f"Cannot generate probability distribution for {model_name}: no predict_proba method")
                return
            
            plt.figure(figsize=(10, 6))
            
            # Plot distributions for each class
            prob_class_0 = y_prob[self.y_test == 0]
            prob_class_1 = y_prob[self.y_test == 1]
            
            plt.hist(prob_class_0, bins=20, alpha=0.7, label='Healthy', 
                    color='lightblue', density=True)
            plt.hist(prob_class_1, bins=20, alpha=0.7, label='Parkinson\'s', 
                    color='lightcoral', density=True)
            
            plt.xlabel('Predicted Probability')
            plt.ylabel('Density')
            plt.title(f'{model_name.title()} - Probability Distribution')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_probabilities_distribution.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated probability distribution for {model_name}")
            
        except Exception as e:
            print(f"Error generating probability distribution for {model_name}: {e}")
    
    def generate_classification_report_heatmap(self, model_name, model):
        """Generate classification report as heatmap"""
        try:
            y_pred = model.predict(self.X_test_scaled)
            report = classification_report(self.y_test, y_pred, output_dict=True)
            
            # Convert to DataFrame for heatmap
            df_report = pd.DataFrame(report).iloc[:-1, :].T  # Remove last row
            
            # Remove 'support' column if it exists
            if 'support' in df_report.columns:
                df_report = df_report.drop('support', axis=1)
            
            plt.figure(figsize=(8, 6))
            sns.heatmap(df_report, annot=True, fmt='.3f', cmap='Blues', 
                       cbar_kws={'label': 'Score'})
            plt.title(f'{model_name.title()} - Classification Report')
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, f'{model_name}_classification_report_heatmap.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print(f"Generated classification report heatmap for {model_name}")
            
        except Exception as e:
            print(f"Error generating classification report for {model_name}: {e}")
    
    def generate_model_comparison(self):
        """Generate model comparison chart"""
        try:
            model_metrics = {}
            
            for model_name, model in self.models.items():
                y_pred = model.predict(self.X_test_scaled)
                
                # Calculate metrics
                cm = confusion_matrix(self.y_test, y_pred)
                accuracy = (cm[0,0] + cm[1,1]) / cm.sum()
                
                # Precision and Recall
                precision = cm[1,1] / (cm[1,1] + cm[0,1]) if (cm[1,1] + cm[0,1]) > 0 else 0
                recall = cm[1,1] / (cm[1,1] + cm[1,0]) if (cm[1,1] + cm[1,0]) > 0 else 0
                f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
                
                model_metrics[model_name] = {
                    'Accuracy': accuracy,
                    'Precision': precision,
                    'Recall': recall,
                    'F1-Score': f1
                }
            
            # Create comparison plot
            df_metrics = pd.DataFrame(model_metrics).T
            
            plt.figure(figsize=(12, 8))
            
            # Bar plot
            ax = df_metrics.plot(kind='bar', width=0.8, figsize=(12, 8))
            plt.title('Model Performance Comparison')
            plt.xlabel('Models')
            plt.ylabel('Score')
            plt.xticks(rotation=45)
            plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, 'model_comparison.png'), 
                       dpi=300, bbox_inches='tight')
            plt.close()
            print("Generated model comparison chart")
            
        except Exception as e:
            print(f"Error generating model comparison: {e}")
    
    def generate_all_graphs(self):
        """Generate all visualization graphs"""
        print("Starting graph generation...")
        
        # Load data and models
        self.load_data()
        self.load_models()
        
        if not self.models:
            print("No models available for visualization.")
            return
        
        print(f"\nGenerating graphs for {len(self.models)} models...")
        
        # Generate graphs for each model
        for model_name, model in self.models.items():
            print(f"\nProcessing {model_name}...")
            
            # Generate different types of visualizations
            self.generate_confusion_matrix(model_name, model)
            self.generate_roc_curve(model_name, model)
            self.generate_precision_recall_curve(model_name, model)
            self.generate_feature_importance(model_name, model)
            self.generate_calibration_curve(model_name, model)
            self.generate_probability_distribution(model_name, model)
            self.generate_classification_report_heatmap(model_name, model)
        
        # Generate model comparison
        self.generate_model_comparison()
        
        print(f"\nAll graphs generated successfully in '{self.model_dir}' directory!")
        print("Generated files:")
        for file in os.listdir(self.model_dir):
            if file.endswith('.png'):
                print(f"  - {file}")

if __name__ == "__main__":
    # Initialize the generator
    generator = ModelVisualizationGenerator()
    
    # Generate all graphs
    generator.generate_all_graphs()