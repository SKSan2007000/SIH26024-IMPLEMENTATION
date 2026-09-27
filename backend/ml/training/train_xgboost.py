import os
import sys
import pandas as pd
import xgboost as xgb
import joblib
import json
from datetime import datetime, timedelta, timezone
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.db.session import SessionLocal
from app.models.mine import Mine
from app.models.safety_report import SafetyReport
from app.models.mine_risk import MineRisk
from app.models.enums import IncidentSeverity
from ml.features.feature_engineering import get_features
from app.models.ml import MLModelVersion

def extract_training_data(db, days=730):
    """
    Extracts features and targets for ML training.
    """
    print("Extracting training data. This may take a minute...")
    mines = db.query(Mine).all()
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    dataset = []
    
    for mine in mines:
        print(f"Extracting for mine {mine.name}...")
        # Step by 7 days to reduce extraction time and correlation between samples
        for day in range(0, days - 30, 7):
            as_of_date = start_date + timedelta(days=day)
            
            # 1. Get features using the shared module
            features = get_features(db, mine.id, as_of_date)
            
            # 2. Compute target: Critical event in next 30 days
            end_window = as_of_date + timedelta(days=30)
            
            critical_incident = db.query(SafetyReport).filter(
                SafetyReport.mine_id == mine.id,
                SafetyReport.incident_date > as_of_date,
                SafetyReport.incident_date <= end_window,
                SafetyReport.severity == IncidentSeverity.CRITICAL
            ).first()
            
            critical_risk = db.query(MineRisk).filter(
                MineRisk.mine_id == mine.id,
                MineRisk.calculated_at > as_of_date,
                MineRisk.calculated_at <= end_window,
                MineRisk.risk_level == "CRITICAL"
            ).first()
            
            target = 1 if (critical_incident or critical_risk) else 0
            
            row = {
                'mine_id': mine.id,
                'date': as_of_date,
                'target': target
            }
            row.update(features)
            dataset.append(row)
            
    df = pd.DataFrame(dataset)
    # Save dataset to CSV for debugging / cache
    os.makedirs(os.path.join(os.path.dirname(__file__), '../data/datasets'), exist_ok=True)
    df.to_csv(os.path.join(os.path.dirname(__file__), '../data/datasets/synthetic_dataset.csv'), index=False)
    return df

def train_model(db=None):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
        
    df = extract_training_data(db)
    
    if len(df) == 0:
        print("No data available to train.")
        return
        
    print(f"Total samples extracted: {len(df)}")
    print(f"Class balance: {df['target'].value_counts().to_dict()}")
    
    # Chronological Split (Out-of-Time)
    # 730 days total. 
    # Months 1-18 (days 0-540) = Train
    # Months 19-21 (days 540-630) = Val
    # Months 22-24 (days 630-730) = Test
    
    df = df.sort_values('date')
    
    min_date = df['date'].min()
    val_split_date = min_date + timedelta(days=540)
    test_split_date = min_date + timedelta(days=630)
    
    train_df = df[df['date'] < val_split_date]
    val_df = df[(df['date'] >= val_split_date) & (df['date'] < test_split_date)]
    test_df = df[df['date'] >= test_split_date]
    
    print(f"Train size: {len(train_df)}, Val size: {len(val_df)}, Test size: {len(test_df)}")
    
    features_cols = [c for c in df.columns if c not in ['mine_id', 'date', 'target']]
    
    X_train = train_df[features_cols]
    y_train = train_df['target']
    
    X_val = val_df[features_cols]
    y_val = val_df['target']
    
    X_test = test_df[features_cols]
    y_test = test_df['target']
    
    # XGBoost Training
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric='aucpr',
        early_stopping_rounds=10,
        random_state=42
    )
    
    print("Training XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    # Evaluation on Test Set
    preds_proba = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
    
    precision = precision_score(y_test, preds, zero_division=0)
    recall = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_test, preds_proba)
        pr_auc = average_precision_score(y_test, preds_proba)
    except ValueError:
        roc_auc = 0
        pr_auc = 0
        
    cm = confusion_matrix(y_test, preds).tolist()
    
    metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": cm
    }
    
    print("Evaluation Metrics (Test Set):")
    print(json.dumps(metrics, indent=2))
    
    # Save Model
    model_dir = os.path.join(os.path.dirname(__file__), '../models')
    os.makedirs(model_dir, exist_ok=True)
    
    version = f"v{datetime.now().strftime('%Y%m%d%H%M%S')}"
    model_path = os.path.join(model_dir, f"xgboost_{version}.pkl")
    features_path = os.path.join(model_dir, f"features_{version}.json")
    
    joblib.dump(model, model_path)
    with open(features_path, 'w') as f:
        json.dump(features_cols, f)
        
    print(f"Model saved to {model_path}")
    
    # Deactivate old models
    db.query(MLModelVersion).filter(MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK").update({"is_active": False})
    
    # Save model version to DB
    model_version = MLModelVersion(
        model_type="XGBOOST_CRITICAL_RISK",
        version=version,
        training_dataset_version="synthetic_v1",
        feature_count=len(features_cols),
        metrics_json=metrics,
        is_active=True
    )
    db.add(model_version)
    db.commit()
    print("Model registered in database!")
    
    if should_close:
        db.close()
    
if __name__ == "__main__":
    train_model()
