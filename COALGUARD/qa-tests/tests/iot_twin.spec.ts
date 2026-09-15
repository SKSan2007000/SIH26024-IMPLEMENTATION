import { test, expect } from '@playwright/test';

test('Stage 10I: IoT Twin Golden Path', async ({ page }) => {
  // 1. Login and Navigate to Command Center
  await page.goto('http://localhost:5173/login');
  await page.fill('#login-email', 'admin@coalguard.ai');
  await page.fill('#login-password', 'Admin@123');
  await page.click('#login-submit');
  await page.waitForURL('**/command-center', { timeout: 15000 });

  // Select Gevra Mine from the Prioritized Mines table
  await page.click('tr:has-text("Gevra") >> text=Investigate');

  // Wait for intelligence view
  await expect(page.locator('text=Intelligence Report')).toBeVisible({ timeout: 10000 });

  // Verify 3D Digital Twin is present
  await expect(page.locator('text=IoT Sensor Inspector')).toBeVisible();

  // Open Demo Controls
  await page.click('button:has-text("Demo Controls")');

  // Test Simulation buttons
  await expect(page.locator('text=Methane Leak')).toBeVisible();

  // Simulate
  await page.click('button:has-text("Methane Leak")');

  // Wait for the UI to fetch new data after simulation
  await page.waitForTimeout(2000); // Wait for the loading state to finish

  // Verify that an action might have been triggered or the twin renders normally
});
