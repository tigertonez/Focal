
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

  // DEBUG path: handle different steps
  if (isDebug) {
    if (step === 'entry') {
        return NextResponse.json(
            { ok: true, phase: 'ENTRY', origin, basePath, printUrl, note: 'PDF stub route active' },
            { status: 200 }
        );
    }
    
    if (step === 'import') {
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
    
    // For other debug steps, continue returning a stub
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
