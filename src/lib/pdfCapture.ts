// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';

const CAPTURE_WIDTH_PX = 1280;
const A4_ASPECT_RATIO = 8.27 / 11.69;
const MIN_KB_OK = 50;
const ROUTES: Route[] = ['/inputs','/revenue','/costs','/profit','/cash-flow','/summary'] as const;
const LKG: Map<Route, ImageSlice> = ((window as any).__PDF_LKG__ ||= new Map<Route, ImageSlice>());


export type Route = '/inputs'|'/revenue'|'/costs'|'/profit'|'/cash-flow'|'/summary';
export type ImageSlice = {
  imageBase64: string; wPx: number; hPx: number;
  routeName: Route; pageIndex: number; md5: string;
};

type Diag = {
  runId: string; startTs: string; routes: any[];
  totals: { slices: number; kb: number };
  guarantee: { before: number; after: number; missingBefore: string[]; placeholdersAdded: string[] };
  visibility: { pauses: number; pausedMs: number };
  invariants: { dupesFound: number, dupesStillPresent: Route[] };
  md5ByRoute: Record<Route, string | null>;
};

const rawFromDataUrl = (url:string)=> {
  if (!url) return '';
  const i = url.indexOf('base64,'); if (i < 0) return '';
  return url.slice(i+7);
};

// --- Visibility guard (pause export while tab is hidden) ---
function onVisible(topDoc: Document = document) {
  return new Promise<void>((res) => {
    const handler = () => {
      if (topDoc.visibilityState === 'visible') {
        topDoc.removeEventListener('visibilitychange', handler);
        res();
      }
    };
    topDoc.addEventListener('visibilitychange', handler);
  });
}

async function waitTabVisible(topDoc: Document = document, onStatus?: (s: string)=>void) {
  if (topDoc.visibilityState === 'visible') return;
  onStatus?.('Paused — tab is in background. Please return to this tab to continue…');
  await onVisible(topDoc);
  onStatus?.('Resumed — continuing export.');
}

async function waitIframeLoad(iframe: HTMLIFrameElement) {
  return new Promise<void>(res => {
    const t = setTimeout(() => { console.warn('Iframe load timeout'); res(); }, 8000);
    iframe.onload = () => { clearTimeout(t); res(); };
    iframe.onerror = () => { clearTimeout(t); res(); };
  });
}

function createIsolatedFrame(routeUrl: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-20000px';
  iframe.style.top = '0px';
  iframe.width = `${CAPTURE_WIDTH_PX + 40}`;
  iframe.height = '4000';
  document.body.appendChild(iframe);

  const t0 = performance.now();
  iframe.src = routeUrl;

  return {
    iframe,
    async ready() {
      await waitIframeLoad(iframe);
      return {
        win: iframe.contentWindow!,
        doc: iframe.contentDocument || iframe.contentWindow!.document,
        tLoadMs: Math.round(performance.now() - t0),
      };
    },
    cleanup() { try { iframe.remove(); } catch {} },
  };
}

function injectPrintCSS(doc: Document) {
  const style = doc.createElement('style');
  style.textContent = `
    html, body { width:${CAPTURE_WIDTH_PX}px !important; margin:0 auto !important; background:#fff !important; }
    [data-report-root] { width:${CAPTURE_WIDTH_PX}px !important; margin:0 auto !important; }
    .container { max-width: 100% !important; }
    [data-no-print="true"] { display: none !important; }
    .pdf-freeze, .pdf-freeze * { animation: none !important; transition: none !important; }
    .pdf-freeze, .pdf-freeze * { transform: none !important; will-change: auto !important; }
    .recharts-wrapper, .recharts-responsive-container, .recharts-surface { transform: none !important; }
    [data-ai-insight], [data-ai-report], .ai-insights, .ai-insight, #ai-insights, #get-strategic-analysis, [data-print-hide="ai"], .strategic-cta {
      display: none !important; visibility: hidden !important;
    }
  `;
  doc.head.appendChild(style);
}

