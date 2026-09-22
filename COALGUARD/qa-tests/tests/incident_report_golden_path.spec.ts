import { test, expect } from '@playwright/test';

test('Stage 10I: Public Incident Report to Command Center Closed-Loop Workflow', async ({ page }) => {
  // 1. Submit Public Incident Report
  await page.goto('http://localhost:5173/public-report');
  await expect(page.locator('text=CoalGuard Incident Reporting')).toBeVisible();
  
  // Fill out the form
  await page.fill('input[placeholder="e.g. TM-01"]', 'MINE-ALPHA');
  await page.selectOption('select:has-text("SAFETY")', 'EQUIPMENT');
  await page.selectOption('select:has-text("LOW")', 'CRITICAL');
  await page.fill('textarea[placeholder="Describe the incident in detail..."]', 'E2E TEST: The main ventilation fan in section 4 has completely failed.');
  
  // Click anonymous
  await page.click('text=Submit Anonymously');
  
  // Submit
  await page.click('button:has-text("Submit Incident Report")');
  
  // Verify success
  await expect(page.locator('text=Report Submitted Successfully')).toBeVisible();
  const reportIdElement = await page.locator('.select-all').first();
  const reportId = await reportIdElement.textContent();
  expect(reportId).toBeTruthy();

  // 2. Command Center - Manager Review
  await page.goto('http://localhost:5173/login');
  await page.fill('#login-email', 'admin@coalguard.ai');
  await page.fill('#login-password', 'Admin@123');
  await page.click('#login-submit');
  await page.waitForURL('**/command-center', { timeout: 15000 });
  
  // Select Gevra Mine from the Prioritized Mines table
  await page.click('tr:has-text("Gevra") >> text=Investigate');
  
  // Wait for intelligence view
  await expect(page.locator('text=Intelligence Report')).toBeVisible({ timeout: 10000 });
  
  // Check the Incident Reports Panel
  await expect(page.locator('text=Public/Worker Incident Reports')).toBeVisible();
  
  // Wait for incidents to load and find the row
  const incidentRow = page.locator('tr', { hasText: 'EQUIPMENT' }).first();
  await expect(incidentRow).toBeVisible({ timeout: 15000 });
  
  // Click to review (wait for animations to settle)
  await page.waitForTimeout(1000);
  await incidentRow.click({ force: true });
  
  // Verify details panel
  await expect(page.locator('h4:has-text("Review Incident")')).toBeVisible();
  await expect(page.locator('div.whitespace-pre-wrap', { hasText: 'E2E TEST: The main ventilation fan' })).toBeVisible();
  await expect(page.locator('text=Anonymous Reporter')).toBeVisible();
  
  // Check that it was escalated to Governance Workflow (because it was CRITICAL)
  await expect(page.locator('text=Escalated to Governance Workflow')).toBeVisible();

  // Mark as Under Review
  await page.click('button:has-text("Mark Under Review")');
  
  // Wait for status update in the main table since the panel closes
  await expect(page.locator('span:has-text("UNDER_REVIEW")').first()).toBeVisible({ timeout: 5000 });
  
  // 3. Existing Closed-Loop Workflow via Active Corrective Actions
  // The backend should have generated an Action for this critical incident.
  // Find the action in the Active Actions table. It should have title like "Incident Escalation: EQUIPMENT"
  const activeAction = page.locator('tr', { hasText: 'Incident Escalation: EQUIPMENT' }).first();
  await expect(activeAction).toBeVisible();
  
  // Wait for it to be ready (it might take a sec for the UI to update if polling, but we refreshed state on status update)
});
