import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier,
    ExtraTreesClassifier,
    VotingClassifier
)
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    average_precision_score,
    f1_score,
    matthews_corrcoef,
    roc_curve
)
from sklearn.calibration import calibration_curve, CalibrationDisplay
import joblib
import os
import logging
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def plot_confusion_matrix_for_model(cm: np.ndarray, class_names: List[str], model_name: str, output_dir: str) -> None:
    """Plot and save confusion matrix visualization for a specific model."""
    try:
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
        plt.title(f'Confusion Matrix - {model_name.replace("_", " ").title()}')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        plt.tight_layout()
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_confusion_matrix.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved confusion matrix for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting confusion matrix for {model_name}: {str(e)}")

def plot_roc_curve(y_true: pd.Series, y_pred_proba: np.ndarray, model_name: str, output_dir: str) -> None:
    """Plot and save ROC curve for a model."""
    try:
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        roc_auc = roc_auc_score(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {model_name.replace("_", " ").title()}')
        plt.legend(loc="lower right")
        plt.tight_layout()
        
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_roc_curve.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved ROC curve for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting ROC curve for {model_name}: {str(e)}")

def plot_precision_recall_curve_for_model(y_true: pd.Series, y_pred_proba: np.ndarray, model_name: str, output_dir: str) -> None:
    """Plot and save Precision-Recall curve for a model."""
    try:
        precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
        avg_precision = average_precision_score(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, color='blue', lw=2, label=f'Precision-Recall curve (AP = {avg_precision:.2f})')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.ylim([0.0, 1.05])
        plt.xlim([0.0, 1.0])
        plt.title(f'Precision-Recall Curve - {model_name.replace("_", " ").title()}')
        plt.legend(loc="lower left")
        plt.tight_layout()
        
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_precision_recall_curve.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved Precision-Recall curve for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting Precision-Recall curve for {model_name}: {str(e)}")

def load_data(file_path: str) -> Tuple[pd.DataFrame, pd.Series]:
    """Load and preprocess the Parkinson's dataset."""
    try:
        # Read the data
        data = pd.read_csv(file_path)
        logger.info(f"Loaded dataset with shape: {data.shape}")
        
        # Separate features and target
        X = data.drop(['name', 'status'], axis=1)
        y = data['status']
        
        return X, y
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise

def plot_feature_importance(model: Any, feature_names: List[str], output_dir: str, model_name_suffix: str) -> None:
    """Plot and save feature importance visualization."""
    try:
        plt.figure(figsize=(12, 6))
        
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_') and model.coef_.ndim == 2 and model.coef_.shape[0] == 1:
            importances = np.abs(model.coef_[0])
        elif hasattr(model, 'coef_') and model.coef_.ndim == 1:
            importances = np.abs(model.coef_)
        else:
            logger.warning(f"Model {type(model).__name__} ({model_name_suffix}) does not directly support feature importance or coef_ shape not handled.")
            return
        
        indices = np.argsort(importances)[::-1]
        
        plt.title(f'Feature Importance - {model_name_suffix.replace("_", " ").title()}')
        plt.bar(range(len(importances)), importances[indices])
        plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=45, ha='right')
        plt.tight_layout()
        os.makedirs(output_dir, exist_ok=True)
        plt.savefig(os.path.join(output_dir, f'{model_name_suffix}_feature_importance.png'))
        plt.close()
        logger.info(f"Saved feature importance for {model_name_suffix} to {os.path.join(output_dir, f'{model_name_suffix}_feature_importance.png')}")
        
    except Exception as e:
        logger.error(f"Error plotting feature importance for {model_name_suffix}: {str(e)}")

def plot_calibration_curve(y_true: pd.Series, y_pred_proba: np.ndarray, model_name: str, output_dir: str) -> None:
    """Plot and save calibration curve for a model."""
    try:
        plt.figure(figsize=(10, 8))
        disp = CalibrationDisplay.from_predictions(y_true, y_pred_proba, n_bins=10, name=model_name.replace("_", " ").title())
        plt.title(f'Calibration Curve - {model_name.replace("_", " ").title()}')
        plt.tight_layout()
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_calibration_curve.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved calibration curve for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting calibration curve for {model_name}: {str(e)}")

def plot_predicted_probabilities_distribution(y_pred_proba: np.ndarray, model_name: str, output_dir: str) -> None:
    """Plot and save histogram of predicted probabilities for a model."""
    try:
        plt.figure(figsize=(10, 6))
        sns.histplot(y_pred_proba, kde=True, bins=50)
        plt.title(f'Distribution of Predicted Probabilities - {model_name.replace("_", " ").title()}')
        plt.xlabel('Predicted Probability')
        plt.ylabel('Frequency')
        plt.tight_layout()
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_probabilities_distribution.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved predicted probabilities distribution for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting predicted probabilities distribution for {model_name}: {str(e)}")