async function waitForReportRoot(win: Window, { timeoutMs = 6000 } = {}): Promise<HTMLElement> {
    const doc = win.document;
    const t0 = performance.now();
    while (performance.now() - t0 < timeoutMs) {
        const el = doc.querySelector<HTMLElement>('[data-report-root]');
        if (el) return el;
        await new Promise(r => requestAnimationFrame(r));
    }
    throw new Error('REPORT_ROOT_NOT_FOUND');
}


function createPlaceholder(route: Route): ImageSlice {
    const w = CAPTURE_WIDTH_PX;
    const h = Math.round(w / A4_ASPECT_RATIO);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.font = '24px Arial'; ctx.fillStyle = '#666666'; ctx.textAlign = 'center';
    ctx.fillText(`${route}`, w / 2, h / 2 - 20);
    ctx.font = '16px Arial'; ctx.fillStyle = '#999999';
    ctx.fillText(`Placeholder generated on: ${new Date().toISOString()}`, w / 2, h / 2 + 20);
    const raw = rawFromDataUrl(canvas.toDataURL('image/png'));
    return {
        imageBase64: raw, wPx: w, hPx: h,
        routeName: route, pageIndex: 0, md5: Md5.hashStr(raw),
    };
}

async function isImageMostlyBlank(dataUrl: string): Promise<boolean> {
  if (!dataUrl) return true;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve(false); return; }
        ctx.drawImage(img, 0, 0);

        let blank = 0, samples = 20;
        for (let i = 0; i < samples; i++) {
          const x = (Math.random() * img.width) | 0;
          const y = (Math.random() * img.height) | 0;
          const p = ctx.getImageData(x, y, 1, 1).data;
          const white = (p[0] > 250 && p[1] > 250 && p[2] > 250);
          const transparent = (p[3] < 10);
          if (white || transparent) blank++;
        }
        resolve(blank / samples > 0.95);
      } catch { resolve(true); }
    };
    img.onerror = () => resolve(true);
    img.src = dataUrl;
  });
}

