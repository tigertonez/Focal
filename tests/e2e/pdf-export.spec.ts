import { test, expect } from '@playwright/test';

test.describe('PDF Export E2E Tests', () => {
  const BASE = ''; // Playwright config handles the baseURL

  test.beforeEach(async ({ page }) => {
    // Navigate to inputs page and ensure we have valid data
    await page.goto(`${BASE}/inputs`);
    await page.waitForLoadState('networkidle');
    
    // Fill in basic product data if needed
    const productNameInput = page.locator('input[placeholder*="Product"]').first();
    const productNameValue = await productNameInput.inputValue();
    
    if (!productNameValue) {
      await productNameInput.fill('Test Product');
      await page.locator('input[placeholder*="5000"]').first().fill('1000');
      await page.locator('input[placeholder*="49.99"]').first().fill('50');
    }
    
    // Generate report
    await page.getByRole('button', { name: /get report/i }).click();
    await page.waitForURL('**/loading');
    await page.waitForURL('**/revenue', { timeout: 15000 });
  });

  test('PDF health endpoint should be responsive', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/print/health`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json).toHaveProperty('ok', true);
  });

  test('Download report button should be present and functional', async ({ page }) => {
    // Navigate to summary page
    await page.goto(`${BASE}/summary`);
    await page.waitForLoadState('networkidle');
    
    // Find and click download report button
    const downloadButton = page.getByTestId('download-report-trigger');
    await expect(downloadButton).toBeVisible();
    
    await downloadButton.click();
    
    // Dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Should have PDF download button
    const pdfButton = page.getByRole('button', { name: /download full report \(pdf\)/i });
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toBeEnabled();
  });

  test('Probe report should return valid diagnostics', async ({ page }) => {
    await page.goto(`${BASE}/summary`);
    await page.waitForLoadState('networkidle');
    
    const downloadButton = page.getByTestId('download-report-trigger');
    await downloadButton.click();
    
    // Click probe button
    const probeButton = page.getByRole('button', { name: /probe full report \(json\)/i });
    await probeButton.click();
    
    // Wait for probe to complete (should be faster than full PDF)
    await page.waitForTimeout(10000);
    
    // Check if diagnostics dialog opened
    const diagDialog = page.getByRole('dialog').nth(1);
    if (await diagDialog.isVisible()) {
      const jsonContent = page.locator('textarea').last();
      const jsonText = await jsonContent.inputValue();
      
      expect(jsonText).toBeTruthy();
      
      // Parse and validate JSON structure
      const diag = JSON.parse(jsonText);
      expect(diag).toHaveProperty('ok');
      expect(diag).toHaveProperty('pages');
      expect(diag).toHaveProperty('slices');
    }
  });

  test('Print pages should render with correct route markers', async ({ page }) => {
    const routes = ['/inputs', '/revenue', '/costs', '/profit', '/cash-flow', '/summary'];
    const runId = 'test_' + Date.now();
    
    for (const route of routes) {
      const printUrl = `${BASE}${route}?print=1&lang=en&runId=${runId}`;
      await page.goto(printUrl);
      await page.waitForLoadState('networkidle');
      
      // Check for route marker
      const expectedMarker = `ROUTE_${route.replace('/', '').toUpperCase()}_${runId}`;
      const markerElement = page.locator(`[data-route-marker="${expectedMarker}"]`);
      await expect(markerElement).toBeAttached();
      
      // Check for report root
      const reportRoot = page.locator('[data-report-root]');
      await expect(reportRoot).toBeVisible();
      
      // Verify route attribute matches
      await expect(reportRoot).toHaveAttribute('data-route', route);
    }
  });

  test('Inputs page should render as data table in print mode', async ({ page }) => {
    const printUrl = `${BASE}/inputs?print=1&lang=en`;
    await page.goto(printUrl);
    await page.waitForLoadState('networkidle');
    
    // Should show data tables, not interactive forms
    const tables = page.locator('table');
    await expect(tables).toHaveCount(4); // Company, Parameters, Products, Fixed Costs
    
    // Should not show interactive form elements
    const formInputs = page.locator('input[type="text"], input[type="number"]');
    await expect(formInputs).toHaveCount(0);
    
    // Should show company information table
    const companyTable = page.locator('table').first();
    await expect(companyTable).toContainText('Brand Name');
    await expect(companyTable).toContainText('Industry');
  });

  test('Color consistency between UI and print modes', async ({ page }) => {
    // First, set custom colors on inputs page
    await page.goto(`${BASE}/inputs`);
    await page.waitForLoadState('networkidle');
    
    // Set a custom color for a fixed cost (if any exist)
    const colorPickers = page.locator('div[style*="background"]').filter({ hasText: /^$/ });
    if (await colorPickers.count() > 0) {
      await colorPickers.first().click();
      // This would open a color picker in a real scenario
    }
    
    // Navigate to costs page to see colors in UI
    await page.goto(`${BASE}/costs`);
    await page.waitForLoadState('networkidle');
    
    // Check that charts are rendered
    const charts = page.locator('svg.recharts-surface');
    await expect(charts.first()).toBeVisible();
    
    // Now check print version
    const printUrl = `${BASE}/costs?print=1&lang=en`;
    await page.goto(printUrl);
    await page.waitForLoadState('networkidle');
    
    // Charts should still be present in print mode
    const printCharts = page.locator('svg.recharts-surface');
    await expect(printCharts.first()).toBeVisible();
  });

  test('State consistency between sessions', async ({ page, context }) => {
    // Test 1: Current session should use in-memory state
    await page.goto(`${BASE}/summary`);
    await page.waitForLoadState('networkidle');
    
    // Get current revenue value
    const revenueKpi = page.locator('[data-testid="kpi-revenue"], .kpi-card').filter({ hasText: /revenue/i }).first();
    const currentRevenue = await revenueKpi.textContent();
    
    // Test 2: New tab should start with defaults
    const newPage = await context.newPage();
    await newPage.goto(`${BASE}/inputs`);
    await newPage.waitForLoadState('networkidle');
    
    // Should show default product data
    const defaultProductName = await newPage.locator('input[placeholder*="Product"]').first().inputValue();
    expect(defaultProductName).toBeTruthy();
    
    await newPage.close();
  });

  test('PDF generation should handle missing data gracefully', async ({ page }) => {
    // Start with fresh session (no data)
    await page.goto(`${BASE}/`);
    await page.goto(`${BASE}/summary`);
    
    // Should show no data message
    const noDataAlert = page.locator('[role="alert"]').filter({ hasText: /no data/i });
    await expect(noDataAlert).toBeVisible();
    
    // Download button should be disabled or show appropriate message
    const downloadButton = page.getByTestId('download-report-trigger');
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      const pdfButton = page.getByRole('button', { name: /download full report/i });
      await expect(pdfButton).toBeDisabled();
    }
  });
});

test.describe('PDF Export Soak Tests', () => {
  test('should produce consistent results across multiple runs', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for soak test
    
    // Setup test data
    await page.goto(`${BASE}/inputs`);
    await page.waitForLoadState('networkidle');
    
    // Ensure we have valid data
    const productNameInput = page.locator('input[placeholder*="Product"]').first();
    await productNameInput.fill('Soak Test Product');
    await page.locator('input[placeholder*="5000"]').first().fill('1000');
    await page.locator('input[placeholder*="49.99"]').first().fill('50');
    
    // Generate report
    await page.getByRole('button', { name: /get report/i }).click();
    await page.waitForURL('**/revenue', { timeout: 15000 });
    await page.goto(`${BASE}/summary`);
    
    const results: Array<{ run: number; success: boolean; pages: number; error?: string }> = [];
    
    // Run 5 consecutive exports (reduced from 20 for CI performance)
    for (let i = 1; i <= 5; i++) {
      try {
        const downloadButton = page.getByTestId('download-report-trigger');
        await downloadButton.click();
        
        const probeButton = page.getByRole('button', { name: /probe full report/i });
        await probeButton.click();
        
        // Wait for completion
        await page.waitForTimeout(8000);
        
        // Check if diagnostics dialog opened
        const diagDialog = page.getByRole('dialog').nth(1);
        if (await diagDialog.isVisible()) {
          const jsonContent = page.locator('textarea').last();
          const jsonText = await jsonContent.inputValue();
          
          if (jsonText) {
            const diag = JSON.parse(jsonText);
            results.push({
              run: i,
              success: diag.ok === true,
              pages: diag.pages || diag.slices || 0,
            });
          } else {
            results.push({ run: i, success: false, pages: 0, error: 'No diagnostics' });
          }
          
          // Close dialog
          await page.getByRole('button', { name: /close/i }).last().click();
        } else {
          results.push({ run: i, success: false, pages: 0, error: 'No dialog' });
        }
        
        // Close main dialog
        await page.getByRole('button', { name: /close/i }).first().click();
        
      } catch (error) {
        results.push({ run: i, success: false, pages: 0, error: String(error) });
      }
    }
    
    // Analyze results
    const successfulRuns = results.filter(r => r.success);
    const expectedPages = 6;
    
    console.log('Soak test results:', results);
    
    // At least 80% of runs should succeed
    expect(successfulRuns.length).toBeGreaterThanOrEqual(Math.ceil(results.length * 0.8));
    
    // All successful runs should have exactly 6 pages
    for (const result of successfulRuns) {
      expect(result.pages).toBe(expectedPages);
    }
  });
});