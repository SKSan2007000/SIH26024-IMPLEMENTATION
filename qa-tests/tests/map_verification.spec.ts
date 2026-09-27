import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Verify Governance Command Center Map', async ({ page }) => {
  // 1. Go to Login page
  await page.goto('/login');
  
  // 2. Fill login form
  await page.fill('#login-email', 'admin@coalguard.local');
  await page.fill('#login-password', 'admin123');
  await page.click('#login-submit');

  // 3. Wait for Command Center
  await page.waitForURL('**/command-center', { timeout: 15000 });
  await expect(page.locator('text=Command Center').first()).toBeVisible({ timeout: 10000 });

  // 4. Verify Map Container
  const mapContainer = page.locator('.leaflet-container');
  await expect(mapContainer).toBeVisible({ timeout: 10000 });

  // 5. Verify OSM tile layer is loaded and NO Carto / API key error text exists
  const pageContent = await page.content();
  expect(pageContent).not.toContain('API KEY REQUIRED');
  expect(pageContent).not.toContain('carto.com/basemaps/api-key');

  // 6. Verify tile images from OpenStreetMap
  const tiles = page.locator('.leaflet-tile-pane img.leaflet-tile');
  await expect(tiles.first()).toBeVisible({ timeout: 10000 });
  const tileSrc = await tiles.first().getAttribute('src');
  console.log('Sample tile src:', tileSrc);
  expect(tileSrc).toContain('tile.openstreetmap.org');

  // 7. Verify 5 mine markers are present and visible
  const markers = page.locator('path.leaflet-interactive');
  const count = await markers.count();
  console.log(`Found ${count} map markers`);
  expect(count).toBe(5);

  // 8. Click a marker and verify popup content and action button
  await markers.first().click({ force: true });
  await expect(page.locator('.leaflet-popup-content')).toBeVisible({ timeout: 5000 });
  
  const popupText = await page.locator('.leaflet-popup-content').innerText();
  console.log('Popup text:', popupText);
  expect(popupText.toUpperCase()).toContain('BASELINE');
  expect(popupText).toContain('View Mine Intelligence');

  // 9. Wait for map pan animation to settle and take screenshots
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, '../screenshots/map_fixed.png') });
  console.log('Verification completed successfully!');
});