export async function captureFullReport({ lang = 'en', onLog, onProgress, onStatus }: { lang: 'en' | 'de', onLog?: (msg: string) => void, onProgress?: (p: number) => void, onStatus?: (s: string)=>void }) {
    const diag: Diag = {
      runId: 'run_' + Math.random().toString(36).substr(2, 9),
      startTs: new Date().toISOString(),
      routes: [],
      totals: { slices: 0, kb: 0 },
      guarantee: { before: 0, after: 0, missingBefore: [], placeholdersAdded: [] },
      visibility: { pauses: 0, pausedMs: 0 },
      invariants: { dupesFound: 0, dupesStillPresent: [] },
      md5ByRoute: {} as Record<Route, string | null>,
    };

    onStatus?.('Beta: PDF export currently ignores AI insights. Keep this tab visible until done.');

    const byRoute: Partial<Record<Route, ImageSlice>> = {};
    const paused = { ms: 0, cnt: 0, t0: 0 };
    
    async function ensureVisiblePoint() {
      if (document.visibilityState === 'hidden') {
        paused.cnt += 1; paused.t0 = performance.now();
        await waitTabVisible(document, onStatus);
        paused.ms += (performance.now() - paused.t0);
        paused.t0 = 0;
      }
    }

    async function captureSingleRoute(route: Route, attemptNum = 1): Promise<ImageSlice | null> {
      await ensureVisiblePoint();
      onStatus?.(`Exporting ${route} — attempt ${attemptNum}`);
      const routeDiag: any = { route, attempt: attemptNum, capture: {} };
      
      const frame = createIsolatedFrame(`${route}?print=1&lang=${lang}&ts=${Date.now()}`);
      let win: Window, doc: Document;

      try {
        const readyState = await frame.ready();
        win = readyState.win;
        doc = readyState.doc;
        routeDiag.iframeLoadMs = readyState.tLoadMs;
        routeDiag.url = win.location.href;

        // Route Identity Gate
        let pathOk = false;
        let markerFound = false;
        for (let k = 0; k < 10; k++) {
            const currentPath = (() => { try { return new URL(win.location.href).pathname; } catch { return ''; } })();
            markerFound = !!doc.querySelector(`[data-route="${route}"]`);
            if (currentPath.endsWith(route) && markerFound) {
                pathOk = true;
                break;
            }
            await new Promise(r => setTimeout(r, 120));
        }
        routeDiag.routeIdentity = { want: route, landed: new URL(win.location.href).pathname, ok: pathOk, markerFound };
        if (!pathOk) {
            throw new Error(`ROUTE_IDENTITY_MISMATCH: Wanted ${route}, but landed on ${win.location.href}`);
        }
        
        injectPrintCSS(doc);
        const aiSelectors = '[data-ai-insight], [data-ai-report], .ai-insights, .ai-insight, #ai-insights, #get-strategic-analysis, [data-print-hide="ai"], .strategic-cta';
        const aiNodes = doc.querySelectorAll(aiSelectors);
        aiNodes.forEach(n => n.remove());
        routeDiag.aiHidden = aiNodes.length;

        // Readiness Checks
        await doc.fonts?.ready.catch(()=>{});
        window.dispatchEvent(new Event('resize'));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        window.dispatchEvent(new Event('resize'));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 120));

        const root = await waitForReportRoot(win);
        routeDiag.bodyH = Math.max(root.getBoundingClientRect().height, (root as any).scrollHeight || 0);
        routeDiag.innerTextLen = (root.innerText || '').trim().length;

        // Capture logic
        let dataUrl = '';
        let method = '';
        let isSuspicious = true;
        const forceFallback = attemptNum === 99; // Special flag for de-dupe

        const tryPrimary = async () => {
          method = 'html-to-image';
          dataUrl = await toPng(root, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
          isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
          return !isSuspicious;
        };
        const tryFallback = async () => {
          method = 'html2canvas';
          const localH2C = (win as any).html2canvas || html2canvas;
          const canvas = await localH2C(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          dataUrl = canvas.toDataURL('image/png');
          routeDiag.fallbackRealm = 'iframe';
          isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
          return !isSuspicious;
        };

        if (forceFallback) {
          await tryFallback();
        } else {
          if (!(await tryPrimary())) {
            routeDiag.suspiciousPrimary = true;
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            await new Promise(r => setTimeout(r, 80));
            if (!(await tryPrimary())) await tryFallback();
          }
        }
        
        if (!isSuspicious) {
          const finalRaw = rawFromDataUrl(dataUrl);
          return { imageBase64: finalRaw, wPx: CAPTURE_WIDTH_PX, hPx: Math.round(CAPTURE_WIDTH_PX / A4_ASPECT_RATIO), routeName: route, pageIndex: 0, md5: Md5.hashStr(finalRaw) };
        }
        return null;

      } catch (e: any) {
        routeDiag.capture.error = e.message;
        return null;
      } finally {
        diag.routes.push(routeDiag);
        frame.cleanup();
      }
    }

    // --- Main Capture Loop ---
    for (const [i, route] of ROUTES.entries()) {
        const slice = await captureSingleRoute(route);
        if (slice) { byRoute[route] = slice; }
        onProgress?.((i + 1) / ROUTES.length);
    }
    
    // --- Post-Pass 1: Duplicate-across-routes check ---
    const md5Map = new Map<string, Route[]>();
    for (const r of ROUTES) {
        if (byRoute[r]) {
            const list = md5Map.get(byRoute[r]!.md5) || [];
            list.push(r);
            md5Map.set(byRoute[r]!.md5, list);
        }
    }
    const dupesToRecapture: Route[] = [];
    for (const routes of md5Map.values()) {
        if (routes.length > 1) {
            diag.invariants.dupesFound++;
            dupesToRecapture.push(...routes.slice(1));
        }
    }
    if (dupesToRecapture.length > 0) {
        await ensureVisiblePoint();
        for (const route of dupesToRecapture) {
            onLog?.(`! Duplicate image detected for ${route} – recapturing with forced fallback`);
            const recapturedSlice = await captureSingleRoute(route, 99);
            if (recapturedSlice) { byRoute[route] = recapturedSlice; }
            const routeDiag = diag.routes.find(r => r.route === route);
            if(routeDiag) routeDiag.recaptureDupe = true;
        }
    }
    
    // --- Post-Pass 2: Blank/Missing Guarantee & LKG ---
    diag.guarantee.before = Object.values(byRoute).filter(Boolean).length;
    diag.guarantee.missingBefore = ROUTES.filter(r => !byRoute[r]);

    for (const route of ROUTES) {
      if (!byRoute[route]) {
        await ensureVisiblePoint();
        onLog?.(`! Re-capturing missing route: ${route}`);
        const slice = await captureSingleRoute(route, 2);
        if (slice) {
          byRoute[route] = slice;
        } else if (LKG.has(route)) {
          onLog?.(`! Using LKG for missing route ${route}`);
          byRoute[route] = LKG.get(route);
          const routeDiag = diag.routes.find(r => r.route === route);
          if(routeDiag) routeDiag.usedCache = true;
        } else {
          onLog?.(`! Generating placeholder for ${route}`);
          byRoute[route] = createPlaceholder(route);
          diag.guarantee.placeholdersAdded.push(route);
        }
      }
    }
    
    // --- Final Assembly & LKG Update ---
    const finalSlices = ROUTES.map(r => byRoute[r]).filter((s): s is ImageSlice => !!s);
    finalSlices.forEach(s => LKG.set(s.routeName, s)); // Update LKG cache

    diag.guarantee.after = finalSlices.length;
    diag.totals = {
      slices: finalSlices.length,
      kb: Math.round(finalSlices.reduce((a,s)=>a + s.imageBase64.length,0) * 3/4/1024)
    };
    diag.visibility = { pauses: paused.cnt, pausedMs: Math.round(paused.ms) };
    
    const finalMd5Map = new Map<string, Route[]>();
    finalSlices.forEach(s => {
        const list = finalMd5Map.get(s.md5) || []; list.push(s.routeName); finalMd5Map.set(s.md5, list);
    });
    diag.invariants.dupesStillPresent = Array.from(finalMd5Map.values()).filter(v=>v.length > 1).flat();
    diag.md5ByRoute = ROUTES.reduce((acc, r) => { const s = byRoute[r]; acc[r] = s?.md5 || null; return acc; }, {} as Record<Route,string|null>);

    return { slices: finalSlices, diag };
}

