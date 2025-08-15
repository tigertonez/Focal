
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
    
    // This helper function encapsulates the complex launch logic
    const findAndLaunchChrome = async () => {
      const { stat } = await import('fs/promises');
      const puppeteerCore = (await import('puppeteer-core')).default;

      const getSafeLaunchOptions = (args: string[] = []) => {
          const safeArgs = [
              ...new Set([ // Deduplicate
                  ...args,
                  '--no-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-gpu',
                  '--single-process',
                  '--no-zygote',
              ]),
          ];
          return {
              args: safeArgs,
              headless: true,
              defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
          };
      };
      
      const attempts: { path: string, source: string, existed: boolean, error?: string }[] = [];
      let lastError: any = null;

      // --- Attempt 1: Sparticuz Chromium ---
      try {
        const sparticuz = (await import('@sparticuz/chromium')).default;
        const sparticuzPath = await sparticuz.executablePath().catch(() => null);
        if (sparticuzPath) {
            let browser: any = null;
            try {
                await stat(sparticuzPath);
                const options = { ...getSafeLaunchOptions(sparticuz.args), executablePath: sparticuzPath };
                browser = await puppeteerCore.launch(options);
                const version = await browser.version();
                await browser.close();
                return { ok: true, chosen: sparticuzPath, source: 'sparticuz', version };
            } catch (err: any) {
                lastError = err;
                attempts.push({ path: sparticuzPath, source: 'sparticuz', existed: true, error: String(err.message) });
                if (!/error while loading shared libraries|libnss|libx11|no such file or directory/i.test(String(err.message))) {
                    throw err; // Re-throw if it's not a shared library issue
                }
            } finally {
                try { await browser?.close(); } catch {}
            }
        }
      } catch (err: any) { lastError = err; }
      
      // --- Attempt 2: Environment Variable ---
      const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
      if (envPath) {
          let browser: any = null;
          try {
              await stat(envPath);
              const options = { ...getSafeLaunchOptions(), executablePath: envPath };
              browser = await puppeteerCore.launch(options);
              const version = await browser.version();
              await browser.close();
              return { ok: true, chosen: envPath, source: 'env', version };
          } catch (err: any) {
              lastError = err;
              attempts.push({ path: envPath, source: 'env', existed: true, error: String(err.message) });
          } finally {
               try { await browser?.close(); } catch {}
          }
      }
      
      // --- Attempt 3 & 4: Full Puppeteer (bundled or downloaded) ---
      try {
        const puppeteer = (await import('puppeteer')).default;
        
        // Attempt 3a: Bundled executable
        const bundledPath = puppeteer.executablePath();
        if (bundledPath) {
            let browser: any = null;
            try {
                await stat(bundledPath);
                const options = { ...getSafeLaunchOptions(), executablePath: bundledPath };
                browser = await puppeteerCore.launch(options);
                const version = await browser.version();
                await browser.close();
                return { ok: true, chosen: bundledPath, source: 'puppeteer', version };
            } catch (err: any) {
                lastError = err;
                attempts.push({ path: bundledPath, source: 'puppeteer', existed: true, error: String(err.message) });
            } finally {
                try { await browser?.close(); } catch {}
            }
        }

        // Attempt 3b: On-demand download (dev only)
        if (process.env.NODE_ENV === 'development') {
            let browser: any = null;
            try {
              const { BrowserFetcher } = await import('puppeteer');
              const fetcher = puppeteer.createBrowserFetcher({ path: '.next/puppeteer' });
              const revisionInfo = await fetcher.download(puppeteer.defaultBrowserRevision);
              if (revisionInfo?.executablePath) {
                  const options = { ...getSafeLaunchOptions(), executablePath: revisionInfo.executablePath };
                  browser = await puppeteerCore.launch(options);
                  const version = await browser.version();
                  await browser.close();
                  return { ok: true, chosen: revisionInfo.executablePath, source: 'download', version };
              }
            } catch (err: any) {
              lastError = err;
              attempts.push({ path: '.next/puppeteer', source: 'download', existed: false, error: String(err.message) });
            } finally {
               try { await browser?.close(); } catch {}
            }
        }
      } catch (err:any) { lastError = err; }
      
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
