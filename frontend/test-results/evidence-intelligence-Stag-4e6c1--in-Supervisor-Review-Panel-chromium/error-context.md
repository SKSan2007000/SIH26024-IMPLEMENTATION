# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-intelligence.spec.ts >> Stage 10H: Evidence Intelligence Integration >> Analyze Evidence in Supervisor Review Panel
- Location: tests\evidence-intelligence.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Supervisor Review') to be visible

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]:
        - link "CG COALGUARD AI Smart Mine Governance" [ref=f1e7] [cursor=pointer]:
          - /url: /
          - generic [ref=f1e8]: CG
          - generic [ref=f1e9]:
            - generic [ref=f1e10]:
              - generic [ref=f1e11]: COALGUARD
              - generic [ref=f1e12]: AI
            - generic [ref=f1e13]: Smart Mine Governance
        - navigation [ref=f1e14]:
          - link "Portfolio" [ref=f1e15] [cursor=pointer]:
            - /url: /
          - link "Command Center" [ref=f1e16] [cursor=pointer]:
            - /url: /command-center
          - link "3D Digital Twins" [ref=f1e17] [cursor=pointer]:
            - /url: /mines
          - link "⚡ Priority Queue" [ref=f1e18] [cursor=pointer]:
            - /url: /priority-queue
          - link "Closed-Loop Hub" [ref=f1e19] [cursor=pointer]:
            - /url: /actions
      - generic [ref=f1e20]:
        - link "📢 Report Hazard (Public)" [ref=f1e21] [cursor=pointer]:
          - /url: /public-report
          - generic [ref=f1e22]: 📢
          - generic [ref=f1e23]: Report Hazard (Public)
        - generic [ref=f1e24]:
          - generic [ref=f1e25]:
            - generic [ref=f1e26]: D
            - generic [ref=f1e27]: Dr. Rajeshwar Sharma (Head Admin)Admin
          - button "Logout" [ref=f1e28]
    - generic [ref=f1e29]:
      - generic [ref=f1e30]:
        - generic [ref=f1e31]: "AI Triad:"
        - link "Risk Engine" [ref=f1e32] [cursor=pointer]:
          - /url: /risk
        - generic [ref=f1e33]: •
        - link "What-If Simulator" [ref=f1e34] [cursor=pointer]:
          - /url: /what-if
        - generic [ref=f1e35]: •
        - link "Priority Queue" [ref=f1e36] [cursor=pointer]:
          - /url: /priority-queue
      - generic [ref=f1e37]: "|"
      - generic [ref=f1e38]:
        - generic [ref=f1e39]: "Operations:"
        - link "Daily Tasks (+10pts)" [ref=f1e40] [cursor=pointer]:
          - /url: /daily-reporting
        - generic [ref=f1e41]: •
        - link "Safety" [ref=f1e42] [cursor=pointer]:
          - /url: /safety
        - generic [ref=f1e43]: •
        - link "Environment" [ref=f1e44] [cursor=pointer]:
          - /url: /environment
        - generic [ref=f1e45]: •
        - link "Contractors" [ref=f1e46] [cursor=pointer]:
          - /url: /contractors
        - generic [ref=f1e47]: •
        - link "DGMS Audits" [ref=f1e48] [cursor=pointer]:
          - /url: /inspections
        - generic [ref=f1e49]: •
        - link "Compliance Vault" [ref=f1e50] [cursor=pointer]:
          - /url: /compliance
        - generic [ref=f1e51]: •
        - link "Incidents" [ref=f1e52] [cursor=pointer]:
          - /url: /incidents
      - generic [ref=f1e53]: "|"
      - generic [ref=f1e54]:
        - generic [ref=f1e55]: "Closed-Loop:"
        - link "Field Evidence (Mobile)" [ref=f1e56] [cursor=pointer]:
          - /url: /field-officer
        - generic [ref=f1e57]: •
        - link "Supervisor Sign-Off" [ref=f1e58] [cursor=pointer]:
          - /url: /supervisor-review
        - generic [ref=f1e59]: •
        - link "Governance Score" [ref=f1e60] [cursor=pointer]:
          - /url: /governance-score
        - generic [ref=f1e61]: •
        - link "Timeline Feed" [ref=f1e62] [cursor=pointer]:
          - /url: /timeline
        - generic [ref=f1e63]: •
        - link "Immutable Audit Log" [ref=f1e64] [cursor=pointer]:
          - /url: /audit-trail
      - generic [ref=f1e65]: "|"
      - generic [ref=f1e66]:
        - generic [ref=f1e67]: "Admin:"
        - link "IoT Telemetry Spike" [ref=f1e68] [cursor=pointer]:
          - /url: /iot-control
        - generic [ref=f1e69]: •
        - link "Users & RBAC" [ref=f1e70] [cursor=pointer]:
          - /url: /users
        - generic [ref=f1e71]: •
        - link "Settings" [ref=f1e72] [cursor=pointer]:
          - /url: /settings
  - generic [ref=f1e73]:
    - banner [ref=f1e74]:
      - generic [ref=f1e75]:
        - heading "Governance Action Center" [level=1] [ref=f1e76]
        - paragraph [ref=f1e77]: Closed-Loop AI Decision Support & Action Tracking
      - generic [ref=f1e78]:
        - combobox [ref=f1e79]:
          - option "Mine Alpha (Gevra Sector) (MINE-ALPHA)" [selected]
          - option "Mine Beta (Kusmunda Sector) (MINE-BETA)"
          - option "Mine Gamma (Dipka Sector) (MINE-GAMMA)"
          - option "Mine Delta (Manikpur Sector) (MINE-DELTA)"
          - option "Mine Omega (Jharia Sector) (MINE-OMEGA)"
        - button "[DEMO] Fast-Forward Time" [ref=f1e80]
    - generic [ref=f1e81]:
      - generic [ref=f1e82]:
        - heading "Current Intelligence" [level=2] [ref=f1e83]
        - button "Refresh Intelligence" [ref=f1e84]
      - generic [ref=f1e85]:
        - generic [ref=f1e86]:
          - heading "Baseline Risk" [level=3] [ref=f1e87]
          - generic [ref=f1e88]: "60.5"
          - generic [ref=f1e89]: HIGH
        - generic [ref=f1e90]:
          - heading "30-Day Critical Risk Probability" [level=3] [ref=f1e91]
          - generic [ref=f1e92]: 52%
          - generic [ref=f1e93]: XGBoost Early Warning
        - generic [ref=f1e94]:
          - heading "Behavioral Anomaly" [level=3] [ref=f1e95]
          - generic [ref=f1e96]: UNUSUAL
          - generic [ref=f1e97]: Isolation Forest
      - paragraph [ref=f1e98]: Risk and prediction values are dynamically recalculated after underlying operational data changes.
    - generic [ref=f1e99]:
      - generic [ref=f1e100]:
        - heading "AI Recommendations 1" [level=2] [ref=f1e101]:
          - text: AI Recommendations
          - generic [ref=f1e102]: "1"
        - generic [ref=f1e104]:
          - generic [ref=f1e105]: "Priority: HIGH | Source: BASELINE_RISK"
          - generic [ref=f1e106]:
            - heading "🟠 Priority Governance Review" [level=3] [ref=f1e107]
            - paragraph [ref=f1e108]: The mine's baseline risk is high. Review operational safety and environment indicators.
            - generic [ref=f1e109]: "AI Explanation: HIGH baseline risk calculated from operational data."
            - generic [ref=f1e110]:
              - button "Reject" [ref=f1e111]
              - button "Accept & Assign" [ref=f1e112]
      - generic [ref=f1e113]:
        - heading "Active Actions 52" [level=2] [ref=f1e114]:
          - text: Active Actions
          - generic [ref=f1e115]: "52"
        - generic [ref=f1e116]:
          - generic [ref=f1e117]:
            - generic [ref=f1e118]:
              - generic [ref=f1e119]:
                - heading "Synthetic Action" [level=3] [ref=f1e120]
                - paragraph [ref=f1e121]: Auto-generated
              - generic [ref=f1e122]: COMPLETED
            - generic [ref=f1e123]: "Due: 7/29/2026"
            - button "Verify & Close" [ref=f1e126]
          - generic [ref=f1e127]:
            - generic [ref=f1e128]:
              - generic [ref=f1e129]:
                - heading "Synthetic Action" [level=3] [ref=f1e130]
                - paragraph [ref=f1e131]: Auto-generated
              - generic [ref=f1e132]: COMPLETED
            - generic [ref=f1e133]: "Due: 7/31/2026"
            - button "Verify & Close" [ref=f1e136]
          - generic [ref=f1e137]:
            - generic [ref=f1e138]:
              - generic [ref=f1e139]:
                - heading "Synthetic Action" [level=3] [ref=f1e140]
                - paragraph [ref=f1e141]: Auto-generated
              - generic [ref=f1e142]: COMPLETED
            - generic [ref=f1e143]: "Due: 8/4/2026"
            - button "Verify & Close" [ref=f1e146]
          - generic [ref=f1e147]:
            - generic [ref=f1e148]:
              - generic [ref=f1e149]:
                - heading "Synthetic Action" [level=3] [ref=f1e150]
                - paragraph [ref=f1e151]: Auto-generated
              - generic [ref=f1e152]: OPEN
            - generic [ref=f1e153]: "Due: 8/8/2026"
            - button "Start Progress" [ref=f1e156]
          - generic [ref=f1e157]:
            - generic [ref=f1e158]:
              - generic [ref=f1e159]:
                - heading "Synthetic Action" [level=3] [ref=f1e160]
                - paragraph [ref=f1e161]: Auto-generated
              - generic [ref=f1e162]: COMPLETED
            - generic [ref=f1e163]: "Due: 8/10/2026"
            - button "Verify & Close" [ref=f1e166]
          - generic [ref=f1e167]:
            - generic [ref=f1e168]:
              - generic [ref=f1e169]:
                - heading "Synthetic Action" [level=3] [ref=f1e170]
                - paragraph [ref=f1e171]: Auto-generated
              - generic [ref=f1e172]: OPEN
            - generic [ref=f1e173]: "Due: 8/11/2026"
            - button "Start Progress" [ref=f1e176]
          - generic [ref=f1e177]:
            - generic [ref=f1e178]:
              - generic [ref=f1e179]:
                - heading "Synthetic Action" [level=3] [ref=f1e180]
                - paragraph [ref=f1e181]: Auto-generated
              - generic [ref=f1e182]: OPEN
            - generic [ref=f1e183]: "Due: 8/12/2026"
            - button "Start Progress" [ref=f1e186]
          - generic [ref=f1e187]:
            - generic [ref=f1e188]:
              - generic [ref=f1e189]:
                - heading "Synthetic Action" [level=3] [ref=f1e190]
                - paragraph [ref=f1e191]: Auto-generated
              - generic [ref=f1e192]: COMPLETED
            - generic [ref=f1e193]: "Due: 8/16/2026"
            - button "Verify & Close" [ref=f1e196]
          - generic [ref=f1e197]:
            - generic [ref=f1e198]:
              - generic [ref=f1e199]:
                - heading "Synthetic Action" [level=3] [ref=f1e200]
                - paragraph [ref=f1e201]: Auto-generated
              - generic [ref=f1e202]: OPEN
            - generic [ref=f1e203]: "Due: 8/17/2026"
            - button "Start Progress" [ref=f1e206]
          - generic [ref=f1e207]:
            - generic [ref=f1e208]:
              - generic [ref=f1e209]:
                - heading "Synthetic Action" [level=3] [ref=f1e210]
                - paragraph [ref=f1e211]: Auto-generated
              - generic [ref=f1e212]: COMPLETED
            - generic [ref=f1e213]: "Due: 8/18/2026"
            - button "Verify & Close" [ref=f1e216]
          - generic [ref=f1e217]:
            - generic [ref=f1e218]:
              - generic [ref=f1e219]:
                - heading "Synthetic Action" [level=3] [ref=f1e220]
                - paragraph [ref=f1e221]: Auto-generated
              - generic [ref=f1e222]: OPEN
            - generic [ref=f1e223]: "Due: 8/19/2026"
            - button "Start Progress" [ref=f1e226]
          - generic [ref=f1e227]:
            - generic [ref=f1e228]:
              - generic [ref=f1e229]:
                - heading "Synthetic Action" [level=3] [ref=f1e230]
                - paragraph [ref=f1e231]: Auto-generated
              - generic [ref=f1e232]: COMPLETED
            - generic [ref=f1e233]: "Due: 8/20/2026"
            - button "Verify & Close" [ref=f1e236]
          - generic [ref=f1e237]:
            - generic [ref=f1e238]:
              - generic [ref=f1e239]:
                - heading "Synthetic Action" [level=3] [ref=f1e240]
                - paragraph [ref=f1e241]: Auto-generated
              - generic [ref=f1e242]: COMPLETED
            - generic [ref=f1e243]: "Due: 8/20/2026"
            - button "Verify & Close" [ref=f1e246]
          - generic [ref=f1e247]:
            - generic [ref=f1e248]:
              - generic [ref=f1e249]:
                - heading "Synthetic Action" [level=3] [ref=f1e250]
                - paragraph [ref=f1e251]: Auto-generated
              - generic [ref=f1e252]: COMPLETED
            - generic [ref=f1e253]: "Due: 8/22/2026"
            - button "Verify & Close" [ref=f1e256]
          - generic [ref=f1e257]:
            - generic [ref=f1e258]:
              - generic [ref=f1e259]:
                - heading "Synthetic Action" [level=3] [ref=f1e260]
                - paragraph [ref=f1e261]: Auto-generated
              - generic [ref=f1e262]: COMPLETED
            - generic [ref=f1e263]: "Due: 8/22/2026"
            - button "Verify & Close" [ref=f1e266]
          - generic [ref=f1e267]:
            - generic [ref=f1e268]:
              - generic [ref=f1e269]:
                - heading "Synthetic Action" [level=3] [ref=f1e270]
                - paragraph [ref=f1e271]: Auto-generated
              - generic [ref=f1e272]: COMPLETED
            - generic [ref=f1e273]: "Due: 8/23/2026"
            - button "Verify & Close" [ref=f1e276]
          - generic [ref=f1e277]:
            - generic [ref=f1e278]:
              - generic [ref=f1e279]:
                - heading "Synthetic Action" [level=3] [ref=f1e280]
                - paragraph [ref=f1e281]: Auto-generated
              - generic [ref=f1e282]: OPEN
            - generic [ref=f1e283]: "Due: 8/25/2026"
            - button "Start Progress" [ref=f1e286]
          - generic [ref=f1e287]:
            - generic [ref=f1e288]:
              - generic [ref=f1e289]:
                - heading "Synthetic Action" [level=3] [ref=f1e290]
                - paragraph [ref=f1e291]: Auto-generated
              - generic [ref=f1e292]: COMPLETED
            - generic [ref=f1e293]: "Due: 8/25/2026"
            - button "Verify & Close" [ref=f1e296]
          - generic [ref=f1e297]:
            - generic [ref=f1e298]:
              - generic [ref=f1e299]:
                - heading "Synthetic Action" [level=3] [ref=f1e300]
                - paragraph [ref=f1e301]: Auto-generated
              - generic [ref=f1e302]: COMPLETED
            - generic [ref=f1e303]: "Due: 8/26/2026"
            - button "Verify & Close" [ref=f1e306]
          - generic [ref=f1e307]:
            - generic [ref=f1e308]:
              - generic [ref=f1e309]:
                - heading "Synthetic Action" [level=3] [ref=f1e310]
                - paragraph [ref=f1e311]: Auto-generated
              - generic [ref=f1e312]: COMPLETED
            - generic [ref=f1e313]: "Due: 8/27/2026"
            - button "Verify & Close" [ref=f1e316]
          - generic [ref=f1e317]:
            - generic [ref=f1e318]:
              - generic [ref=f1e319]:
                - heading "Synthetic Action" [level=3] [ref=f1e320]
                - paragraph [ref=f1e321]: Auto-generated
              - generic [ref=f1e322]: COMPLETED
            - generic [ref=f1e323]: "Due: 8/28/2026"
            - button "Verify & Close" [ref=f1e326]
          - generic [ref=f1e327]:
            - generic [ref=f1e328]:
              - generic [ref=f1e329]:
                - heading "Synthetic Action" [level=3] [ref=f1e330]
                - paragraph [ref=f1e331]: Auto-generated
              - generic [ref=f1e332]: COMPLETED
            - generic [ref=f1e333]: "Due: 8/28/2026"
            - button "Verify & Close" [ref=f1e336]
          - generic [ref=f1e337]:
            - generic [ref=f1e338]:
              - generic [ref=f1e339]:
                - heading "Synthetic Action" [level=3] [ref=f1e340]
                - paragraph [ref=f1e341]: Auto-generated
              - generic [ref=f1e342]: COMPLETED
            - generic [ref=f1e343]: "Due: 8/29/2026"
            - button "Verify & Close" [ref=f1e346]
          - generic [ref=f1e347]:
            - generic [ref=f1e348]:
              - generic [ref=f1e349]:
                - heading "Synthetic Action" [level=3] [ref=f1e350]
                - paragraph [ref=f1e351]: Auto-generated
              - generic [ref=f1e352]: COMPLETED
            - generic [ref=f1e353]: "Due: 8/31/2026"
            - button "Verify & Close" [ref=f1e356]
          - generic [ref=f1e357]:
            - generic [ref=f1e358]:
              - generic [ref=f1e359]:
                - heading "Synthetic Action" [level=3] [ref=f1e360]
                - paragraph [ref=f1e361]: Auto-generated
              - generic [ref=f1e362]: COMPLETED
            - generic [ref=f1e363]: "Due: 9/1/2026"
            - button "Verify & Close" [ref=f1e366]
          - generic [ref=f1e367]:
            - generic [ref=f1e368]:
              - generic [ref=f1e369]:
                - heading "Synthetic Action" [level=3] [ref=f1e370]
                - paragraph [ref=f1e371]: Auto-generated
              - generic [ref=f1e372]: OPEN
            - generic [ref=f1e373]: "Due: 9/6/2026"
            - button "Start Progress" [ref=f1e376]
          - generic [ref=f1e377]:
            - generic [ref=f1e378]:
              - generic [ref=f1e379]:
                - heading "Synthetic Action" [level=3] [ref=f1e380]
                - paragraph [ref=f1e381]: Auto-generated
              - generic [ref=f1e382]: COMPLETED
            - generic [ref=f1e383]: "Due: 9/8/2026"
            - button "Verify & Close" [ref=f1e386]
          - generic [ref=f1e387]:
            - generic [ref=f1e388]:
              - generic [ref=f1e389]:
                - heading "Synthetic Action" [level=3] [ref=f1e390]
                - paragraph [ref=f1e391]: Auto-generated
              - generic [ref=f1e392]: COMPLETED
            - generic [ref=f1e393]: "Due: 9/10/2026"
            - button "Verify & Close" [ref=f1e396]
          - generic [ref=f1e397]:
            - generic [ref=f1e398]:
              - generic [ref=f1e399]:
                - heading "Synthetic Action" [level=3] [ref=f1e400]
                - paragraph [ref=f1e401]: Auto-generated
              - generic [ref=f1e402]: COMPLETED
            - generic [ref=f1e403]: "Due: 9/12/2026"
            - button "Verify & Close" [ref=f1e406]
          - generic [ref=f1e407]:
            - generic [ref=f1e408]:
              - generic [ref=f1e409]:
                - heading "Synthetic Action" [level=3] [ref=f1e410]
                - paragraph [ref=f1e411]: Auto-generated
              - generic [ref=f1e412]: COMPLETED
            - generic [ref=f1e413]: "Due: 9/13/2026"
            - button "Verify & Close" [ref=f1e416]
          - generic [ref=f1e417]:
            - generic [ref=f1e418]:
              - generic [ref=f1e419]:
                - heading "Synthetic Action" [level=3] [ref=f1e420]
                - paragraph [ref=f1e421]: Auto-generated
              - generic [ref=f1e422]: COMPLETED
            - generic [ref=f1e423]: "Due: 9/14/2026"
            - button "Verify & Close" [ref=f1e426]
          - generic [ref=f1e427]:
            - generic [ref=f1e428]:
              - generic [ref=f1e429]:
                - heading "Synthetic Action" [level=3] [ref=f1e430]
                - paragraph [ref=f1e431]: Auto-generated
              - generic [ref=f1e432]: COMPLETED
            - generic [ref=f1e433]: "Due: 9/14/2026"
            - button "Verify & Close" [ref=f1e436]
          - generic [ref=f1e437]:
            - generic [ref=f1e438]:
              - generic [ref=f1e439]:
                - heading "Synthetic Action" [level=3] [ref=f1e440]
                - paragraph [ref=f1e441]: Auto-generated
              - generic [ref=f1e442]: OPEN
            - generic [ref=f1e443]: "Due: 9/14/2026"
            - button "Start Progress" [ref=f1e446]
          - generic [ref=f1e447]:
            - generic [ref=f1e448]:
              - generic [ref=f1e449]:
                - heading "Synthetic Action" [level=3] [ref=f1e450]
                - paragraph [ref=f1e451]: Auto-generated
              - generic [ref=f1e452]: COMPLETED
            - generic [ref=f1e453]: "Due: 9/15/2026"
            - button "Verify & Close" [ref=f1e456]
          - generic [ref=f1e457]:
            - generic [ref=f1e458]:
              - generic [ref=f1e459]:
                - heading "Deploy Continuous Water Mist Cannons on North Haul Road" [level=3] [ref=f1e460]
                - paragraph [ref=f1e461]: Suppress active particulate dust spike along KM 2.4 haul route to bring PM10 below 100 μg/m³.
              - generic [ref=f1e462]: IN_PROGRESS
            - generic [ref=f1e463]: "Due: 9/15/2026"
            - generic [ref=f1e466]:
              - heading "Field Evidence Collection (Officer View)" [level=4] [ref=f1e467]
              - generic [ref=f1e468]:
                - generic [ref=f1e469]: Submitted Evidence (1)
                - generic [ref=f1e471]:
                  - generic [ref=f1e473]: "Lat: 22.3490"
                  - generic [ref=f1e474]: "Lng: 82.6790"
                  - generic [ref=f1e475]: Mist cannons deployed and operational at KM 2.4. Water spray suppression active across haul corridor.
              - generic [ref=f1e476]:
                - generic [ref=f1e477]:
                  - generic [ref=f1e478]: Photo Evidence
                  - button "Choose File" [ref=f1e479]
                - generic [ref=f1e480]:
                  - generic [ref=f1e481]: GPS Coordinates
                  - generic [ref=f1e482]:
                    - button "Capture GPS" [ref=f1e483]
                    - button "Demo GPS" [ref=f1e484]
                  - generic [ref=f1e485]:
                    - textbox "Latitude" [ref=f1e486]
                    - textbox "Longitude" [ref=f1e487]
                - generic [ref=f1e488]:
                  - generic [ref=f1e489]: Remarks
                  - textbox "Add context or notes about the evidence..." [ref=f1e490]
                - generic [ref=f1e491]:
                  - button "Submit Evidence" [disabled] [ref=f1e492]
                  - button "Submit for Review" [ref=f1e493]
          - generic [ref=f1e494]:
            - generic [ref=f1e495]:
              - generic [ref=f1e496]:
                - heading "Suspend HeavyLift Dumper Operations pending Operator Re-training" [level=3] [ref=f1e497]
                - paragraph [ref=f1e498]: HeavyLift drivers must complete mandatory DGMS simulator refresher before haul route re-entry.
              - generic [ref=f1e499]: OPEN
            - generic [ref=f1e500]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e503]
          - generic [ref=f1e504]:
            - generic [ref=f1e505]:
              - generic [ref=f1e506]:
                - heading "Synthetic Action" [level=3] [ref=f1e507]
                - paragraph [ref=f1e508]: Auto-generated
              - generic [ref=f1e509]: COMPLETED
            - generic [ref=f1e510]: "Due: 9/16/2026"
            - button "Verify & Close" [ref=f1e513]
          - generic [ref=f1e514]:
            - generic [ref=f1e515]:
              - generic [ref=f1e516]:
                - 'heading "Incident Escalation: EQUIPMENT" [level=3] [ref=f1e517]'
                - paragraph [ref=f1e518]: "E2E TEST: The main ventilation fan in section 4 has completely failed."
              - generic [ref=f1e519]: OPEN
            - generic [ref=f1e520]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e523]
          - generic [ref=f1e524]:
            - generic [ref=f1e525]:
              - generic [ref=f1e526]:
                - 'heading "Incident Escalation: EQUIPMENT" [level=3] [ref=f1e527]'
                - paragraph [ref=f1e528]: "E2E TEST: The main ventilation fan in section 4 has completely failed."
              - generic [ref=f1e529]: OPEN
            - generic [ref=f1e530]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e533]
          - generic [ref=f1e534]:
            - generic [ref=f1e535]:
              - generic [ref=f1e536]:
                - heading "Synthetic Action" [level=3] [ref=f1e537]
                - paragraph [ref=f1e538]: Auto-generated
              - generic [ref=f1e539]: COMPLETED
            - generic [ref=f1e540]: "Due: 9/16/2026"
            - button "Verify & Close" [ref=f1e543]
          - generic [ref=f1e544]:
            - generic [ref=f1e545]:
              - generic [ref=f1e546]:
                - heading "Synthetic Action" [level=3] [ref=f1e547]
                - paragraph [ref=f1e548]: Auto-generated
              - generic [ref=f1e549]: COMPLETED
            - generic [ref=f1e550]: "Due: 9/18/2026"
            - button "Verify & Close" [ref=f1e553]
          - generic [ref=f1e554]:
            - generic [ref=f1e555]:
              - generic [ref=f1e556]:
                - heading "Synthetic Action" [level=3] [ref=f1e557]
                - paragraph [ref=f1e558]: Auto-generated
              - generic [ref=f1e559]: COMPLETED
            - generic [ref=f1e560]: "Due: 9/21/2026"
            - button "Verify & Close" [ref=f1e563]
          - generic [ref=f1e564]:
            - generic [ref=f1e565]:
              - generic [ref=f1e566]:
                - heading "Synthetic Action" [level=3] [ref=f1e567]
                - paragraph [ref=f1e568]: Auto-generated
              - generic [ref=f1e569]: COMPLETED
            - generic [ref=f1e570]: "Due: 9/21/2026"
            - button "Verify & Close" [ref=f1e573]
          - generic [ref=f1e574]:
            - generic [ref=f1e575]:
              - generic [ref=f1e576]:
                - heading "Immediate Governance Review" [level=3] [ref=f1e577]
                - paragraph [ref=f1e578]: "[AI Recommended] The mine's baseline risk has reached a critical level. Immediate review required. Reason: CRITICAL baseline risk calculated from operational data."
              - generic [ref=f1e579]: OPEN
            - generic [ref=f1e580]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e583]
          - generic [ref=f1e584]:
            - generic [ref=f1e585]:
              - generic [ref=f1e586]:
                - 'heading "Renew Expired Document: Environmental Clearance (MoEFCC)" [level=3] [ref=f1e587]'
                - paragraph [ref=f1e588]: "[AI Recommended] Document EC-MOEF-2021-9982 expired on 2026-09-05T03:27:09.870342. Reason: Compliance document is expired."
              - generic [ref=f1e589]: OPEN
            - generic [ref=f1e590]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e593]
          - generic [ref=f1e594]:
            - generic [ref=f1e595]:
              - generic [ref=f1e596]:
                - heading "Preventive Safety Inspection" [level=3] [ref=f1e597]
                - paragraph [ref=f1e598]: "[AI Recommended] AI predicts a 96% probability of critical risk in the next 30 days. Reason: High XGBoost probability of impending critical risk."
              - generic [ref=f1e599]: OPEN
            - generic [ref=f1e600]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e603]
          - generic [ref=f1e604]:
            - generic [ref=f1e605]:
              - generic [ref=f1e606]:
                - heading "Synthetic Action" [level=3] [ref=f1e607]
                - paragraph [ref=f1e608]: Auto-generated
              - generic [ref=f1e609]: COMPLETED
            - generic [ref=f1e610]: "Due: 9/22/2026"
            - button "Verify & Close" [ref=f1e613]
          - generic [ref=f1e614]:
            - generic [ref=f1e615]:
              - generic [ref=f1e616]:
                - heading "Synthetic Action" [level=3] [ref=f1e617]
                - paragraph [ref=f1e618]: Auto-generated
              - generic [ref=f1e619]: OPEN
            - generic [ref=f1e620]: "Due: 9/23/2026"
            - button "Start Progress" [ref=f1e623]
          - generic [ref=f1e624]:
            - generic [ref=f1e625]:
              - generic [ref=f1e626]:
                - heading "Synthetic Action" [level=3] [ref=f1e627]
                - paragraph [ref=f1e628]: Auto-generated
              - generic [ref=f1e629]: COMPLETED
            - generic [ref=f1e630]: "Due: 9/24/2026"
            - button "Verify & Close" [ref=f1e633]
          - generic [ref=f1e634]:
            - generic [ref=f1e635]:
              - generic [ref=f1e636]:
                - heading "Synthetic Action" [level=3] [ref=f1e637]
                - paragraph [ref=f1e638]: Auto-generated
              - generic [ref=f1e639]: COMPLETED
            - generic [ref=f1e640]: "Due: 9/28/2026"
            - button "Verify & Close" [ref=f1e643]
          - generic [ref=f1e644]:
            - generic [ref=f1e645]:
              - generic [ref=f1e646]:
                - heading "Synthetic Action" [level=3] [ref=f1e647]
                - paragraph [ref=f1e648]: Auto-generated
              - generic [ref=f1e649]: COMPLETED
            - generic [ref=f1e650]: "Due: 9/28/2026"
            - button "Verify & Close" [ref=f1e653]
          - generic [ref=f1e654]:
            - generic [ref=f1e655]:
              - generic [ref=f1e656]:
                - heading "Synthetic Action" [level=3] [ref=f1e657]
                - paragraph [ref=f1e658]: Auto-generated
              - generic [ref=f1e659]: OPEN
            - generic [ref=f1e660]: "Due: 10/4/2026"
            - button "Start Progress" [ref=f1e663]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Stage 10H: Evidence Intelligence Integration', () => {
  4  |   test('Analyze Evidence in Supervisor Review Panel', async ({ page }) => {
  5  |     // 0. Login
  6  |     await page.goto('/login');
  7  |     await page.fill('#login-email', 'admin@coalguard.ai');
  8  |     await page.fill('#login-password', 'Admin@123');
  9  |     await page.click('#login-submit');
  10 |     await page.waitForURL('**/command-center', { timeout: 15000 });
  11 | 
  12 |     // 1. Navigate to Governance Action Center
  13 |     await page.goto('/governance');
  14 |     await page.waitForSelector('text=Governance Action Center');
  15 | 
  16 |     // 2. We need an action in IN_REVIEW state, but first we might need to create it.
  17 |     // Let's assume the test database has some recommendations we can accept.
  18 |     // Let's find an "Accept & Assign" button to create an action.
  19 |     const acceptButtons = page.locator('button:has-text("Accept & Assign")');
  20 |     if (await acceptButtons.count() > 0) {
  21 |       await acceptButtons.first().click();
  22 |       await page.waitForTimeout(1000); // Wait for recalculation
  23 |     }
  24 | 
  25 |     // 3. Find an OPEN action and Start Progress
  26 |     const startProgressButtons = page.locator('button:has-text("Start Progress")');
  27 |     if (await startProgressButtons.count() > 0) {
  28 |       await startProgressButtons.first().click();
  29 |       await page.waitForTimeout(1000);
  30 |     }
  31 | 
  32 |     // 4. Submit Evidence (Requires IN_PROGRESS action)
  33 |     // First, upload a fake image
  34 |     const fileInput = page.locator('input[type="file"]').first();
  35 |     if (await fileInput.count() > 0) {
  36 |         // Create a fake image buffer
  37 |         const buffer = Buffer.from(
  38 |           'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  39 |           'base64'
  40 |         );
  41 |         
  42 |         await fileInput.setInputFiles({
  43 |           name: 'fake.png',
  44 |           mimeType: 'image/png',
  45 |           buffer
  46 |         });
  47 |         
  48 |         await page.click('button:has-text("Demo GPS")');
  49 |         await page.click('button:has-text("Submit Evidence")');
  50 |         
  51 |         // Wait for evidence to upload and appear
  52 |         await page.waitForSelector('text=Submitted Evidence');
  53 | 
  54 |         // Submit for review
  55 |         await page.click('button:has-text("Submit for Review")');
  56 |         await page.waitForTimeout(1000);
  57 |     }
  58 | 
  59 |     // 5. Action is now IN_REVIEW. We should see the Supervisor Review panel.
> 60 |     await page.waitForSelector('text=Supervisor Review');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  61 |     await page.waitForSelector('text=AI Assisted');
  62 | 
  63 |     // 6. Click Analyze Evidence
  64 |     const analyzeButton = page.locator('button:has-text("Analyze Evidence")');
  65 |     await expect(analyzeButton).toBeVisible();
  66 |     await analyzeButton.click();
  67 | 
  68 |     // 7. Verify analysis results appear
  69 |     await expect(page.locator('text=DEMO ANALYZER')).toBeVisible({ timeout: 10000 });
  70 |     await expect(page.locator('text=AI Confidence:')).toBeVisible();
  71 |     await expect(page.locator('text=Relevance:')).toBeVisible();
  72 |     await expect(page.locator('text=Evidence Quality:')).toBeVisible();
  73 |     await expect(page.locator('text=Analysis Summary:')).toBeVisible();
  74 | 
  75 |     // 8. Verify the verify button still works
  76 |     const verifyButton = page.locator('button:has-text("Verify & Complete Action")');
  77 |     await expect(verifyButton).toBeVisible();
  78 |   });
  79 | });
  80 | 
```