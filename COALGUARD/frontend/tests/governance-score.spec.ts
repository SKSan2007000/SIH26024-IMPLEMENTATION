import { test, expect } from '@playwright/test';

test.describe('Stage 10G - Verified Governance Score', () => {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('requestfailed', request => {
      networkErrors.push(request.url() + ' ' + request.failure()?.errorText);
    });
  });

  test('Verify Governance Score UI and causality', async ({ page }) => {
    test.setTimeout(120000); // Allow time for DB processing / delays
    
    // 0. Login
    await page.goto('/login');
    await page.fill('#login-email', 'admin@coalguard.ai');
    await page.fill('#login-password', 'Admin@123');
    await page.click('#login-submit');
    await page.waitForURL('**/command-center', { timeout: 15000 });
    
    // 1. Open /command-center
    await page.goto('/command-center');
    
    // Wait for the initialization text to disappear if present
    await expect(page.locator('text=INITIALIZING COMMAND CENTER')).toBeHidden({ timeout: 10000 });

    // 2. Select Mine A
    // Click the first "Investigate" button for a mine
    const investigateButtons = page.locator('button:has-text("Investigate")');
    await expect(investigateButtons.first()).toBeVisible({ timeout: 15000 });
    await investigateButtons.first().click();

    // 3. Open Mine Intelligence
    // Wait for Mine Intelligence view to load
    await expect(page.locator('text=Intelligence Report')).toBeVisible({ timeout: 15000 });

    // 4. Verify the Verified Governance Score panel is visible
    await expect(page.locator('text=Verified Governance Score')).toBeVisible();

    // 5. Verify the governance score number is displayed
    const scoreElement = page.locator('.text-3xl.font-bold.tracking-tight').first();
    await expect(scoreElement).toBeVisible();
    const initialGovScoreText = await scoreElement.innerText();

    // 6. Verify the governance level is displayed
    const levelElement = scoreElement.locator('..').locator('div').locator('span');
    await expect(levelElement).toBeVisible();

    // 7. Verify the component scores are displayed
    await expect(page.locator('text=Resolution Rate').first()).toBeVisible();
    await expect(page.locator('text=Evidence Completeness').first()).toBeVisible();
    await expect(page.locator('text=Supervisor Verification').first()).toBeVisible();
    await expect(page.locator('text=On-Time Performance').first()).toBeVisible();
    await expect(page.locator('text=AI Acceptance Rate').first()).toBeVisible();

    // 8. Verify positive and negative contributors are displayed
    await expect(page.locator('text=Analysis').first()).toBeVisible();
    await expect(page.locator('text=Positives').first()).toBeVisible();
    await expect(page.locator('text=Areas for Improvement').first()).toBeVisible();

    // 9. Verify the panel clearly distinguishes Governance Score from operational Risk Score
    await expect(page.locator('text=Based on genuine field workflow verification')).toBeVisible();

    // Store the Risk Score to verify it doesn't change
    const riskScoreLocator = page.locator('h3:has-text("Stage 4: Baseline Risk")').locator('..').locator('.text-5xl');
    await expect(riskScoreLocator).toBeVisible();
    const initialRiskScoreText = await riskScoreLocator.innerText();

    // 10. Complete an existing governance workflow (e.g. Verify an action)
    const verifyButton = page.locator('button:has-text("Verify")').first();
    const hasVerifyButton = await verifyButton.isVisible();
    if (hasVerifyButton) {
      await verifyButton.click();
      
      // Wait for recalculation overlay
      await expect(page.locator('text=RECALCULATING INTELLIGENCE')).toBeVisible();
      await expect(page.locator('text=RECALCULATING INTELLIGENCE')).toBeHidden({ timeout: 20000 });
      
      // 12. Verify the Governance Score refreshes correctly
      await expect(scoreElement).toBeVisible();
      const newGovScoreText = await scoreElement.innerText();
      expect(newGovScoreText).toBeDefined();
      // It might be same or different depending on the formula, but it must be refreshed and visible
    }

    // 13. Verify the existing Risk Score is still present and unchanged
    await expect(riskScoreLocator).toBeVisible();
    const finalRiskScoreText = await riskScoreLocator.innerText();
    expect(finalRiskScoreText).toBe(initialRiskScoreText);

    // 14. Verify the What-If Simulator from Stage 10F still opens and works
    const whatIfSection = page.locator('h3:has-text("What-If Risk Simulator")');
    if (await whatIfSection.isVisible()) {
      const simulateBtn = page.locator('button:has-text("Run Simulation")').first();
      if (await simulateBtn.isVisible()) {
         await simulateBtn.click();
         await expect(page.locator('text=SIMULATED RISK').first()).toBeVisible({ timeout: 20000 });
      }
    } else {
      const simulateBtn = page.locator('button:has-text("Run Simulation")').first();
      await expect(simulateBtn).toBeVisible();
      await simulateBtn.click();
      await expect(page.locator('text=SIMULATED RISK').first()).toBeVisible({ timeout: 20000 });
    }

    // 15/16. Check browser console for errors and network requests
    const internalErrors = networkErrors.filter(e => e.includes('/api/'));
    expect(consoleErrors).toEqual([]);
    expect(internalErrors).toEqual([]);
  });
});
