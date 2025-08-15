
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set a 60-second timeout for this function

export async function GET(req: NextRequest) {
  let browser: any = null;
  let page: any = null;
  const { searchParams, headers, nextUrl } = req;
  
  const isDebug = searchParams.get('debug') === '1' || (headers.get('accept') || '').toLowerCase().includes('application/json');
  const step = searchParams.get('step') || '';
  const origin = nextUrl.origin;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  let printUrl;
  try {
      printUrl = new URL(`${basePath}/print/report`, origin);
      searchParams.forEach((value, key) => {
          printUrl.searchParams.append(key, value);
      });
  } catch (error: any) {
      console.warn('[pdf:server]', 'BAD_URL', error.message);
      if (isDebug) {
          return NextResponse.json({ ok: false, code: 'BAD_URL', message: 'Failed to construct a valid print URL' }, { status: 500 });
      }
      return NextResponse.json({ ok: false, error: 'An unknown error occurred during PDF generation.' }, { status: 500 });
  }

  if (isDebug && step === 'entry') {
      return NextResponse.json({ ok: true, phase: 'ENTRY', origin, basePath, printUrl: printUrl.toString() }, { status: 200 });
  }
  
  try {
    // 1. Dynamically import dependencies
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;
    
    if (isDebug && step === 'import') {
        return NextResponse.json({ ok: true, phase: 'IMPORTED' }, { status: 200 });
    }
    
    // 2. Launch the browser
    let executablePath;
    try {
        executablePath = await chromium.executablePath();
    } catch (e: any) {
        throw new Error(`LAUNCH_FAILED: Could not resolve Chromium executable path. ${e.message}`);
    }
    
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
    });
    page = await browser.newPage();
    
    if (isDebug && step === 'launch') {
        return NextResponse.json({ ok: true, phase: 'LAUNCHED' }, { status: 200 });
    }

    // 3. Forward cookies
    const cookieHeader = headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookieStr => {
        const [name, ...rest] = cookieStr.trim().split('=');
        const value = rest.join('=');
        return { name, value, domain: printUrl.hostname, path: '/' };
      });
      await page.setCookie(...cookies);
    }
    
    // 4. Navigate and wait for readiness
    try {
        await page.goto(printUrl.toString(), { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (e: any) {
        throw new Error(`GOTO_FAILED: ${e.message}`);
    }

    if (isDebug && step === 'goto') {
        return NextResponse.json({ ok: true, phase: 'GOTO_OK', printUrl: printUrl.toString() }, { status: 200 });
    }
    
    try {
        await page.waitForFunction('window.READY === true', { timeout: 30000 });
    } catch (e: any) {
        throw new Error(`READINESS_TIMEOUT: The page readiness signal (window.READY) was not received in time.`);
    }

    // 5. If debug, return success JSON; otherwise, generate PDF
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

    // 6. Return PDF response
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
    const recognizedCodes = ['LAUNCH_FAILED', 'GOTO_FAILED', 'READINESS_TIMEOUT', 'PDF_RENDER_FAILED', 'BAD_URL', 'IMPORT_FAILED'];
    const errorCode = recognizedCodes.find(c => c === code) || 'UNKNOWN_ERROR';
    
    console.warn(`[pdf:server]`, errorCode, message || error.message);
    
    if (isDebug) {
        return NextResponse.json(
            { ok: false, code: errorCode, message: message || error.message },
            { status: 500 }
        );
    }
    
    return NextResponse.json(
      { ok: false, error: 'An unknown error occurred during PDF generation.' },
      { status: 500 }
    );
  } finally {
    // 7. Cleanup
    if (page) {
      try { await page.close(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
