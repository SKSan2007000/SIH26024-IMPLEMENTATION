import os
import sys
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import IsolationForest
import joblib
import json
from datetime import datetime, timedelta, timezone
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.db.session import SessionLocal
from app.models.mine import Mine
from app.models.ml import MLModelVersion

def generate_synthetic_training_data(n_samples=2500):
    """
    Generates a documented, realistic synthetic dataset for mine risk modeling.
    Label: 'Synthetic prototype benchmark — not government validation.'
    """
    print(f"Generating synthetic training dataset ({n_samples} historical cases)...")
    np.random.seed(42)

    safety_incidents_30d = np.random.poisson(lam=1.8, size=n_samples)
    critical_incidents_30d = np.random.binomial(n=safety_incidents_30d, p=0.35)
    safety_incidents_7d = np.random.binomial(n=safety_incidents_30d, p=0.30)
    high_severity_incidents_30d = np.random.binomial(n=safety_incidents_30d, p=0.55)

    pm10_avg_30d = np.random.normal(loc=95.0, scale=35.0, size=n_samples)
    pm10_avg_30d = np.clip(pm10_avg_30d, 20.0, 300.0)
    pm10_trend = np.random.normal(loc=2.0, scale=15.0, size=n_samples)
    pm10_avg_7d = pm10_avg_30d + pm10_trend

    open_actions = np.random.poisson(lam=3.5, size=n_samples)
    overdue_actions = np.random.binomial(n=open_actions, p=0.30)
    critical_open_actions = np.random.binomial(n=open_actions, p=0.25)

    current_baseline_risk = (
        (critical_incidents_30d * 20.0) +
        (overdue_actions * 12.0) +
        (critical_open_actions * 15.0) +
        ((pm10_avg_30d - 50.0) * 0.25) +
        np.random.normal(loc=25.0, scale=8.0, size=n_samples)
    )
    current_baseline_risk = np.clip(current_baseline_risk, 5.0, 98.0)
    risk_7d_change = np.random.normal(loc=1.0, scale=8.0, size=n_samples)

    # Ground truth: Critical compliance event in next 30 days
    risk_logit = (
        (critical_incidents_30d * 0.95) +
        (overdue_actions * 0.65) +
        (critical_open_actions * 0.85) +
        ((pm10_avg_30d - 100.0) * 0.02) +
        (risk_7d_change * 0.08) +
        ((current_baseline_risk - 50.0) * 0.05) - 1.8
    )
    prob_target = 1.0 / (1.0 + np.exp(-risk_logit))
    target = (np.random.uniform(0, 1, size=n_samples) < prob_target).astype(int)

    dates = [datetime.now(timezone.utc) - timedelta(days=int(d)) for d in np.random.uniform(30, 700, size=n_samples)]

    df = pd.DataFrame({
        'date': dates,
        'safety_incidents_30d': safety_incidents_30d,
        'safety_incidents_7d': safety_incidents_7d,
        'critical_incidents_30d': critical_incidents_30d,
        'high_severity_incidents_30d': high_severity_incidents_30d,
        'pm10_avg_30d': pm10_avg_30d,
        'pm10_avg_7d': pm10_avg_7d,
        'pm10_trend': pm10_trend,
        'open_actions': open_actions,
        'overdue_actions': overdue_actions,
        'critical_open_actions': critical_open_actions,
        'current_baseline_risk': current_baseline_risk,
        'risk_7d_change': risk_7d_change,
        'target': target
    })

    data_dir = os.path.join(os.path.dirname(__file__), 'data/datasets')
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, 'synthetic_dataset.csv')
    df.to_csv(csv_path, index=False)
    print(f"Saved dataset to {csv_path} (Shape: {df.shape}, Critical Cases: {target.sum()}/{len(target)})")
    return df

def train_all_models():
    print("=" * 60)
    print("TRAINING COALGUARD AI ML MODELS (XGBoost + Isolation Forest)")
    print("Label: Synthetic prototype benchmark — not government validation.")
    print("=" * 60)

    db = SessionLocal()
    try:
        df = generate_synthetic_training_data()
        feature_cols = [c for c in df.columns if c not in ['date', 'target']]

        # 1. Train XGBoost
        split_idx = int(len(df) * 0.8)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]

        X_train, y_train = train_df[feature_cols], train_df['target']
        X_test, y_test = test_df[feature_cols], test_df['target']

        xgb_model = xgb.XGBClassifier(
            objective='binary:logistic',
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            random_state=42
        )
        xgb_model.fit(X_train, y_train)

        preds = xgb_model.predict(X_test)
        preds_proba = xgb_model.predict_proba(X_test)[:, 1]

        precision = precision_score(y_test, preds, zero_division=0)
        recall = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        roc_auc = roc_auc_score(y_test, preds_proba)
        pr_auc = average_precision_score(y_test, preds_proba)

        metrics = {
            "precision": float(round(precision, 4)),
            "recall": float(round(recall, 4)),
            "f1_score": float(round(f1, 4)),
            "roc_auc": float(round(roc_auc, 4)),
            "pr_auc": float(round(pr_auc, 4)),
            "benchmark_label": "Synthetic prototype benchmark — not government validation."
        }

        print("XGBoost Evaluation Metrics:")
        print(json.dumps(metrics, indent=2))

        # Save XGBoost
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)
        version = f"v{datetime.now().strftime('%Y%m%d%H%M%S')}"

        xgb_model_path = os.path.join(model_dir, f"xgboost_{version}.pkl")
        xgb_feat_path = os.path.join(model_dir, f"features_{version}.json")
        joblib.dump(xgb_model, xgb_model_path)
        with open(xgb_feat_path, 'w') as f:
            json.dump(feature_cols, f)

        db.query(MLModelVersion).filter(MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK").update({"is_active": False})
        mv_xgb = MLModelVersion(
            model_type="XGBOOST_CRITICAL_RISK",
            version=version,
            training_dataset_version="synthetic_v2",
            feature_count=len(feature_cols),
            metrics_json=metrics,
            is_active=True
        )
        db.add(mv_xgb)

        # 2. Train Isolation Forest
        if_model = IsolationForest(
            n_estimators=100,
            contamination=0.06,
            random_state=42
        )
        if_model.fit(df[feature_cols])

        if_model_path = os.path.join(model_dir, f"isolation_forest_{version}.pkl")
        if_feat_path = os.path.join(model_dir, f"if_features_{version}.json")
        joblib.dump(if_model, if_model_path)
        with open(if_feat_path, 'w') as f:
            json.dump(feature_cols, f)

        db.query(MLModelVersion).filter(MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY").update({"is_active": False})
        mv_if = MLModelVersion(
            model_type="ISOLATION_FOREST_ANOMALY",
            version=version,
            training_dataset_version="synthetic_v2",
            feature_count=len(feature_cols),
            metrics_json={"contamination": 0.06, "n_estimators": 100},
            is_active=True
        )
        db.add(mv_if)

        db.commit()
        print("\nAll ML models successfully trained and activated in database!")
    finally:
        db.close()

if __name__ == "__main__":
    train_all_models()
