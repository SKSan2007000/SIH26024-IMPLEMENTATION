import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('COALGUARD AI - STAGE 8 VISUAL GOLDEN PATH', () => {
  let consoleErrors: string[] = [];
  let networkFailures: any[] = [];
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page, request }) => {
    consoleErrors = [];
    networkFailures = [];

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('chrome-extension://') && !text.includes('zybTracker')) {
          consoleErrors.push(text);
        }
      }
    });

    // Track network failures (ignore chrome extensions)
    page.on('response', response => {
      const url = response.url();
      if (!url.startsWith('http')) return;
      if (url.includes('chrome-extension') || url.includes('zybTracker')) return;
      
      const status = response.status();
      if (status >= 400) {
        networkFailures.push({ url, status, method: response.request().method() });
      }
    });
  });

  test('Golden Path Execution', async ({ page, request }) => {
    // 1. Verify backend reachable
    console.log('Checking backend connectivity...');
    try {
      const backendHealth = await request.get('http://127.0.0.1:8000/api/health');
      expect(backendHealth.ok()).toBeTruthy();
    } catch (e: any) {
      throw new Error(`Backend is not reachable: ${e.message}`);
    }

    // 2. Login to Application
    console.log('Logging in as Admin...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('#login-email');
    await page.fill('#login-email', 'admin@coalguard.ai');
    await page.fill('#login-password', 'Admin@123');
    await page.click('#login-submit');

    // 3. Command Center Initial State
    console.log('Loading Command Center...');
    await page.waitForURL('**/command-center', { timeout: 15000 });
    
    // Verify Page loads successfully
    await expect(page.locator('body')).not.toBeEmpty();
    
    // Check for KPI, Mine list, System Health
    await expect(page.locator('text=Command Center').first()).toBeVisible({ timeout: 10000 });
    
    // Check System Health texts
    await expect(page.locator('text=ONLINE').first()).toBeVisible();
    await expect(page.locator('text=READY').first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, '01-command-center.png'), fullPage: true });

    // Visual text checks for undefined/null/object
    const pageText = await page.locator('body').innerText();
    expect(pageText).not.toContain('undefined');
    expect(pageText).not.toContain('null');
    expect(pageText).not.toContain('[object Object]');

    // 3.5. 2D Map Verification
    console.log('Verifying 2D map...');
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
    
    const markers = page.locator('path.leaflet-interactive');
    await expect(markers.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '01b-map-loaded.png') });
    
    console.log('Clicking a map marker...');
    // Use force: true in case Leaflet is intercepting it weirdly
    await markers.first().click({ force: true });
    
    await expect(page.locator('.leaflet-popup-content')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotsDir, '02-prioritized-mine-popup.png') });

    // 5. AI Intelligence
    console.log('Opening AI Intelligence via Map...');
    const mapIntelBtn = page.locator('.leaflet-popup-content button:has-text("View Mine Intelligence")');
    await mapIntelBtn.click();
    
    // Wait for the intelligence modal/page to load
    await expect(page.locator('text=Baseline Risk').first()).toBeVisible();
    await expect(page.locator('text=XGBoost').first()).toBeVisible();
    await expect(page.locator('text=Isolation Forest').first()).toBeVisible();

    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: path.join(screenshotsDir, '03-intelligence-triad.png') });

    // 6. SHAP Explainability
    console.log('Checking SHAP explainability...');
    // SHAP factors could take time to load
    await expect(page.locator('text=Why This Prediction?').first()).toBeVisible();
    await expect(page.locator('text=Risk Increasing').first()).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotsDir, '04-shap-explanation.png') });

    // 7. Governance Recommendations
    console.log('Checking Governance Recommendations...');
    await expect(page.locator('text=AI Recommendations').or(page.locator('text=Governance Recommendations')).first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '05-governance-recommendations.png') });

    // 8. Accept Recommendation
    console.log('Accepting Recommendation...');
    const acceptBtn = page.locator('button:has-text("ACCEPT"), button:has-text("Accept & Assign")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      
      // If assignment dialog appears, look for a confirm button
      const assignConfirm = page.locator('button:has-text("Confirm"), button:has-text("Assign")').last();
      if (await assignConfirm.isVisible()) {
         await assignConfirm.click();
      }
    } else {
      console.log('No ACCEPT button found. Might not have recommendations.');
    }
    
    await page.waitForTimeout(1000); // wait for API & UI refresh
    await page.screenshot({ path: path.join(screenshotsDir, '06-recommendation-accepted.png') });

    // 9. Corrective Action
    console.log('Checking Corrective Action...');
    // Find newly created action
    await expect(page.locator('text=Corrective Action').or(page.locator('text=Active Actions')).first()).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '07-corrective-action.png') });

    // 10. Complete Action
    console.log('Completing Action...');
    const completeBtn = page.locator('button:has-text("COMPLETED"), button:has-text("Complete"), button:has-text("Mark Complete")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(1000); // wait for API & UI refresh
    }
    await page.screenshot({ path: path.join(screenshotsDir, '08-action-completed.png') });

    // 11. Recalculate
    console.log('Recalculating...');
    const recalcBtn = page.locator('button:has-text("Recalculate"), button:has-text("Refresh Intelligence"), button:has-text("Sync Core")').first();
    if (await recalcBtn.isVisible()) {
      await recalcBtn.click();
      // Wait for loading to disappear if it appears
      await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '09-recalculated-state.png') });

    // 12. Audit Timeline
    console.log('Checking Audit Timeline...');
    const timelineHdr = page.locator('text=Audit Timeline').first();
    if (await timelineHdr.isVisible()) {
      await timelineHdr.scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '10-audit-timeline.png') });

    // 14. Report errors
    if (consoleErrors.length > 0) {
      console.error('Console Errors:', consoleErrors);
    }
    if (networkFailures.length > 0) {
      console.error('Network Failures:', networkFailures);
    }
    
    // 15. Automated assertions logic
    expect(consoleErrors.length).toBe(0);
    expect(networkFailures.length).toBe(0);
  });
});
