# Explainable AI (XAI) in CoalGuard

This document details how CoalGuard AI ensures algorithmic transparency using SHAP (SHapley Additive exPlanations).

## Why Explainability is Needed

In the context of Smart Governance and Compliance Monitoring for Coal Mines, an AI black box is unacceptable. Government officials and mine supervisors must understand *why* the AI flagged a specific mine as high risk. Explainability:
1. Builds trust with end-users.
2. Identifies actionable insights (e.g., if "Overdue Corrective Actions" is the primary risk driver, the supervisor knows exactly what to fix).
3. Ensures regulatory compliance for algorithmic transparency.

## What is SHAP?

SHAP is a game-theoretic approach to explain the output of any machine learning model. It connects optimal credit allocation with local explanations using the classic Shapley values from cooperative game theory. 

## How SHAP is Used with XGBoost

We use `shap.TreeExplainer`, which is highly optimized for tree-based models like XGBoost. 
When a prediction is made (e.g., "30-Day Critical Risk Probability is 82%"), the explainer breaks down this prediction into individual feature contributions. It calculates exactly how much each feature shifted the prediction from the "base expected value" (the average prediction across the dataset) to the final 82%.

## Probability vs. SHAP Contribution

> **IMPORTANT**: SHAP contributions are *not* literal probability percentages.

- **Probability**: "There is an 82% chance of a critical event."
- **SHAP Contribution**: "+0.42". This is the log-odds (margin) impact of the feature on the XGBoost tree. 

To avoid confusing users, the frontend UI labels these simply as:
- 🔴 **Increases predicted risk**
- 🟢 **Reduces predicted risk**

## Individual Mine Explanation (Local)

The `/api/ml/explain/{mine_id}` endpoint returns the local explanation for a specific mine at a specific time. 
The API maps raw feature names to human-readable labels and sorts them into:
1. **Top Risk Factors**: Features that pushed the prediction closer to 1 (Critical).
2. **Top Protective Factors**: Features that pushed the prediction closer to 0 (Safe).

## Global Feature Importance

The `/api/ml/explain/model` endpoint returns the global feature importance of the active model. This shows judges and administrators which factors generally influence the model across all mines, derived from the model's native tree weights.

## Limitations

> **CRITICAL LIMITATION**: SHAP explanations describe how model features contributed to a *prediction*. They do not establish causation or prove that a feature caused a safety event.

Additionally, because the current model is trained on **Synthetic Data** (due to the lack of historical SIH data), the SHAP explanations reflect the correlations injected into the synthetic data generation script, not true historical causality.

## Model Versioning

Every SHAP explanation is strictly tied to a `model_version`. If a new XGBoost model is trained, the explainer dynamically loads the new model and its corresponding feature list. Explainability always reflects the exact mathematics used for the actual prediction.