export async function captureRouteAsA4Pages(
  route: Route,
  opts?: { lang?: 'en' | 'de'; onLog?: (s: string) => void }
): Promise<ImageSlice[]> {
    const lang = opts?.lang ?? 'en';
    onLog?.(`→ Compat capture for ${route} ...`);
    
    const frame = createIsolatedFrame(`${route}?print=1&lang=${lang}&ts=${Date.now()}`);
    
    try {
        const { win, doc } = await frame.ready();
        injectPrintCSS(doc);
        try { await (doc as any).fonts?.ready; } catch {}
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const root = await waitForReportRoot(win);
        
        let dataUrl = await toPng(root, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
        let isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);

        if (isSuspicious) {
            await new Promise(r => setTimeout(r, 100));
            dataUrl = await toPng(root, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
            isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
        }

        if (isSuspicious) {
            const localH2C = (win as any).html2canvas || html2canvas;
            const canvas = await localH2C(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            dataUrl = canvas.toDataURL('image/png');
        }

        if (!dataUrl || await isImageMostlyBlank(dataUrl)) return [];

        const raw = rawFromDataUrl(dataUrl);
        const w = CAPTURE_WIDTH_PX;
        const h = Math.round(w / A4_ASPECT_RATIO);
        return [{ imageBase64: raw, wPx: w, hPx: h, routeName: route, pageIndex: 0, md5: Md5.hashStr(raw) }];
    } catch {
        return [];
    } finally {
        frame.cleanup();
    }
}
