# CoalGuard AI - Risk Engine

## Purpose
The Stage 4 risk engine provides a transparent, deterministic baseline for calculating a coal mine's overall compliance and safety risk. 

**IMPORTANT**: This Stage 4 risk engine is a transparent prototype baseline. It is not a legal/regulatory finding and does not replace official inspection or regulatory decisions.

## Risk Formula
The system uses a **Weighted Sum with a Non-linear Criticality Override**.

### Base Risk (Weighted Sum)
`Base_Risk = (Safety * 0.30) + (Actions * 0.20) + (Inspection * 0.15) + (Recurrence * 0.10) + (Environment * 0.10) + (Documentation * 0.10) + (Historical * 0.05)`

### Criticality Override
To prevent a critical safety failure from being "diluted" by good documentation, the final risk score is bounded by the highest individual critical factor:
`Max_Factor = Max(Safety, Actions, Inspection)`
`Final_Risk = Max(Base_Risk, Max_Factor - 15)`

## Risk Components
1. **Safety Score (0-100)**: Evaluates the severity of incidents within the last 30 days. Critical incidents add 100 points.
2. **Recurrence Score (0-100)**: Detects repeated identical incident types within 30 days. 2 repetitions = 50, 3+ = 100.
3. **Corrective Action Score (0-100)**: Points are added for open actions based on priority, with a +20 penalty for overdue items.
4. **Inspection Score (0-100)**: Based on the highest severity finding from inspections in the last 30 days.
5. **Environment Score (0-100)**: Maps PM2.5 and PM10 to a normalized 0-100 scale (where 100 represents hazardous conditions).
6. **Documentation Score (0-100)**: 50 points per expired document, 20 points per expiring document.
7. **Historical Performance (0-100)**: Moving average of previous risk scores older than 30 days.

## Risk Thresholds
- **0–30**: LOW
- **31–60**: MEDIUM
- **61–80**: HIGH
- **81–100**: CRITICAL

## Limitations
- **Determinism vs. ML**: The current recurrence detection is a basic deterministic string match on incident type. It does not use NLP or ML embeddings yet.
- **Historical Sparsity**: If a mine lacks historical data, its historical score defaults to 0 to prevent artificial score inflation during prototyping.
- **Environment Science**: The PM2.5/PM10 calculation is a simple prototype mapping (not a scientifically validated dispersion model).

## Example Calculation
Mine with one High severity safety incident (50) and one expiring document (20), but no other issues:
- `Base_Risk` = (50 * 0.30) + (20 * 0.10) = 17
- `Max_Factor` = 50
- `Override` = 50 - 15 = 35
- `Final Score` = Max(17, 35) = 35 -> **MEDIUM RISK**
