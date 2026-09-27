import os
import json
import joblib
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.ml import MLModelVersion, Prediction, AnomalyResult
from app.models.mine_risk import MineRisk
from ml.features.feature_engineering import get_features
from ml.explainability.shap_explainer import explain_prediction, explain_global_model

class MLService:
    _model_cache = {}

    @staticmethod
    def _load_model(db: Session, model_type: str):
        active_version = db.query(MLModelVersion).filter(
            MLModelVersion.model_type == model_type,
            MLModelVersion.is_active == True
        ).first()
        
        if not active_version:
            raise ValueError(f"No active model found for {model_type}")
            
        cache_key = f"{model_type}_{active_version.version}"
        if cache_key in MLService._model_cache:
            return active_version, MLService._model_cache[cache_key]["model"], MLService._model_cache[cache_key]["features"]
            
        model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ml/models'))
        
        if model_type == "XGBOOST_CRITICAL_RISK":
            model_path = os.path.join(model_dir, f"xgboost_{active_version.version}.pkl")
            feat_path = os.path.join(model_dir, f"features_{active_version.version}.json")
        else:
            model_path = os.path.join(model_dir, f"isolation_forest_{active_version.version}.pkl")
            feat_path = os.path.join(model_dir, f"if_features_{active_version.version}.json")
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file missing: {model_path}")
            
        model = joblib.load(model_path)
        with open(feat_path, 'r') as f:
            features_list = json.load(f)
            
        MLService._model_cache[cache_key] = {"model": model, "features": features_list}
            
        return active_version, model, features_list

    @staticmethod
    def predict_critical_risk(db: Session, mine_id: str):
        version, model, features_list = MLService._load_model(db, "XGBOOST_CRITICAL_RISK")
        
        raw_features = get_features(db, mine_id, datetime.now(timezone.utc))
        
        # Ensure correct order and completeness
        feature_dict = {f: raw_features.get(f, 0.0) for f in features_list}
        df = pd.DataFrame([feature_dict])
        
        prob = float(model.predict_proba(df)[0][1])
        
        # Map probability to simple categories
        p_class = "LOW"
        if prob > 0.8: p_class = "CRITICAL"
        elif prob > 0.6: p_class = "HIGH"
        elif prob > 0.3: p_class = "MEDIUM"
        
        # Determine basic feature importance for UI
        # In XGBoost, feature importances are accessible
        importances = model.feature_importances_
        imp_dict = {features_list[i]: float(importances[i]) for i in range(len(features_list))}
        top_factors = sorted(imp_dict.items(), key=lambda x: x[1], reverse=True)[:5]
        
        prediction = Prediction(
            mine_id=mine_id,
            model_version_id=version.id,
            critical_probability=prob,
            prediction_class=p_class,
            prediction_horizon_days=30,
            top_risk_factors=dict(top_factors)
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        return prediction

    @staticmethod
    def detect_anomaly(db: Session, mine_id: str):
        version, model, features_list = MLService._load_model(db, "ISOLATION_FOREST_ANOMALY")
        
        raw_features = get_features(db, mine_id, datetime.now(timezone.utc))
        feature_dict = {f: raw_features.get(f, 0.0) for f in features_list}
        df = pd.DataFrame([feature_dict])
        
        # IsoForest returns -1 for anomaly, 1 for normal
        pred = model.predict(df)[0]
        # Score is negative for anomalies, positive for normal
        score = float(model.decision_function(df)[0])
        
        is_anomaly = bool(pred == -1)
        
        severity = "NORMAL"
        if is_anomaly:
            if score < -0.1:
                severity = "HIGH_ANOMALY"
            else:
                severity = "UNUSUAL"
                
        anomaly = AnomalyResult(
            mine_id=mine_id,
            model_version_id=version.id,
            anomaly_score=score,
            is_anomaly=is_anomaly,
            anomaly_severity=severity
        )
        db.add(anomaly)
        db.commit()
        db.refresh(anomaly)
        
        return anomaly

    @staticmethod
    def explain_mine_prediction(db: Session, mine_id: str):
        try:
            version, model, features_list = MLService._load_model(db, "XGBOOST_CRITICAL_RISK")
        except ValueError:
            return {
                "mine_id": mine_id,
                "model_version": "none",
                "prediction_probability": 0.0,
                "prediction_percent": 0,
                "prediction_class": "LOW",
                "top_risk_factors": [],
                "top_protective_factors": [],
                "all_feature_contributions": [],
                "error": "No active model found",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        # Ensure we have a prediction to explain
        prediction = db.query(Prediction).filter(Prediction.mine_id == mine_id).order_by(Prediction.created_at.desc()).first()
        
        # Verify prediction is for the current active model
        if not prediction or prediction.model_version_id != version.id:
            # If out of date or missing, recalculate
            try:
                prediction = MLService.predict_critical_risk(db, mine_id)
            except Exception:
                pass
            
        raw_features = get_features(db, mine_id, datetime.now(timezone.utc))
        
        # Generate SHAP explanation
        try:
            explanation = explain_prediction(model, features_list, raw_features)
        except Exception as e:
            # Fallback if SHAP fails, return empty explanation but not a 500 crash
            explanation = {
                "top_risk_factors": [],
                "top_protective_factors": [],
                "all_feature_contributions": [],
                "error": str(e)
            }
            
        return {
            "mine_id": mine_id,
            "model_version": version.version,
            "prediction_probability": prediction.critical_probability,
            "prediction_percent": int(prediction.critical_probability * 100),
            "prediction_class": prediction.prediction_class,
            **explanation,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def explain_global_model(db: Session):
        version, model, features_list = MLService._load_model(db, "XGBOOST_CRITICAL_RISK")
        
        try:
            explanation = explain_global_model(model, features_list)
        except Exception as e:
            explanation = {
                "global_feature_importance": [],
                "error": str(e)
            }
            
        # Get count of predictions made with this model
        samples_explained = db.query(Prediction).filter(Prediction.model_version_id == version.id).count()
        
        return {
            "model_version": version.version,
            "samples_explained": samples_explained,
            **explanation,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    @staticmethod
    def get_intelligence_triad(db: Session, mine_id: str):
        # 1. Current Baseline
        baseline = db.query(MineRisk).filter(MineRisk.mine_id == mine_id).order_by(MineRisk.calculated_at.desc()).first()
        
        # 2. Future Prediction (Get latest or calculate)
        prediction = db.query(Prediction).filter(Prediction.mine_id == mine_id).order_by(Prediction.created_at.desc()).first()
        if not prediction:
            try:
                prediction = MLService.predict_critical_risk(db, mine_id)
            except Exception as e:
                prediction = None
                
        # 3. Anomaly
        anomaly = db.query(AnomalyResult).filter(AnomalyResult.mine_id == mine_id).order_by(AnomalyResult.created_at.desc()).first()
        if not anomaly:
            try:
                anomaly = MLService.detect_anomaly(db, mine_id)
            except Exception:
                anomaly = None
                
        return {
            "baseline": {
                "score": baseline.overall_risk_score if baseline else 0.0,
                "level": baseline.risk_level if baseline else "LOW",
                "calculated_at": baseline.calculated_at if baseline else None
            },
            "prediction": {
                "probability": prediction.critical_probability if prediction else 0.0,
                "probability_percent": int((prediction.critical_probability * 100)) if prediction else 0,
                "level": prediction.prediction_class if prediction else "LOW",
                "horizon_days": prediction.prediction_horizon_days if prediction else 30,
                "top_factors": prediction.top_risk_factors if prediction else {},
                "explanation_available": prediction is not None
            },
            "anomaly": {
                "score": anomaly.anomaly_score if anomaly else 0.0,
                "is_anomaly": anomaly.is_anomaly if anomaly else False,
                "severity": anomaly.anomaly_severity if anomaly else "NORMAL"
            }
        }
