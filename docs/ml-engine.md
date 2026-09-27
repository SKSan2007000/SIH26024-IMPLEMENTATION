# Stage 5: Predictive ML Engine (CoalGuard AI)

This document details the architecture and mechanisms of the CoalGuard AI Machine Learning Engine, focusing on early-warning predictions and anomaly detection.

## ML Objective

The system shifts CoalGuard from a deterministic "current risk" tracker to an intelligence platform capable of predicting future risk. The core objective is predictive governance—giving authorities an early warning signal before an accident occurs.

## Prediction Target

The XGBoost model predicts `critical_event_next_30d`.
This target is **binary** (0 or 1).
- **1** means the mine will experience a CRITICAL safety incident OR transition to a CRITICAL baseline risk within the following 30 days.
- **0** means neither of these events will occur in that timeframe.

The output is presented as the **30-Day Critical Risk Probability** ($0.0 - 1.0$).

## Features

The model uses a fixed-length feature vector derived entirely from the relational operational tables:
- `safety_incidents_30d`, `safety_incidents_7d`, `critical_incidents_30d`, `high_severity_incidents_30d`
- `pm10_avg_30d`, `pm10_avg_7d`, `pm10_trend`
- `open_actions`, `overdue_actions`, `critical_open_actions`
- `current_baseline_risk`, `risk_7d_change`

## Synthetic Data Strategy

> **NOTE:** Model development currently uses synthetic development data because sufficient historical operational mine data is not available.

The `ml/data/generate_ml_data.py` script deterministically simulates 2 years of daily operations for multiple mines, purposefully injecting causal patterns (e.g., higher PM10 leading to accidents) to give the models mathematical correlations to learn.

## Time-Based Split

To prevent "future data leakage" during training, the XGBoost script uses an Out-of-Time split instead of a standard random split:
- **Months 1-18**: Training Data
- **Months 19-21**: Validation Data
- **Months 22-24**: Final Test Data

## Algorithms Used

1. **XGBoost Classifier (`binary:logistic`)**: Used for the primary 30-Day Critical Risk Probability. It handles the non-linear interactions of our feature set extremely well.
2. **Isolation Forest**: Used for unsupervised anomaly detection. It analyzes the exact same feature vector to detect statistical behavioral deviations that might not cleanly fit into a known risk bucket.

## Evaluation Metrics

Because critical events are inherently rare (a class imbalance), accuracy is a flawed metric. The system prioritizes:
- **Recall (Sensitivity)**: Crucial for an early warning system to minimize False Negatives (missing a real disaster).
- **PR-AUC (Precision-Recall Area Under Curve)**: Accurately represents model performance on imbalanced data.

## Model Versioning

Trained models are versioned and stored in `ml/models/*.pkl`, with their exact feature list in `*.json`. The `ml_model_versions` database table tracks which model is currently active, alongside its testing metrics.

## Difference Between Baseline and Prediction

- **Baseline Risk** (Stage 4) relies on strict legal rules and formulas. If a mine is HIGH risk, it is because it is *currently* breaking rules.
- **Predicted Risk** (Stage 5) relies on statistical correlations. A mine could have a perfectly compliant baseline, but an 85% probability of a critical incident because its operational velocity matches historical disaster trends.
