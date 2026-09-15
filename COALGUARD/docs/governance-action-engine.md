# CoalGuard AI - Governance Action Engine (Stage 7)

## Overview
The Governance Action Engine bridges the gap between AI intelligence and real-world operational compliance. While Stage 4, 5, and 6 identify current risks, predict future risks, and explain the causes respectively, Stage 7 translates those insights into **human-in-the-loop, accountable actions**.

## Core Workflow (Closed-Loop)
1. **AI Triggers (Intelligence Triad)**
   - **Baseline Risk** reaching HIGH or CRITICAL.
   - **XGBoost Prediction** forecasting CRITICAL risk within 30 days.
   - **Isolation Forest** detecting a HIGH_ANOMALY.
   - **SHAP Explanation** identifying specific driving factors (e.g., Open Critical Actions).
   
2. **Recommendation Engine**
   - The `GovernanceService` evaluates intelligence and generates `GovernanceRecommendation` entities.
   - It performs deduplication to avoid flooding officers with duplicate alerts for the same underlying issue.
   - Recommendations are assigned a `priority` (LOW, MEDIUM, HIGH, CRITICAL).

3. **Human Review & Action (Governance Action Center)**
   - Officers review recommendations in the Action Center.
   - They can **Accept** (which converts the recommendation into a `CorrectiveAction` assigned to a user) or **Reject** (which requires a written justification).
   - Once accepted, the issue is tracked as an active Action.

4. **Execution & Escalation**
   - Actions have strict deadlines.
   - The `process_escalations` cron (or demo endpoint) continuously monitors open actions.
   - If an action is 1 day overdue, it becomes `OVERDUE`.
   - At 3 days overdue, it escalates to `Level 1`.
   - At 7 days overdue, it escalates to `Level 2`.

5. **Resolution & AI Recalculation (The Loop Closes)**
   - Once an action is executed in the physical mine, it is marked `COMPLETED` and `VERIFIED`.
   - Completion of the action automatically triggers the `RiskService` and `MLService` to recalculate the mine's risk.
   - If the action truly addressed the root cause, the risk decreases in the UI in near real-time, validating the governance loop.

## Auditability
Every state transition (Creation, Acceptance, Rejection, Escalation, Completion) is immutably recorded in the `AuditLog` table. This provides a clear compliance trail for government regulators.

## API Endpoints
- `GET /api/governance/recommendations/{mine_id}`: Fetch AI recommendations
- `POST /api/governance/recommendations/{id}/accept`: Accept and create action
- `POST /api/governance/recommendations/{id}/reject`: Reject with reason
- `GET /api/governance/actions/{mine_id}`: List active actions
- `PUT /api/governance/actions/{id}/status`: Update action status
- `POST /api/governance/demo/escalate`: Fast-forward time for demo escalation
