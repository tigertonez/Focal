
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Parse URL defensively
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return NextResponse.json({ ok: false, code: 'BAD_URL', message: 'invalid request.url' }, { status: 500 });
  }

  const accept = (request.headers.get('accept') || '').toLowerCase();
  const isDebug = url.searchParams.get('debug') === '1' || accept.includes('application/json');
  const step = url.searchParams.get('step') || 'entry';

  // Build origin/basePath/printUrl without throwing
  const origin = `${url.protocol}//${url.host}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const printUrl = origin + normalizedBase + '/print/report' + (url.search ? url.search : '');

  // EARLY DEBUG EXIT for entry point check
  if (isDebug && step === 'entry') {
    return NextResponse.json(
        { ok: true, phase: 'ENTRY', origin, basePath, printUrl, note: 'PDF stub route active' },
        { status: 200 }
    );
  }

  // Handle 'import' step
  if (isDebug && step === 'import') {
    try {
      const chromiumMod = await import('@sparticuz/chromium');
      const puppeteerMod = await import('puppeteer-core');
      const chromium = (chromiumMod as any).default ?? chromiumMod;
      const puppeteer = (puppeteerMod as any).default ?? puppeteerMod;

      const execPath = await chromium.executablePath().catch(() => null);
      const hasArgs = Array.isArray(chromium.args);
      const hasPuppeteer = !!puppeteer?.launch;

      return NextResponse.json({
        ok: true,
        phase: 'IMPORTED',
        chromium: { hasArgs, execPath: !!execPath },
        puppeteer: { available: hasPuppeteer },
      }, { status: 200 });

    } catch (err: any) {
      return NextResponse.json({
        ok: false,
        code: 'IMPORT_FAILED',
        message: String(err?.message || err),
      }, { status: 500 });
    }
  }

  // Handle 'launch' step with robust fallback logic
  if (isDebug && step === 'launch') {
    const findAndLaunchChrome = async () => {
      const { stat } = await import('fs/promises');
      const { default: puppeteer } = await import('puppeteer-core');
      const { default: sparticuz } = await import('@sparticuz/chromium');
      
      const candidates = [
        { path: await sparticuz.executablePath().catch(() => null), source: 'sparticuz', args: sparticuz.args },
        { path: process.env.PUPPETEER_EXECUTABLE_PATH, source: 'env', args: [] },
        { path: '/usr/bin/google-chrome-stable', source: 'system', args: [] },
        { path: '/usr/bin/google-chrome', source: 'system', args: [] },
        { path: '/usr/bin/chromium-browser', source: 'system', args: [] },
        { path: '/usr/bin/chromium', source: 'system', args: [] },
      ];

      const attempts: { path: string, existed: boolean, error?: string }[] = [];
      let lastError: any = null;

      for (const candidate of candidates) {
        if (!candidate.path) continue;
        
        let browser: any = null;
        let fileExists = false;
        try {
          await stat(candidate.path);
          fileExists = true;
        } catch {
          attempts.push({ path: candidate.path, existed: false, error: 'File not found' });
          continue;
        }

        try {
          const launchArgs = Array.from(new Set([
            ...(candidate.args || []),
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
          ]));

          browser = await puppeteer.launch({
            executablePath: candidate.path,
            args: launchArgs,
            headless: true,
            defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
          });
          
          const page = await browser.newPage();
          await page.close();
          const version = await browser.version();
          
          return { ok: true, chosen: candidate.path, source: candidate.source, version };
        } catch (err: any) {
          const errorMessage = String(err.message || err);
          lastError = err;
          attempts.push({ path: candidate.path, existed: true, error: errorMessage });
          
          const isSharedLibError = /error while loading shared libraries|libnss|libx11|no such file or directory/i.test(errorMessage);
          if (isSharedLibError) {
             continue; // Try next candidate
          }
          // For other errors, we could also decide to stop, but for diagnosis, we try all.
        } finally {
            try { await browser?.close(); } catch {}
        }
      }
      // If loop finishes without success
      return { ok: false, error: lastError, attempts };
    };
    
    const result = await findAndLaunchChrome();

    if (result.ok) {
        return NextResponse.json({
            ok: true,
            phase: 'LAUNCHED',
            executablePath: result.chosen,
            source: result.source,
            version: result.version,
        }, { status: 200 });
    } else {
        return NextResponse.json({
            ok: false,
            code: 'LAUNCH_FAILED',
            message: result.error ? String(result.error.message || result.error) : 'All launch attempts failed.',
            attempts: result.attempts,
        }, { status: 500 });
    }
  }
  
  // For other debug steps, continue returning a stub
  if (isDebug) {
      return NextResponse.json(
          { ok:true, phase: 'STUB_CONTINUE', note: `Debug step '${step}' is not fully implemented yet.` }, 
          { status: 200 }
      );
  }

  // NON-DEBUG path: return a simple JSON so we can verify routing works
  return NextResponse.json(
    { ok: true, phase: 'STUB', note: 'PDF generation temporarily stubbed for diagnosis' },
    { status: 200 }
  );
}
