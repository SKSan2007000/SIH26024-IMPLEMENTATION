# Command Center (Stage 8)

The Command Center is the unified dashboard for CoalGuard AI, presenting the entire lifecycle from raw data processing to predictive analytics and finally to automated governance.

## Architecture

The architecture aggregates information from Stages 4–7 into a single, cohesive view:

1. **Backend Aggregation**:
   The `/api/command-center/*` endpoints collect data from `MLService`, `RiskService`, and `GovernanceService` without duplicating any calculations. The frontend receives a comprehensive JSON payload.

2. **Frontend UI (`CommandCenter.tsx`)**:
   - **Overview**: Displays total mines, critical predictions, anomalies, and active actions.
   - **Prioritization**: Mines are sorted based on immediate regulatory concern (CRITICAL baseline > HIGH prediction > HIGH anomaly > Open actions).
   - **Mine Intelligence**: Shows the "Intelligence Triad" (Baseline + Prediction + Anomaly) and explains predictions using SHAP. It allows for one-click acceptance of governance actions.
   - **Timeline**: Uses the system AuditLog to render a transparent, sequential history of AI-to-Human handoffs.

## Live Demo Resilience

SIH demonstrations require stability. The Command Center introduces:
- **System Health Panel**: Confirms Database, Backend, ML, and Governance modules are online.
- **Graceful Failures**: If ML models are missing, the UI downgrades gracefully (displaying "Predictive AI Unavailable") rather than returning 500 server errors.
- **Demo Reset Endpoint**: `POST /api/demo/reset` safely wipes volatile demo state (actions, recommendations, predictions) and recalculates baseline scores from original seed data, restoring a pristine "Golden Path" state in under a second.

## Golden Path Flow
The standard SIH demo proceeds as follows:
1. View the Command Center Overview.
2. Select a Critical mine.
3. Review AI Triad (Risk, XGBoost, Isolation Forest).
4. Review SHAP Explainability.
5. Accept the AI-generated Governance Recommendation.
6. Complete the created Corrective Action.
7. Observe immediate mathematical recalculation in the UI.
8. Review the final Audit Trail.
