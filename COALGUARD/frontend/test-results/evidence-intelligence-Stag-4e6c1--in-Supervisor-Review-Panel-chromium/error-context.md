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
          - generic [ref=f1e88]: "77.0"
          - generic [ref=f1e89]: CRITICAL
        - generic [ref=f1e90]:
          - heading "30-Day Critical Risk Probability" [level=3] [ref=f1e91]
          - generic [ref=f1e92]: 81%
          - generic [ref=f1e93]: XGBoost Early Warning
        - generic [ref=f1e94]:
          - heading "Behavioral Anomaly" [level=3] [ref=f1e95]
          - generic [ref=f1e96]: UNUSUAL
          - generic [ref=f1e97]: Isolation Forest
      - paragraph [ref=f1e98]: Risk and prediction values are dynamically recalculated after underlying operational data changes.
    - generic [ref=f1e99]:
      - generic [ref=f1e100]:
        - heading "AI Recommendations 0" [level=2] [ref=f1e101]:
          - text: AI Recommendations
          - generic [ref=f1e102]: "0"
        - generic [ref=f1e103]: No active recommendations. The mine is operating within acceptable parameters.
      - generic [ref=f1e105]:
        - heading "Active Actions 22" [level=2] [ref=f1e106]:
          - text: Active Actions
          - generic [ref=f1e107]: "22"
        - generic [ref=f1e108]:
          - generic [ref=f1e109]:
            - generic [ref=f1e110]:
              - generic [ref=f1e111]:
                - heading "Synthetic Action" [level=3] [ref=f1e112]
                - paragraph [ref=f1e113]: Auto-generated
              - generic [ref=f1e114]: COMPLETED
            - generic [ref=f1e115]: "Due: 7/29/2026"
            - button "Verify & Close" [ref=f1e118]
          - generic [ref=f1e119]:
            - generic [ref=f1e120]:
              - generic [ref=f1e121]:
                - heading "Synthetic Action" [level=3] [ref=f1e122]
                - paragraph [ref=f1e123]: Auto-generated
              - generic [ref=f1e124]: COMPLETED
            - generic [ref=f1e125]: "Due: 7/31/2026"
            - button "Verify & Close" [ref=f1e128]
          - generic [ref=f1e129]:
            - generic [ref=f1e130]:
              - generic [ref=f1e131]:
                - heading "Synthetic Action" [level=3] [ref=f1e132]
                - paragraph [ref=f1e133]: Auto-generated
              - generic [ref=f1e134]: COMPLETED
            - generic [ref=f1e135]: "Due: 8/4/2026"
            - button "Verify & Close" [ref=f1e138]
          - generic [ref=f1e139]:
            - generic [ref=f1e140]:
              - generic [ref=f1e141]:
                - heading "Synthetic Action" [level=3] [ref=f1e142]
                - paragraph [ref=f1e143]: Auto-generated
              - generic [ref=f1e144]: COMPLETED
            - generic [ref=f1e145]: "Due: 8/10/2026"
            - button "Verify & Close" [ref=f1e148]
          - generic [ref=f1e149]:
            - generic [ref=f1e150]:
              - generic [ref=f1e151]:
                - heading "Synthetic Action" [level=3] [ref=f1e152]
                - paragraph [ref=f1e153]: Auto-generated
              - generic [ref=f1e154]: COMPLETED
            - generic [ref=f1e155]: "Due: 8/16/2026"
            - button "Verify & Close" [ref=f1e158]
          - generic [ref=f1e159]:
            - generic [ref=f1e160]:
              - generic [ref=f1e161]:
                - heading "Synthetic Action" [level=3] [ref=f1e162]
                - paragraph [ref=f1e163]: Auto-generated
              - generic [ref=f1e164]: OPEN
            - generic [ref=f1e165]: "Due: 8/19/2026"
            - button "Start Progress" [ref=f1e168]
          - generic [ref=f1e169]:
            - generic [ref=f1e170]:
              - generic [ref=f1e171]:
                - heading "Synthetic Action" [level=3] [ref=f1e172]
                - paragraph [ref=f1e173]: Auto-generated
              - generic [ref=f1e174]: COMPLETED
            - generic [ref=f1e175]: "Due: 8/20/2026"
            - button "Verify & Close" [ref=f1e178]
          - generic [ref=f1e179]:
            - generic [ref=f1e180]:
              - generic [ref=f1e181]:
                - heading "Synthetic Action" [level=3] [ref=f1e182]
                - paragraph [ref=f1e183]: Auto-generated
              - generic [ref=f1e184]: COMPLETED
            - generic [ref=f1e185]: "Due: 8/23/2026"
            - button "Verify & Close" [ref=f1e188]
          - generic [ref=f1e189]:
            - generic [ref=f1e190]:
              - generic [ref=f1e191]:
                - heading "Synthetic Action" [level=3] [ref=f1e192]
                - paragraph [ref=f1e193]: Auto-generated
              - generic [ref=f1e194]: OPEN
            - generic [ref=f1e195]: "Due: 8/25/2026"
            - button "Start Progress" [ref=f1e198]
          - generic [ref=f1e199]:
            - generic [ref=f1e200]:
              - generic [ref=f1e201]:
                - heading "Synthetic Action" [level=3] [ref=f1e202]
                - paragraph [ref=f1e203]: Auto-generated
              - generic [ref=f1e204]: COMPLETED
            - generic [ref=f1e205]: "Due: 8/26/2026"
            - button "Verify & Close" [ref=f1e208]
          - generic [ref=f1e209]:
            - generic [ref=f1e210]:
              - generic [ref=f1e211]:
                - heading "Synthetic Action" [level=3] [ref=f1e212]
                - paragraph [ref=f1e213]: Auto-generated
              - generic [ref=f1e214]: COMPLETED
            - generic [ref=f1e215]: "Due: 8/29/2026"
            - button "Verify & Close" [ref=f1e218]
          - generic [ref=f1e219]:
            - generic [ref=f1e220]:
              - generic [ref=f1e221]:
                - heading "Synthetic Action" [level=3] [ref=f1e222]
                - paragraph [ref=f1e223]: Auto-generated
              - generic [ref=f1e224]: OPEN
            - generic [ref=f1e225]: "Due: 9/6/2026"
            - button "Start Progress" [ref=f1e228]
          - generic [ref=f1e229]:
            - generic [ref=f1e230]:
              - generic [ref=f1e231]:
                - heading "Synthetic Action" [level=3] [ref=f1e232]
                - paragraph [ref=f1e233]: Auto-generated
              - generic [ref=f1e234]: COMPLETED
            - generic [ref=f1e235]: "Due: 9/14/2026"
            - button "Verify & Close" [ref=f1e238]
          - generic [ref=f1e239]:
            - generic [ref=f1e240]:
              - generic [ref=f1e241]:
                - heading "Deploy Continuous Water Mist Cannons on North Haul Road" [level=3] [ref=f1e242]
                - paragraph [ref=f1e243]: Suppress active particulate dust spike along KM 2.4 haul route to bring PM10 below 100 μg/m³.
              - generic [ref=f1e244]: IN_PROGRESS
            - generic [ref=f1e245]: "Due: 9/15/2026"
            - generic [ref=f1e248]:
              - heading "Field Evidence Collection (Officer View)" [level=4] [ref=f1e249]
              - generic [ref=f1e250]:
                - generic [ref=f1e251]: Submitted Evidence (1)
                - generic [ref=f1e253]:
                  - generic [ref=f1e255]: "Lat: 22.3490"
                  - generic [ref=f1e256]: "Lng: 82.6790"
                  - generic [ref=f1e257]: Mist cannons deployed and operational at KM 2.4. Water spray suppression active across haul corridor.
              - generic [ref=f1e258]:
                - generic [ref=f1e259]:
                  - generic [ref=f1e260]: Photo Evidence
                  - button "Choose File" [ref=f1e261]
                - generic [ref=f1e262]:
                  - generic [ref=f1e263]: GPS Coordinates
                  - generic [ref=f1e264]:
                    - button "Capture GPS" [ref=f1e265]
                    - button "Demo GPS" [ref=f1e266]
                  - generic [ref=f1e267]:
                    - textbox "Latitude" [ref=f1e268]
                    - textbox "Longitude" [ref=f1e269]
                - generic [ref=f1e270]:
                  - generic [ref=f1e271]: Remarks
                  - textbox "Add context or notes about the evidence..." [ref=f1e272]
                - generic [ref=f1e273]:
                  - button "Submit Evidence" [disabled] [ref=f1e274]
                  - button "Submit for Review" [ref=f1e275]
          - generic [ref=f1e276]:
            - generic [ref=f1e277]:
              - generic [ref=f1e278]:
                - heading "Suspend HeavyLift Dumper Operations pending Operator Re-training" [level=3] [ref=f1e279]
                - paragraph [ref=f1e280]: HeavyLift drivers must complete mandatory DGMS simulator refresher before haul route re-entry.
              - generic [ref=f1e281]: OPEN
            - generic [ref=f1e282]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e285]
          - generic [ref=f1e286]:
            - generic [ref=f1e287]:
              - generic [ref=f1e288]:
                - heading "Synthetic Action" [level=3] [ref=f1e289]
                - paragraph [ref=f1e290]: Auto-generated
              - generic [ref=f1e291]: COMPLETED
            - generic [ref=f1e292]: "Due: 9/16/2026"
            - button "Verify & Close" [ref=f1e295]
          - generic [ref=f1e296]:
            - generic [ref=f1e297]:
              - generic [ref=f1e298]:
                - 'heading "Incident Escalation: EQUIPMENT" [level=3] [ref=f1e299]'
                - paragraph [ref=f1e300]: "E2E TEST: The main ventilation fan in section 4 has completely failed."
              - generic [ref=f1e301]: OPEN
            - generic [ref=f1e302]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e305]
          - generic [ref=f1e306]:
            - generic [ref=f1e307]:
              - generic [ref=f1e308]:
                - 'heading "Incident Escalation: EQUIPMENT" [level=3] [ref=f1e309]'
                - paragraph [ref=f1e310]: "E2E TEST: The main ventilation fan in section 4 has completely failed."
              - generic [ref=f1e311]: OPEN
            - generic [ref=f1e312]: "Due: 9/16/2026"
            - button "Start Progress" [ref=f1e315]
          - generic [ref=f1e316]:
            - generic [ref=f1e317]:
              - generic [ref=f1e318]:
                - heading "Synthetic Action" [level=3] [ref=f1e319]
                - paragraph [ref=f1e320]: Auto-generated
              - generic [ref=f1e321]: COMPLETED
            - generic [ref=f1e322]: "Due: 9/21/2026"
            - button "Verify & Close" [ref=f1e325]
          - generic [ref=f1e326]:
            - generic [ref=f1e327]:
              - generic [ref=f1e328]:
                - heading "Immediate Governance Review" [level=3] [ref=f1e329]
                - paragraph [ref=f1e330]: "[AI Recommended] The mine's baseline risk has reached a critical level. Immediate review required. Reason: CRITICAL baseline risk calculated from operational data."
              - generic [ref=f1e331]: OPEN
            - generic [ref=f1e332]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e335]
          - generic [ref=f1e336]:
            - generic [ref=f1e337]:
              - generic [ref=f1e338]:
                - 'heading "Renew Expired Document: Environmental Clearance (MoEFCC)" [level=3] [ref=f1e339]'
                - paragraph [ref=f1e340]: "[AI Recommended] Document EC-MOEF-2021-9982 expired on 2026-09-05T03:27:09.870342. Reason: Compliance document is expired."
              - generic [ref=f1e341]: OPEN
            - generic [ref=f1e342]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e345]
          - generic [ref=f1e346]:
            - generic [ref=f1e347]:
              - generic [ref=f1e348]:
                - heading "Preventive Safety Inspection" [level=3] [ref=f1e349]
                - paragraph [ref=f1e350]: "[AI Recommended] AI predicts a 96% probability of critical risk in the next 30 days. Reason: High XGBoost probability of impending critical risk."
              - generic [ref=f1e351]: OPEN
            - generic [ref=f1e352]: "Due: 9/22/2026"
            - button "Start Progress" [ref=f1e355]
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