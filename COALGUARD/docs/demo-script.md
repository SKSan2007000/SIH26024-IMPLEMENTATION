# CoalGuard AI — SIH 2026 Jury Presentation & Demonstration Script

## Problem Statement: SIH26024
**AI-Based Smart Governance and Compliance Monitoring System for Coal Mines**

---

## 👥 Demo Personas & Credentials

| Role | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| **Head Admin** | `admin@coalguard.ai` | `Admin@123` | Multi-Mine Portfolio Oversight & Calibration |
| **Mine Manager** | `manager@coalguard.ai` | `Manager@123` | Tactical Risk Management & What-If Simulation |
| **Supervisor** | `supervisor@coalguard.ai` | `Supervisor@123` | Evidence Verification & Closed-Loop Sign-Off |
| **Field Officer** | `field@coalguard.ai` | `Field@123` | Mobile Geotagged Evidence Submission |
| **Safety Officer** | `safety@coalguard.ai` | `Safety@123` | DGMS Hazard Auditing & Incident Conversion |
| **Environmental Officer** | `environment@coalguard.ai` | `Environment@123` | Live PM10/Water Telemetry & Sensor Oversight |
| **Auditor / DGMS** | `auditor@coalguard.ai` | `Auditor@123` | Regulatory Inspection & Immutable Audit Trail |

---

## 🎬 8-Step Live Jury Demonstration Flow

### Step 1: Executive Portfolio Command Center (2 mins)
1. Navigate to `http://localhost:5173` and log in as `admin@coalguard.ai` (`Admin@123`).
2. **Key highlights**:
   - Portfolio risk distribution across SECL canonical mines (Gevra, Kusmunda, Dipka, Manikpur, Korba).
   - Real-time SLA breach countdowns and high-priority decision counters.
   - Interactive Mine Cards showing continuous risk index $(0-100)$ categorized strictly into `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.
3. Click on **Command Center** from the navbar to demonstrate the geospatial GIS intelligence map and telemetry integration.

---

### Step 2: 3D Digital Twin & Sensor Telemetry (1.5 mins)
1. Open **3D Digital Twins** (`/mines`) and select **Gevra Open Cast Mine** (`/mines/:id`).
2. Interact with the **3D Mine Twin**:
   - Orbit, pan, and switch between camera presets (*Top-Down*, *Pit Focus*, *Plant Focus*).
   - Inspect dust plume overlay and dynamic operational zones (*North Pit*, *Overburden Dump Alpha*, *Coal Handling Plant*).
   - Click on an active IoT Sensor node on the 3D terrain to view real-time time-series telemetry charts with WARN/CRITICAL reference lines.

---

### Step 3: IoT Anomaly & ML Early Warning Triad (1.5 mins)
1. Navigate to **IoT Telemetry Spike** (`/iot-control`).
2. Expand the **Demo IoT Scenarios** panel on the bottom-right and trigger `PM10_SPIKE`.
3. Observe:
   - Instant threshold breach ($>180\ \mu\text{g/m}^3$) exceeding DGMS statutory limit.
   - Real-time ingestion into the multi-department data fusion layer.
   - Automatic execution of the **XGBoost Early Warning Risk Predictor** and **Isolation Forest Unsupervised Anomaly Detector**.
   - Generation of SHAP local explanations breaking down exact factor contributions.

---

### Step 4: Algorithmic Priority Decision Queue (1 min)
1. Navigate to **⚡ Priority Queue** (`/priority-queue`).
2. Notice how the algorithmic triage engine automatically promoted the newly breached hazard to the top with an urgency score of $95+$.
3. Click **Accept Recommendation** to convert the ML prescriptive insight into a binding statutory Corrective Action.

---

### Step 5: Mobile Field Officer Geotagged Evidence (1.5 mins)
1. Switch persona or navigate to **Field Evidence** (`/field-officer`).
2. Select the assigned corrective action.
3. Demonstrate mobile-ready evidence capture:
   - Live browser GPS geolocation capture (latitude, longitude, accuracy).
   - Upload photographic proof of misting cannon activation / dust suppression.
   - Click **Submit Field Evidence** $\to$ triggers the AI visual quality & relevance analysis.
   - Click **Submit for Supervisor Sign-Off** $\to$ transitions status to `IN_REVIEW`.

---

### Step 6: Supervisor Verification & Closed-Loop Risk Recalculation (1.5 mins)
1. Navigate to **Supervisor Sign-Off** (`/supervisor-review`).
2. Select the action under review:
   - Inspect the geotagged photo, timestamp, and AI image analysis confidence score ($92\%$).
   - Review pre-calculated risk reduction estimate ($\Delta\text{Risk} = -14.2$).
3. Click **Sign Off & Verify Resolution**:
   - Action transitions to `VERIFIED`.
   - Dynamic Closed-Loop Risk Engine executes: saves `risk_before`, `risk_after`, and `risk_delta`.
   - System awards **+25 Verified Governance Points** to the officer.
   - Emits an immutable `TimelineEvent` and `AuditLog` entry.

---

### Step 7: Verified Governance Score Ledger (1 min)
1. Navigate to **Governance Score** (`/governance-score`).
2. Point out the verified tamper-proof ledger:
   - Weighted score calculation ($1000$-point scale) combining Safety, Environment, Contractor, and Action SLA compliance.
   - Live Officer Leaderboard reflecting newly earned governance points.
   - Auditable point transaction logs with cryptographic timestamps.

---

### Step 8: What-If Simulator & Regulatory Audit Trail (1.5 mins)
1. Navigate to **What-If Simulator** (`/what-if`):
   - Adjust operational parameters (e.g. increase daily water misting cycles, resolve 5 overdue actions).
   - Click **Simulate Operational Intervention** $\to$ observe non-destructive risk delta estimation.
2. Navigate to **Immutable Audit Log** (`/audit-trail`):
   - Filter chronological regulatory event log.
   - Demonstrate one-click **Export Regulatory CSV** for DGMS/CIL auditors.
