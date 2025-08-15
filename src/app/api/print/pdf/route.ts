
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set a 60-second timeout for this function

export async function GET(req: NextRequest) {
  let browser: any;
  let page: any;
  const { searchParams, headers, nextUrl } = req;
  const isDebug = searchParams.get('debug') === '1' || (headers.get('Accept') || '').toLowerCase().includes('application/json');

  try {
    // 1. Construct the URL to the print page
    const origin = nextUrl.origin;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const printPath = `${basePath}/print/report`;
    
    const printUrl = new URL(printPath, origin);
    searchParams.forEach((value, key) => {
      // Forward all params, including 'debug' if present
      printUrl.searchParams.append(key, value);
    });
    
    if (!printUrl.toString()) {
      throw new Error('BAD_URL: The generated print URL is invalid.');
    }
    
    // 2. Dynamically import dependencies
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;
    
    // 3. Launch the browser
    let executablePath;
    try {
        executablePath = await chromium.executablePath();
    } catch (e) {
        throw new Error('LAUNCH_FAILED: Could not resolve Chromium executable path.');
    }
    
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    });
    page = await browser.newPage();

    // 4. Forward cookies
    const cookieHeader = headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookieStr => {
        const [name, ...rest] = cookieStr.trim().split('=');
        const value = rest.join('=');
        return { name, value, domain: printUrl.hostname, path: '/' };
      });
      await page.setCookie(...cookies);
    }
    
    // 5. Navigate and wait for readiness
    try {
        await page.goto(printUrl.toString(), { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (e: any) {
        throw new Error(`GOTO_FAILED: ${e.message}`);
    }
    
    try {
        await page.waitForFunction('window.READY === true', { timeout: 30000 });
    } catch (e: any) {
        throw new Error(`READINESS_TIMEOUT: The page readiness signal (window.READY) was not received in time.`);
    }

    // 6. Generate PDF or return debug info
    if (isDebug) {
        return NextResponse.json({ 
            ok: true, 
            phase: 'READY', 
            printUrl: printUrl.toString(), 
            note: 'PDF not produced in debug mode'
        });
    }

    await page.emulateMediaType('screen');
    let pdf;
    try {
        pdf = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
            format: 'A4',
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        });
    } catch(e: any) {
        throw new Error(`PDF_RENDER_FAILED: ${e.message}`);
    }

    // 7. Return PDF response
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ForecastReport.pdf"',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    const [code, ...messageParts] = error.message.split(': ');
    const message = messageParts.join(': ');
    const recognizedCode = ['LAUNCH_FAILED', 'GOTO_FAILED', 'READINESS_TIMEOUT', 'PDF_RENDER_FAILED', 'BAD_URL', 'IMPORT_FAILED'].includes(code) ? code : 'UNKNOWN_ERROR';
    
    console.warn(`[pdf:server]`, recognizedCode, message || error.message);
    
    if (isDebug) {
        return NextResponse.json(
            { ok: false, code: recognizedCode, message: message || error.message },
            { status: 500 }
        );
    }
    
    // For non-debug requests, return a generic error
    return NextResponse.json(
      { ok: false, error: 'An unknown error occurred during PDF generation.' },
      { status: 500 }
    );
  } finally {
    // 9. Cleanup
    if (page) await page.close();
    if (browser) await browser.close();
  }
}
