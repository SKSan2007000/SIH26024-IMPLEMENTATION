import { test, expect } from '@playwright/test';

test.describe('Stage 10H: Evidence Intelligence Integration', () => {
  test('Analyze Evidence in Supervisor Review Panel', async ({ page }) => {
    // 0. Login
    await page.goto('/login');
    await page.fill('#login-email', 'admin@coalguard.ai');
    await page.fill('#login-password', 'Admin@123');
    await page.click('#login-submit');
    await page.waitForURL('**/command-center', { timeout: 15000 });

    // 1. Navigate to Governance Action Center
    await page.goto('/governance');
    await page.waitForSelector('text=Governance Action Center');

    // 2. We need an action in IN_REVIEW state, but first we might need to create it.
    // Let's assume the test database has some recommendations we can accept.
    // Let's find an "Accept & Assign" button to create an action.
    const acceptButtons = page.locator('button:has-text("Accept & Assign")');
    if (await acceptButtons.count() > 0) {
      await acceptButtons.first().click();
      await page.waitForTimeout(1000); // Wait for recalculation
    }

    // 3. Find an OPEN action and Start Progress
    const startProgressButtons = page.locator('button:has-text("Start Progress")');
    if (await startProgressButtons.count() > 0) {
      await startProgressButtons.first().click();
      await page.waitForTimeout(1000);
    }

    // 4. Submit Evidence (Requires IN_PROGRESS action)
    // First, upload a fake image
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
        // Create a fake image buffer
        const buffer = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64'
        );
        
        await fileInput.setInputFiles({
          name: 'fake.png',
          mimeType: 'image/png',
          buffer
        });
        
        await page.click('button:has-text("Demo GPS")');
        await page.click('button:has-text("Submit Evidence")');
        
        // Wait for evidence to upload and appear
        await page.waitForSelector('text=Submitted Evidence');

        // Submit for review
        await page.click('button:has-text("Submit for Review")');
        await page.waitForTimeout(1000);
    }

    // 5. Action is now IN_REVIEW. We should see the Supervisor Review panel.
    await page.waitForSelector('text=Supervisor Review');
    await page.waitForSelector('text=AI Assisted');

    // 6. Click Analyze Evidence
    const analyzeButton = page.locator('button:has-text("Analyze Evidence")');
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // 7. Verify analysis results appear
    await expect(page.locator('text=DEMO ANALYZER')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=AI Confidence:')).toBeVisible();
    await expect(page.locator('text=Relevance:')).toBeVisible();
    await expect(page.locator('text=Evidence Quality:')).toBeVisible();
    await expect(page.locator('text=Analysis Summary:')).toBeVisible();

    // 8. Verify the verify button still works
    const verifyButton = page.locator('button:has-text("Verify & Complete Action")');
    await expect(verifyButton).toBeVisible();
  });
});
