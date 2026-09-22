import os
import sys
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import json
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.db.session import SessionLocal
from app.models.ml import MLModelVersion

def train_isolation_forest(db=None):
    """
    Trains an Isolation Forest model using the generated synthetic CSV data.
    """
    csv_path = os.path.join(os.path.dirname(__file__), '../data/datasets/synthetic_dataset.csv')
    if not os.path.exists(csv_path):
        print("No synthetic dataset found. Please run train_xgboost.py first to generate it.")
        return
        
    df = pd.read_csv(csv_path)
    
    features_cols = [c for c in df.columns if c not in ['mine_id', 'date', 'target']]
    
    X = df[features_cols]
    
    print(f"Training Isolation Forest on {len(X)} samples with {len(features_cols)} features...")
    
    model = IsolationForest(
        n_estimators=100,
        contamination=0.05, # Expecting 5% anomalies
        random_state=42
    )
    
    model.fit(X)
    
    # Save Model
    model_dir = os.path.join(os.path.dirname(__file__), '../models')
    os.makedirs(model_dir, exist_ok=True)
    
    version = f"v{datetime.now().strftime('%Y%m%d%H%M%S')}"
    model_path = os.path.join(model_dir, f"isolation_forest_{version}.pkl")
    features_path = os.path.join(model_dir, f"if_features_{version}.json")
    
    joblib.dump(model, model_path)
    with open(features_path, 'w') as f:
        json.dump(features_cols, f)
        
    print(f"Isolation Forest saved to {model_path}")
    
    # Deactivate old models
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
        
    db.query(MLModelVersion).filter(MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY").update({"is_active": False})
    
    # Save model version to DB
    model_version = MLModelVersion(
        model_type="ISOLATION_FOREST_ANOMALY",
        version=version,
        training_dataset_version="synthetic_v1",
        feature_count=len(features_cols),
        metrics_json={"contamination": 0.05, "n_estimators": 100},
        is_active=True
    )
    db.add(model_version)
    db.commit()
    print("Isolation Forest registered in database!")
    
    if should_close:
        db.close()

if __name__ == "__main__":
    train_isolation_forest()
