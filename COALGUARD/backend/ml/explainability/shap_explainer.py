import shap
import pandas as pd
from typing import Dict, List, Any
import joblib

def get_human_readable_label(feature_name: str) -> str:
    """Converts technical feature names into readable labels."""
    mapping = {
        "safety_incidents_30d": "Safety Incidents in Last 30 Days",
        "safety_incidents_7d": "Safety Incidents in Last 7 Days",
        "critical_incidents_30d": "Critical Incidents in Last 30 Days",
        "high_severity_incidents_30d": "High Severity Incidents in Last 30 Days",
        "pm10_avg_30d": "Average PM10 in Last 30 Days",
        "pm10_avg_7d": "Average PM10 in Last 7 Days",
        "pm10_trend": "PM10 Trend",
        "open_actions": "Open Corrective Actions",
        "overdue_actions": "Overdue Corrective Actions",
        "critical_open_actions": "Critical Open Corrective Actions",
        "current_baseline_risk": "Current Baseline Risk",
        "risk_7d_change": "7-Day Risk Change"
    }
    return mapping.get(feature_name, feature_name.replace("_", " ").title())

def explain_prediction(model: Any, features_list: List[str], feature_vector: Dict[str, float]) -> Dict[str, Any]:
    """
    Generates SHAP explanations for a single mine's feature vector.
    """
    # 1. Validate feature alignment
    for f in features_list:
        if f not in feature_vector:
            raise ValueError(f"Feature mismatch: Missing required feature '{f}' for explanation.")
            
    # Prepare DataFrame matching exact model training order
    df = pd.DataFrame([{f: feature_vector[f] for f in features_list}])
    
    # 2. Initialize SHAP Explainer
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(df)
    
    # Handle SHAP output shape depending on binary vs multiclass/XGBoost version
    # XGBoost binary classification usually returns shape (1, num_features)
    if isinstance(shap_values, list):
        # some versions return list of arrays [class_0, class_1]
        local_shap = shap_values[1][0]
    elif len(shap_values.shape) == 3:
        # shape (1, num_features, num_classes)
        local_shap = shap_values[0, :, 1]
    else:
        # shape (1, num_features)
        local_shap = shap_values[0]
        
    # 3. Process contributions
    contributions = []
    for i, feature_name in enumerate(features_list):
        s_val = float(local_shap[i])
        f_val = float(df.iloc[0][feature_name])
        
        # Positive SHAP pushes risk higher (closer to 1), Negative pushes risk lower (closer to 0)
        if s_val > 0:
            direction = "INCREASES_RISK"
        elif s_val < 0:
            direction = "REDUCES_RISK"
        else:
            direction = "NO_IMPACT"
            
        contributions.append({
            "feature_name": feature_name,
            "feature_value": f_val,
            "shap_value": s_val,
            "impact_direction": direction,
            "label": get_human_readable_label(feature_name)
        })
        
    # 4. Sort contributors by absolute magnitude
    contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    
    top_risk_factors = [c for c in contributions if c["impact_direction"] == "INCREASES_RISK"]
    top_protective_factors = [c for c in contributions if c["impact_direction"] == "REDUCES_RISK"]
    
    return {
        "all_feature_contributions": contributions,
        "top_risk_factors": top_risk_factors,
        "top_protective_factors": top_protective_factors
    }

def explain_global_model(model: Any, features_list: List[str]) -> Dict[str, Any]:
    """
    Returns global feature importance directly from the XGBoost model 
    (since calculating global SHAP on a huge dataset dynamically might be slow).
    Alternatively, using native feature importances is highly correlated.
    """
    importances = model.feature_importances_
    
    ranked_features = []
    for i, fname in enumerate(features_list):
        ranked_features.append({
            "feature_name": fname,
            "importance": float(importances[i]),
            "label": get_human_readable_label(fname)
        })
        
    # Sort descending
    ranked_features.sort(key=lambda x: x["importance"], reverse=True)
    
    return {
        "global_feature_importance": ranked_features,
        "note": "Global importance derived from model's native tree weights."
    }
