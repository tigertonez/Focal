
import { test, expect } from '@playwright/test';

test.describe('PDF Generation E2E Tests', () => {
  const BASE = ''; // Playwright config handles the baseURL

  test('Health endpoint should be responsive', async ({ page }) => {
    test.setTimeout(15000);
    const response = await page.goto(`${BASE}/api/print/health`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json).toHaveProperty('ok', true);
  });

  test('Print report page should render correctly', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto(`${BASE}/print/report`);
    const reportContent = page.locator('#report-content[data-ssr-key="v1"]');
    await expect(reportContent).toBeVisible({ timeout: 10000 });
  });

  test('PDF generation endpoint should return a PDF file', async ({ request }) => {
    test.setTimeout(60000); // Give this test a longer timeout for PDF generation
    const response = await request.get(`${BASE}/api/print/pdf?title=Test&locale=en`);
    
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
  });
});