def plot_classification_report_heatmap(y_true: pd.Series, y_pred: np.ndarray, class_names: List[str], model_name: str, output_dir: str) -> None:
    """Plot and save a heatmap of the classification report."""
    try:
        report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
        report_df_data = {k: v for k, v in report.items() if k in class_names}
        
        if not report_df_data:
            report_df_data = {k: v for k, v in report.items() if isinstance(v, dict) and 'f1-score' in v}

        df = pd.DataFrame(report_df_data).T
        df_heatmap = df[['precision', 'recall', 'f1-score']]

        plt.figure(figsize=(10, max(6, len(class_names) * 0.8)))
        sns.heatmap(df_heatmap, annot=True, cmap="viridis", fmt=".2f")
        plt.title(f'Classification Report Heatmap - {model_name.replace("_", " ").title()}')
        plt.tight_layout()
        os.makedirs(output_dir, exist_ok=True)
        plot_path = os.path.join(output_dir, f'{model_name}_classification_report_heatmap.png')
        plt.savefig(plot_path)
        plt.close()
        logger.info(f"Saved classification report heatmap for {model_name} to {plot_path}")
    except Exception as e:
        logger.error(f"Error plotting classification report heatmap for {model_name}: {str(e)}")

def plot_model_comparison(metrics: Dict[str, Dict[str, float]], output_dir: str) -> None:
    """Plot and save model comparison visualization."""
    try:
        plt.figure(figsize=(12, 6))
        
        models = list(metrics.keys())
        accuracies = [m['accuracy'] for m in metrics.values()]
        cv_means = [m['cv_mean'] for m in metrics.values()]
        cv_stds = [m['cv_std'] for m in metrics.values()]
        
        x = np.arange(len(models))
        width = 0.35
        
        plt.bar(x - width/2, accuracies, width, label='Test Accuracy')
        plt.bar(x + width/2, cv_means, width, label='CV Mean', yerr=cv_stds)
        
        plt.xlabel('Models')
        plt.ylabel('Score')
        plt.title('Model Performance Comparison')
        plt.xticks(x, models, rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        plt.savefig(os.path.join(output_dir, 'model_comparison.png'))
        plt.close()
        
    except Exception as e:
        logger.error(f"Error plotting model comparison: {str(e)}")

def train_models(X: pd.DataFrame, y: pd.Series, output_dir: str) -> Tuple[Dict[str, Any], StandardScaler, List[str], Dict[str, Dict[str, Any]]]:
    """Train multiple models and return the best performing ones."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    feature_names = X.columns.tolist()
    class_names_for_plot = [str(label) for label in sorted(y.unique())]
    
    models = {
        'random_forest': RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        ),
        'gradient_boosting': GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        ),
        'svm': SVC(
            probability=True,
            kernel='rbf',
            C=1.0,
            gamma='scale',
            random_state=42
        ),
        'neural_network': MLPClassifier(
            hidden_layer_sizes=(100, 50),
            max_iter=1000,
            alpha=0.0001,
            random_state=42
        ),
        'adaboost': AdaBoostClassifier(
            n_estimators=100,
            learning_rate=1.0,
            random_state=42
        ),
        'extra_trees': ExtraTreesClassifier(
            n_estimators=200,
            max_depth=10,
            random_state=42
        )
    }
    
    trained_models = {}
    model_metrics = {}
    
    for name, model in models.items():
        logger.info(f"\nTraining {name}...")
        
        model.fit(X_train_scaled, y_train)
        
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        mcc = matthews_corrcoef(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        avg_precision = average_precision_score(y_test, y_pred_proba)
        
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv)
        
        current_cm = confusion_matrix(y_test, y_pred)
        model_metrics[name] = {
            'accuracy': accuracy,
            'f1_score': f1,
            'mcc': mcc,
            'roc_auc': roc_auc,
            'avg_precision': avg_precision,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'classification_report': classification_report(y_test, y_pred, target_names=class_names_for_plot),
            'confusion_matrix': current_cm
        }
        
        if name == 'random_forest':
            plot_feature_importance(model, feature_names, output_dir, model_name_suffix=name)
        elif name == 'gradient_boosting':
            plot_roc_curve(y_test, y_pred_proba, name, output_dir)
        elif name == 'svm':
            plot_precision_recall_curve_for_model(y_test, y_pred_proba, name, output_dir)
        elif name == 'neural_network':
            plot_calibration_curve(y_test, y_pred_proba, name, output_dir)
        elif name == 'adaboost':
            plot_confusion_matrix_for_model(current_cm, class_names_for_plot, name, output_dir)
        elif name == 'extra_trees':
            plot_predicted_probabilities_distribution(y_pred_proba, name, output_dir)
        
        logger.info(f"{name} metrics:")
        logger.info(f"Accuracy: {accuracy:.4f}")
        logger.info(f"F1 Score: {f1:.4f}")
        logger.info(f"MCC: {mcc:.4f}")
        logger.info(f"ROC AUC: {roc_auc:.4f}")
        logger.info(f"Average Precision: {avg_precision:.4f}")
        logger.info(f"CV Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        if accuracy > 0.85:
            trained_models[name] = model
    
    if len(trained_models) > 1:
        ensemble = VotingClassifier(
            estimators=[(name, model) for name, model in trained_models.items()],
            voting='soft'
        )
        ensemble.fit(X_train_scaled, y_train)
        trained_models['ensemble'] = ensemble
        
        y_pred_ensemble = ensemble.predict(X_test_scaled)
        y_pred_proba_ensemble = ensemble.predict_proba(X_test_scaled)[:, 1]
        ensemble_cm = confusion_matrix(y_test, y_pred_ensemble)
        
        model_metrics['ensemble'] = {
            'accuracy': accuracy_score(y_test, y_pred_ensemble),
            'f1_score': f1_score(y_test, y_pred_ensemble),
            'mcc': matthews_corrcoef(y_test, y_pred_ensemble),
            'roc_auc': roc_auc_score(y_test, y_pred_proba_ensemble),
            'avg_precision': average_precision_score(y_test, y_pred_proba_ensemble),
            'cv_mean': cross_val_score(ensemble, X_train_scaled, y_train, cv=cv).mean(),
            'cv_std': cross_val_score(ensemble, X_train_scaled, y_train, cv=cv).std(),
            'classification_report': classification_report(y_test, y_pred_ensemble, target_names=class_names_for_plot),
            'confusion_matrix': ensemble_cm
        }
        plot_classification_report_heatmap(y_test, y_pred_ensemble, class_names_for_plot, 'ensemble', output_dir)

    return trained_models, scaler, feature_names, model_metrics

def save_metrics(metrics: Dict[str, Dict[str, Any]], output_dir: str) -> None:
    """Save model metrics to a file and generate visualizations."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    metrics_file = os.path.join(output_dir, f"model_metrics_{timestamp}.txt")
    
    with open(metrics_file, 'w') as f:
        f.write("Model Training Metrics\n")
        f.write("=====================\n\n")
        
        for name, metric in metrics.items():
            f.write(f"\n{name.upper()}\n")
            f.write("-" * len(name) + "\n")
            f.write(f"Accuracy: {metric['accuracy']:.4f}\n")
            f.write(f"F1 Score: {metric['f1_score']:.4f}\n")
            f.write(f"MCC: {metric['mcc']:.4f}\n")
            f.write(f"ROC AUC: {metric['roc_auc']:.4f}\n")
            f.write(f"Average Precision: {metric['avg_precision']:.4f}\n")
            f.write(f"CV Mean: {metric['cv_mean']:.4f}\n")
            f.write(f"CV Std: {metric['cv_std']:.4f}\n")
            f.write("\nClassification Report:\n")
            f.write(metric['classification_report'])
            f.write("\nConfusion Matrix:\n")
            f.write(str(metric['confusion_matrix']))
            f.write("\n" + "=" * 50 + "\n")
    
    logger.info(f"Metrics saved to {metrics_file}")
    
    plot_model_comparison(metrics, output_dir)

def save_models(models: Dict[str, Any], scaler: StandardScaler, feature_names: List[str], output_dir: str) -> None:
    """Save trained models and scaler."""
    try:
        os.makedirs(output_dir, exist_ok=True)
        
        for name, model in models.items():
            model_path = os.path.join(output_dir, f"{name}.joblib")
            joblib.dump(model, model_path)
            logger.info(f"Saved model: {model_path}")
        
        scaler_path = os.path.join(output_dir, "scaler.joblib")
        joblib.dump(scaler, scaler_path)
        logger.info(f"Saved scaler: {scaler_path}")
        
        feature_names_path = os.path.join(output_dir, "feature_names.joblib")
        joblib.dump(feature_names, feature_names_path)
        logger.info(f"Saved feature names: {feature_names_path}")
        
    except Exception as e:
        logger.error(f"Error saving models: {str(e)}")
        raise

def main():
    try:
        data_path = "parkinsons.data"
        X, y = load_data(data_path)
        
        output_dir = "model"
        os.makedirs(output_dir, exist_ok=True)
        
        models, scaler, feature_names, metrics = train_models(X, y, output_dir)
        
        save_models(models, scaler, feature_names, output_dir)
        save_metrics(metrics, output_dir)
        
        logger.info("Training completed successfully!")
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()