"""
Model Training Script for Parkinson's Disease Prediction
This script loads the parkinsons.data file and trains multiple ML models.
"""

import pandas as pd
import numpy as np
import joblib
import os
import logging
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import (
    RandomForestClassifier, 
    VotingClassifier, 
    AdaBoostClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier
)
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    accuracy_score,
    precision_recall_fscore_support,
    roc_auc_score,
    roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import validation_curve
import warnings
warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParkinsonsModelTrainer:
    def __init__(self, data_path="parkinsons.data", model_dir="model"):
        self.data_path = data_path
        self.model_dir = model_dir
        self.models = {}
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.feature_names = None
        
        # Create model directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
        
    def load_data(self):
        """Load and preprocess the Parkinson's dataset."""
        print("🔄 Loading Parkinson's dataset...")
        logger.info("Loading Parkinson's dataset")
        
        try:
            # Load the data
            df = pd.read_csv(self.data_path)
            print(f"✅ Dataset loaded successfully: {df.shape[0]} samples, {df.shape[1]} features")
            
            # Clean column names (remove leading/trailing whitespace)
            df.columns = df.columns.str.strip()
            
            # Display basic info about the dataset
            print(f"📊 Dataset Info:")
            print(f"   - Total samples: {len(df)}")
            print(f"   - Features: {df.shape[1] - 2}")  # Excluding 'name' and 'status'
            print(f"   - Parkinson's cases: {df['status'].sum()}")
            print(f"   - Healthy cases: {len(df) - df['status'].sum()}")
            
            # Remove the 'name' column as it's not a feature
            if 'name' in df.columns:
                df = df.drop('name', axis=1)
                print("   - Removed 'name' column")
            
            # Separate features and target
            X = df.drop('status', axis=1)
            y = df['status']
            
            # Store feature names
            self.feature_names = X.columns.tolist()
            print(f"   - Feature names stored: {len(self.feature_names)} features")
            
            return X, y
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            print(f"❌ Error loading data: {str(e)}")
            raise
    
    def split_and_scale_data(self, X, y, test_size=0.2, random_state=42):
        """Split data into train/test sets and scale features."""
        print("🔄 Splitting and scaling data...")
        
        # Split the data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"   - Training set: {self.X_train.shape[0]} samples")
        print(f"   - Test set: {self.X_test.shape[0]} samples")
        
        # Scale the features
        self.scaler = StandardScaler()
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        print("✅ Data split and scaled successfully")
        
    def train_models(self):
        """Train multiple machine learning models."""
        print("🔄 Training machine learning models...")
        
        # Define models with optimized hyperparameters
        model_configs = {
            'random_forest': {
                'model': RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    min_samples_split=5,
                    min_samples_leaf=2,
                    random_state=42
                ),
                'description': 'Random Forest Classifier'
            },
            'svm': {
                'model': SVC(
                    kernel='rbf',
                    C=1.0,
                    gamma='scale',
                    probability=True,
                    random_state=42
                ),
                'description': 'Support Vector Machine'
            },
            'neural_network': {
                'model': MLPClassifier(
                    hidden_layer_sizes=(100, 50),
                    max_iter=1000,
                    alpha=0.001,
                    random_state=42
                ),
                'description': 'Multi-layer Perceptron Neural Network'
            },
            'extra_trees': {
                'model': ExtraTreesClassifier(
                    n_estimators=100,
                    max_depth=10,
                    min_samples_split=5,
                    min_samples_leaf=2,
                    random_state=42
                ),
                'description': 'Extra Trees Classifier'
            },
            'adaboost': {
                'model': AdaBoostClassifier(
                    n_estimators=50,
                    learning_rate=1.0,
                    random_state=42
                ),
                'description': 'AdaBoost Classifier'
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3,
                    random_state=42
                ),
                'description': 'Gradient Boosting Classifier'
            }
        }
        
        results = {}
        
        for model_name, config in model_configs.items():
            print(f"\n🔄 Training {config['description']}...")
            
            try:
                # Train the model
                model = config['model']
                model.fit(self.X_train_scaled, self.y_train)
                
                # Make predictions
                y_pred = model.predict(self.X_test_scaled)
                y_pred_proba = model.predict_proba(self.X_test_scaled)[:, 1]
                
                # Calculate metrics
                accuracy = accuracy_score(self.y_test, y_pred)
                precision, recall, f1, _ = precision_recall_fscore_support(self.y_test, y_pred, average='binary')
                auc_score = roc_auc_score(self.y_test, y_pred_proba)
                
                # Cross-validation score
                cv_scores = cross_val_score(model, self.X_train_scaled, self.y_train, cv=5)
                
                results[model_name] = {
                    'model': model,
                    'accuracy': accuracy,
                    'precision': precision,
                    'recall': recall,
                    'f1': f1,
                    'auc': auc_score,
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std()
                }
                
                print(f"   ✅ {model_name}: Accuracy={accuracy:.4f}, F1={f1:.4f}, AUC={auc_score:.4f}")
                
                # Store the trained model
                self.models[model_name] = model
                
            except Exception as e:
                logger.error(f"Error training {model_name}: {str(e)}")
                print(f"   ❌ Error training {model_name}: {str(e)}")
        
        return results
    
    def create_ensemble_model(self):
        """Create an ensemble voting classifier."""
        print("\n🔄 Creating ensemble model...")
        
        try:
            # Select best performing models for ensemble
            estimators = []
            for name, model in self.models.items():
                if name in ['random_forest', 'svm', 'neural_network']:
                    estimators.append((name, model))
            
            if len(estimators) >= 2:
                ensemble = VotingClassifier(
                    estimators=estimators,
                    voting='soft'  # Use probability-based voting
                )
                
                ensemble.fit(self.X_train_scaled, self.y_train)
                
                # Evaluate ensemble
                y_pred = ensemble.predict(self.X_test_scaled)
                accuracy = accuracy_score(self.y_test, y_pred)
                
                self.models['ensemble'] = ensemble
                print(f"   ✅ Ensemble model created: Accuracy={accuracy:.4f}")
                
                return ensemble
            else:
                print("   ⚠️ Not enough models for ensemble creation")
                return None
                
        except Exception as e:
            logger.error(f"Error creating ensemble: {str(e)}")
            print(f"   ❌ Error creating ensemble: {str(e)}")
            return None
    
    def save_models(self):
        """Save all trained models and scaler."""
        print("\n🔄 Saving models...")
        
        try:
            # Save scaler
            scaler_path = os.path.join(self.model_dir, "scaler_fixed.joblib")
            joblib.dump(self.scaler, scaler_path)
            print(f"   ✅ Scaler saved: {scaler_path}")
            
            # Save feature names
            feature_names_path = os.path.join(self.model_dir, "feature_names_fixed.joblib")
            joblib.dump(self.feature_names, feature_names_path)
            print(f"   ✅ Feature names saved: {feature_names_path}")
            
            # Save each model
            for model_name, model in self.models.items():
                model_path = os.path.join(self.model_dir, f"{model_name}_fixed.joblib")
                joblib.dump(model, model_path)
                print(f"   ✅ {model_name} saved: {model_path}")
            
            print("✅ All models saved successfully!")
            
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
            print(f"❌ Error saving models: {str(e)}")
    
    def generate_model_report(self, results):
        """Generate a comprehensive model performance report."""
        print("\n📊 Generating model performance report...")
        
        # Create results DataFrame
        df_results = pd.DataFrame(results).T
        df_results = df_results.round(4)
        
        print("\n📈 Model Performance Summary:")
        print("=" * 80)
        print(f"{'Model':<20} {'Accuracy':<10} {'Precision':<10} {'Recall':<10} {'F1-Score':<10} {'AUC':<10}")
        print("=" * 80)
        
        for model_name, metrics in results.items():
            print(f"{model_name:<20} {metrics['accuracy']:<10.4f} {metrics['precision']:<10.4f} "
                  f"{metrics['recall']:<10.4f} {metrics['f1']:<10.4f} {metrics['auc']:<10.4f}")
        
        print("=" * 80)
        
        # Save detailed report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = os.path.join(self.model_dir, f"model_metrics_{timestamp}.txt")
        
        with open(report_path, 'w') as f:
            f.write("Parkinson's Disease Prediction Model Training Report\n")
            f.write("=" * 60 + "\n")
            f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Dataset: {self.data_path}\n")
            f.write(f"Total Features: {len(self.feature_names)}\n")
            f.write(f"Training Samples: {len(self.X_train)}\n")
            f.write(f"Test Samples: {len(self.X_test)}\n\n")
            
            f.write("Model Performance Results:\n")
            f.write("-" * 40 + "\n")
            for model_name, metrics in results.items():
                f.write(f"\n{model_name.upper()}:\n")
                f.write(f"  Accuracy: {metrics['accuracy']:.4f}\n")
                f.write(f"  Precision: {metrics['precision']:.4f}\n")
                f.write(f"  Recall: {metrics['recall']:.4f}\n")
                f.write(f"  F1-Score: {metrics['f1']:.4f}\n")
                f.write(f"  AUC: {metrics['auc']:.4f}\n")
                f.write(f"  CV Mean: {metrics['cv_mean']:.4f} ± {metrics['cv_std']:.4f}\n")
        
        print(f"✅ Detailed report saved: {report_path}")
    
    def plot_feature_importance(self):
        """Plot feature importance for tree-based models."""
        try:
            print("\n📊 Generating feature importance plots...")
            
            plt.figure(figsize=(12, 8))
            
            # Random Forest feature importance
            if 'random_forest' in self.models:
                rf_model = self.models['random_forest']
                feature_importance = rf_model.feature_importances_
                
                # Sort features by importance
                indices = np.argsort(feature_importance)[::-1]
                
                plt.figure(figsize=(12, 8))
                plt.title('Feature Importance - Random Forest')
                plt.bar(range(len(feature_importance)), feature_importance[indices])
                plt.xticks(range(len(feature_importance)), 
                          [self.feature_names[i] for i in indices], rotation=45, ha='right')
                plt.tight_layout()
                
                importance_plot_path = os.path.join(self.model_dir, "random_forest_feature_importance.png")
                plt.savefig(importance_plot_path, dpi=300, bbox_inches='tight')
                plt.close()
                
                print(f"   ✅ Feature importance plot saved: {importance_plot_path}")
            
        except Exception as e:
            logger.error(f"Error generating feature importance plot: {str(e)}")
            print(f"   ❌ Error generating plots: {str(e)}")
    
    def train_all(self):
        """Main training pipeline."""
        print("🚀 Starting Parkinson's Disease Model Training Pipeline")
        print("=" * 60)
        
        try:
            # Load data
            X, y = self.load_data()
            
            # Split and scale data
            self.split_and_scale_data(X, y)
            
            # Train models
            results = self.train_models()
            
            # Create ensemble
            self.create_ensemble_model()
            
            # Save models
            self.save_models()
            
            # Generate reports
            self.generate_model_report(results)
            
            # Plot feature importance
            self.plot_feature_importance()
            
            print("\n🎉 Training pipeline completed successfully!")
            print("=" * 60)
            print("✅ All models have been trained and saved.")
            print("✅ The API can now use these updated models for predictions.")
            
            return True
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {str(e)}")
            print(f"❌ Training pipeline failed: {str(e)}")
            return False

def main():
    """Main function to run the training pipeline."""
    trainer = ParkinsonsModelTrainer()
    success = trainer.train_all()
    
    if success:
        print("\n🎯 Next steps:")
        print("1. Restart your FastAPI server to load the new models")
        print("2. Test the API endpoints to verify the models work correctly")
        print("3. Check the model/ directory for all saved files")
    else:
        print("\n❌ Training failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
