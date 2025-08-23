
// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';

const CAPTURE_WIDTH_PX = 1280;
const A4_ASPECT_RATIO = 8.27 / 11.69;
const MIN_KB_OK = 50;
const ROUTES: Route[] = ['/inputs','/revenue','/costs','/profit','/cash-flow','/summary'] as const;

export type Route = '/inputs'|'/revenue'|'/costs'|'/profit'|'/cash-flow'|'/summary';
export type ImageSlice = {
  imageBase64: string; wPx: number; hPx: number;
  routeName: Route; pageIndex: number; md5: string;
};

// Use a top-level in-memory cache for Last-Known-Good slices across runs
const LKG: Map<Route, ImageSlice> = (window as any).__PDF_GOOD_CACHE || ((window as any).__PDF_GOOD_CACHE = new Map());


type Diag = {
  runId: string; startTs: string; routes: any[];
  totals: { slices: number; kb: number };
  guarantee: { before: number; after: number; missingBefore: string[]; placeholdersAdded: string[] };
  visibility: { pauses: number; pausedMs: number };
  invariants: { dupesFound: number, dupesStillPresent: Route[] };
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
  });
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
    /* --- ADDED RULES TO HIDE AI --- */
    [data-ai-insight], [data-ai-report], .ai-insights, .ai-insight, #ai-insights, #get-strategic-analysis, [data-print-hide="ai"] {
      display: none !important;
      visibility: hidden !important;
    }
  `;
  doc.head.appendChild(style);
}

function getRouteRoot(win: Window): HTMLElement {
  const doc = win.document;
  return doc.querySelector('[data-report-root]') as HTMLElement || doc.body;
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

async function withRouteIframe<T>(
  route: Route,
  lang: 'en'|'de',
  diag: any,
  fn: (win: Window, doc: Document, root: HTMLElement, diag: any) => Promise<T>
): Promise<T> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-20000px';
  iframe.style.top = '0px';
  iframe.width = `${CAPTURE_WIDTH_PX + 40}`;
  iframe.height = '4000';
  document.body.appendChild(iframe);
  let rootNode: HTMLElement | null = null;
  let prevMinH: string | null = null;
  
  try {
    iframe.src = `${route}?print=1&lang=${lang}&ts=${Date.now()}`;
    await waitIframeLoad(iframe);
    
    const win = iframe.contentWindow!;
    const doc = win.document;
    diag.url = win.location.href;

    // Route sanity gate
    let pathOk = false;
    for (let i = 0; i < 5; i++) {
      if (win.location.pathname === route) { pathOk = true; break; }
      await new Promise(r => setTimeout(r, 100));
    }
    if (!pathOk) {
      iframe.src = `${route}?print=1&lang=${lang}&ts=${Date.now()}`;
      await waitIframeLoad(iframe);
      for (let i = 0; i < 5; i++) {
        if (win.location.pathname === route) { pathOk = true; break; }
        await new Promise(r => setTimeout(r, 100));
      }
    }
    diag.pathOk = pathOk;

    injectPrintCSS(doc);
    
    // Hard-hide and remove AI nodes
    const aiSelectors = '[data-ai-insight],[data-ai-report],.ai-insights,.ai-insight,#ai-insights,#get-strategic-analysis,[data-print-hide="ai"]';
    const aiNodes = doc.querySelectorAll(aiSelectors);
    aiNodes.forEach(n => n.remove());
    diag.aiHidden = aiNodes.length || 0;

    await (doc as any).fonts?.ready?.catch(() => {});
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => setTimeout(r, 100));

    rootNode = getRouteRoot(win);
    const bodyH = Math.max(rootNode.getBoundingClientRect().height, (rootNode as any).scrollHeight || 0);
    if (bodyH < 1000) {
      prevMinH = rootNode.style.minHeight;
      rootNode.style.minHeight = '1800px';
    }

    return await fn(win, doc, rootNode, diag);
  } finally {
    if (rootNode && prevMinH !== null) rootNode.style.minHeight = prevMinH;
    iframe.remove();
  }
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
    };

    onStatus?.('Beta: AI insights are excluded from the PDF. Keep this tab visible until done.');

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

    async function captureSingleRoute(route: Route, attemptNo = 1, preferHtml2Canvas = false): Promise<ImageSlice | null> {
      await ensureVisiblePoint();
      onStatus?.(`Exporting ${route} — attempt ${attemptNo}`);
      const routeDiag: any = { route, attempt: attemptNo };

      return await withRouteIframe(route, lang, routeDiag, async (win, doc, root, diag) => {
        const heading = (doc.querySelector('h1,h2')?.textContent || '').trim().slice(0, 120);
        diag.headingText = heading;
        diag.headingHash = Md5.hashStr(heading || route);

        const bodyH = Math.max(root.getBoundingClientRect().height, (root as any).scrollHeight || 0);
        const innerTextLen = (root.innerText || '').trim().length;
        const svgs = Array.from(doc.querySelectorAll<SVGSVGElement>('svg.recharts-surface'));
        const svgShapesCount = svgs.reduce((a, s) => a + (s.querySelectorAll('path,rect,circle,line,polyline,polygon').length), 0);
        Object.assign(diag, { bodyH, innerTextLen, svgCount: svgs.length, svgShapesCount });

        let readinessOk = true;
        for (let i = 0; i < 5; i++) {
          readinessOk = true;
          if (route === '/summary' && (innerTextLen < 400 || bodyH < 1300)) readinessOk = false;
          if ((route === '/revenue' || route === '/costs') && svgs.length > 0 && svgShapesCount === 0) readinessOk = false;
          if (readinessOk) break;
          await new Promise(r => setTimeout(r, 200));
        }
        diag.readinessOk = readinessOk;
        
        let dataUrl = '';
        let isSuspicious = true;
        let captureMethod = '';

        const capturePrimary = async () => {
          captureMethod = 'html-to-image';
          return await toPng(root, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
        };
        const captureFallback = async () => {
          captureMethod = 'html2canvas';
          diag.fallbackRealm = 'iframe';
          const h2c = (win as any).html2canvas || html2canvas;
          const canvas = await h2c(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          return canvas.toDataURL('image/png');
        };

        const tryPrimary = async (diagKey: 'blankPrimary' | 'blankPrimaryRetry') => {
          dataUrl = await capturePrimary();
          isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
          diag[diagKey] = isSuspicious;
          return !isSuspicious;
        };

        const tryFallback = async () => {
          diag.fallbackUsed = 'html2canvas';
          dataUrl = await captureFallback();
          isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
          diag.blankFallback = isSuspicious;
          return !isSuspicious;
        };
        
        if (preferHtml2Canvas) {
            if (!(await tryFallback())) await tryPrimary('blankPrimary');
        } else {
            if (!(await tryPrimary('blankPrimary'))) {
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                await new Promise(r => setTimeout(r, 80));
                if (!(await tryPrimary('blankPrimaryRetry'))) await tryFallback();
            }
        }

        diag.suspiciousPrimary = !!diag.blankPrimary;
        diag.captureMethod = captureMethod;
        diag.finalSuccess = !isSuspicious;
        
        diag.routes = diag.routes || [];
        diag.routes.push(routeDiag);

        if (!isSuspicious) {
          const raw = rawFromDataUrl(dataUrl);
          return { imageBase64: raw, wPx: CAPTURE_WIDTH_PX, hPx: Math.round(CAPTURE_WIDTH_PX / A4_ASPECT_RATIO), routeName: route, pageIndex: 0, md5: Md5.hashStr(raw) };
        }
        return null;
      });
    }

    const seenMd5s = new Map<string, Route>();

    // --- MAIN CAPTURE LOOP ---
    for (const [i, route] of ROUTES.entries()) {
      let slice = await captureSingleRoute(route, 1);
      if (slice) {
        if (seenMd5s.has(slice.md5)) {
            const collisionRoute = seenMd5s.get(slice.md5)!;
            const d = diag.routes.find(r => r.route === route);
            if (d) { d.dupCollided = true; d.recapture = true; }
            slice = await captureSingleRoute(route, 2);
        }
        if (slice && !seenMd5s.has(slice.md5)) {
            byRoute[route] = slice;
            seenMd5s.set(slice.md5, route);
        }
      }
      onProgress?.((i + 1) / ROUTES.length);
    }
    
    // --- POST-PASS: BLANK/MISSING GUARANTEE ---
    diag.guarantee.before = Object.values(byRoute).filter(Boolean).length;
    diag.guarantee.missingBefore = ROUTES.filter(r => !byRoute[r]);
    for (const route of diag.guarantee.missingBefore) {
        onLog?.(`! Re-capturing missing route: ${route}`);
        let slice = await captureSingleRoute(route, 3);
        if (slice && !seenMd5s.has(slice.md5)) {
            byRoute[route] = slice;
            seenMd5s.set(slice.md5, route);
        } else {
            byRoute[route] = LKG.get(route) || createPlaceholder(route);
        }
    }

    // --- POST-PASS: DUPLICATE GUARANTEE ---
    const md5Map = new Map<string, Route[]>();
    ROUTES.forEach(r => {
        const slice = byRoute[r];
        if (slice) {
            const list = md5Map.get(slice.md5) || [];
            list.push(r);
            md5Map.set(slice.md5, list);
        }
    });

    diag.invariants.dupesFound = Array.from(md5Map.values()).filter(v => v.length > 1).length;
    for (const routesWithDupes of md5Map.values()) {
        if (routesWithDupes.length > 1) {
            for (let i = 1; i < routesWithDupes.length; i++) {
                const routeToRecapture = routesWithDupes[i];
                onLog?.(`! Re-capturing duplicate route: ${routeToRecapture}`);
                const slice = await captureSingleRoute(routeToRecapture, 4, true); // Prefer H2C
                if (slice && !md5Map.has(slice.md5)) {
                    byRoute[routeToRecapture] = slice;
                } else if (LKG.has(routeToRecapture)) {
                    byRoute[routeToRecapture] = LKG.get(routeToRecapture);
                }
            }
        }
    }

    // --- FINAL ASSEMBLY & LKG UPDATE ---
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
        const list = finalMd5Map.get(s.md5) || [];
        list.push(s.routeName);
        finalMd5Map.set(s.md5, list);
    });
    diag.invariants.dupesStillPresent = Array.from(finalMd5Map.values()).filter(v=>v.length > 1).flat();

    return { slices: finalSlices, diag };
}

// ---- Back-compat shim for legacy callers -----------------------------------
export async function captureRouteAsA4Pages(
  route: Route,
  opts?: { lang?: 'en' | 'de'; onLog?: (s: string) => void }
): Promise<ImageSlice[]> {
  const lang = opts?.lang ?? 'en';
  opts?.onLog?.(`→ Compat capture for ${route} ...`);
  const slice = await captureSingleRoute(route);
  return slice ? [slice] : [];
}

// Shim for single route capture, not meant for direct use in new flow
async function captureSingleRoute(route: Route, attemptNo = 1, preferHtml2Canvas = false): Promise<ImageSlice | null> {
    const diag: any = {};
    return await withRouteIframe(route, 'en', diag, async (win, doc, root) => {
        // This is a simplified version of the logic inside the main function
        // It won't have the full recapture or LKG logic.
        const capturePrimary = async () => await toPng(root, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
        let dataUrl = await capturePrimary();
        let isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
        if (isSuspicious) {
            await new Promise(r => setTimeout(r, 200));
            dataUrl = await capturePrimary();
            isSuspicious = (rawFromDataUrl(dataUrl).length / 1024 * 3/4) < MIN_KB_OK || await isImageMostlyBlank(dataUrl);
        }
        if (isSuspicious) return null;
        const raw = rawFromDataUrl(dataUrl);
        return { imageBase64: raw, wPx: CAPTURE_WIDTH_PX, hPx: Math.round(CAPTURE_WIDTH_PX / A4_ASPECT_RATIO), routeName: route, pageIndex: 0, md5: Md5.hashStr(raw) };
    });
}
