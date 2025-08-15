
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set a 60-second timeout for this function

export async function GET(req: NextRequest) {
  let browser;
  let page;

  try {
    // 1. Construct the URL to the print page, respecting basePath and forwarding query params
    const { searchParams, nextUrl } = req;
    const origin = nextUrl.origin;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const printPath = `${basePath}/print/report`;
    
    // Construct the final URL with query parameters
    const printUrl = new URL(printPath, origin);
    searchParams.forEach((value, key) => {
      printUrl.searchParams.append(key, value);
    });
    
    // 2. Launch the browser using the optimized Chromium package
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true, // Use the new headless mode
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    });
    page = await browser.newPage();

    // 3. Forward cookies from the original request to the headless browser
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookieStr => {
        const [name, ...rest] = cookieStr.trim().split('=');
        const value = rest.join('=');
        return { name, value, domain: printUrl.hostname, path: '/' };
      });
      await page.setCookie(...cookies);
    }
    
    // 4. Navigate to the page and wait for it to be fully ready
    await page.goto(printUrl.toString(), { waitUntil: 'networkidle0', timeout: 60000 });
    
    // 5. Wait for the custom readiness signal from the inline script
    await page.waitForFunction('window.READY === true', { timeout: 30000 });

    // 6. Generate the PDF from the rendered page
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // Use @page CSS for size and margins
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    // 7. Return the PDF as a response with appropriate headers
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ForecastReport.pdf"',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    // 8. On error, return a structured JSON response
    return NextResponse.json(
      { ok: false, error: error.message || 'An unknown error occurred during PDF generation.' },
      { status: 500 }
    );
  } finally {
    // 9. Ensure browser and page are always closed
    if (page) await page.close();
    if (browser) await browser.close();
  }
}
