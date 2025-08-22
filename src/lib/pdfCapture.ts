// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';

const CAPTURE_WIDTH_PX = 1280;
const A4_ASPECT_RATIO = 8.27 / 11.69;
const MIN_KB_OK = 50;
const MIN_W_PX = 1000;
const MIN_H_PX = 1400;
const ROUTES: Route[] = ['/inputs','/revenue','/costs','/profit','/cash-flow','/summary'] as const;

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
  `;
  doc.head.appendChild(style);
}

function getRouteRoot(win: Window): HTMLElement {
  const doc = win.document;
  return doc.querySelector('[data-report-root]') as HTMLElement || doc.body;
}

async function capturePrimary(node: HTMLElement) {
    return await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
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

export async function captureFullReport({ lang = 'en', onLog, onProgress, onStatus }: { lang: 'en' | 'de', onLog?: (msg: string) => void, onProgress?: (p: number) => void, onStatus?: (s: string)=>void }) {
    const diag: Diag = {
      runId: 'run_' + Math.random().toString(36).substr(2, 9),
      startTs: new Date().toISOString(),
      routes: [],
      totals: { slices: 0, kb: 0 },
      guarantee: { before: 0, after: 0, missingBefore: [], placeholdersAdded: [] },
      visibility: { pauses: 0, pausedMs: 0 },
    };

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

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-20000px';
    iframe.style.top = '0px';
    iframe.width = `${CAPTURE_WIDTH_PX + 40}`;
    iframe.height = '4000';
    document.body.appendChild(iframe);

    async function captureSingleRoute(route: Route, attemptNum = 1): Promise<ImageSlice | null> {
        await ensureVisiblePoint();
        onStatus?.(`Exporting ${route} — attempt ${attemptNum}`);
        const routeDiag: any = { route, capture: {} };
        const stamp = document.createElement('span');
        let rootNode: HTMLElement | null = null;
        let prevMinH: string | null = null;
        let doc: Document;
        let win: Window;
        let patchedNodes: { el: HTMLElement, prevMinHeight: string, prevHeight: string }[] = [];
        
        try {
            iframe.src = `${route}?print=1&lang=${lang}&ts=${Date.now()}`;
            await waitIframeLoad(iframe);
            win = iframe.contentWindow!; 
            doc = win.document;
            injectPrintCSS(doc);
            
            try { doc.documentElement.classList.add('pdf-freeze'); } catch {}

            rootNode = getRouteRoot(win);

            try { await doc.fonts?.ready; } catch {}
            try { win.dispatchEvent(new Event('resize')); } catch {}
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            try { win.dispatchEvent(new Event('resize')); } catch {}
            await new Promise(r => setTimeout(r, 100));

            if (rootNode.getBoundingClientRect().height < 1000) {
              prevMinH = rootNode.style.minHeight;
              rootNode.style.minHeight = '1800px';
            }

            stamp.textContent = `${route}|${Date.now()%10000}`;
            Object.assign(stamp.style, {
                position:'absolute', right:'2px', bottom:'2px', opacity:'0.001',
                fontSize:'1px', pointerEvents:'none', userSelect:'none'
            });
            rootNode.appendChild(stamp);
            
            let dataUrl: string = '';
            let method = 'html-to-image';
            
            let svgs: SVGSVGElement[] = [];
            try { svgs = Array.from(doc.querySelectorAll<SVGSVGElement>('svg.recharts-surface')); } catch {}
            routeDiag.svgCount = svgs.length || 0;
            
            try {
              const sels = ['.recharts-responsive-container', '.recharts-wrapper'];
              const candidates = Array.from(doc.querySelectorAll<HTMLElement>(sels.join(',')));
              const toPatch = candidates.filter(el => {
                const h = el.offsetHeight || el.getBoundingClientRect().height || 0;
                return h < 120; // clearly too small to render bars/lines
              });
              for (const el of toPatch) {
                patchedNodes.push({ el, prevMinHeight: el.style.minHeight, prevHeight: el.style.height });
                el.style.minHeight = '360px';
                el.style.height = '360px';
              }
              routeDiag.patchedContainers = toPatch.length;
            } catch { routeDiag.patchedContainers = 0; }

            // Attempt 1
            dataUrl = await capturePrimary(rootNode);

            let retriedSvgEmpty = false;
            try {
              const svgLooksEmpty = svgs.length > 0 && svgs.every(svg => {
                try {
                  const box = svg.getBBox();
                  const hasShapes = svg.querySelector('path,rect,circle,line,polyline,polygon');
                  return (box.width > 0 && box.height > 0) && !hasShapes;
                } catch { return true; } // if getBBox throws, treat as not ready
              });
              if (svgLooksEmpty) {
                // short settle and retry primary exactly once
                retriedSvgEmpty = true;
                try { win.dispatchEvent(new Event('resize')); } catch {}
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                await new Promise(r => setTimeout(r, 80));
                dataUrl = await capturePrimary(rootNode);
              }
            } catch {}
            routeDiag.retriedSvgEmpty = retriedSvgEmpty;


            let raw = rawFromDataUrl(dataUrl);
            let kb = Math.round(raw.length * 3 / 4 / 1024);
            let isValid = kb >= MIN_KB_OK;
            
            // Fallback
            if (!isValid) {
              await ensureVisiblePoint();
              onLog?.(`   - Fallback to html2canvas for ${route}`);
              onStatus?.(`↻ Fallback (html2canvas) for ${route}`);
              try {
                  const freshNode = getRouteRoot(win);
                  const localH2C = (freshNode.ownerDocument?.defaultView as any)?.html2canvas || html2canvas;
                  const canvas = await localH2C(freshNode, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                  dataUrl = canvas.toDataURL('image/png');
                  raw = rawFromDataUrl(dataUrl);
                  kb = Math.round(raw.length * 3/4/1024);
                  isValid = kb >= MIN_KB_OK;
                  method = 'html2canvas';
              } catch (e: any) {
                  onLog?.(`   - Fallback failed for ${route}: ${e.message}`);
                  method = 'fallback-error';
                  dataUrl = '';
              }
            }
            
            if (dataUrl && isValid) {
                onStatus?.(`✓ Captured ${route}`);
                const md5 = Md5.hashStr(raw);
                const w = CAPTURE_WIDTH_PX;
                const h = Math.round(w / A4_ASPECT_RATIO);
                routeDiag.capture = { method, dataUrlKB: kb };
                return { imageBase64: raw, wPx: w, hPx: h, routeName: route, pageIndex: 0, md5 };
            }

            return null; // Return null if all attempts failed to produce a valid image

        } catch (e: any) {
            onLog?.(`   - Capture error for ${route}: ${e.message}`);
            routeDiag.capture = { method: 'error', error: e.message };
            return null;
        } finally {
            if (rootNode) {
              if (stamp.parentNode) rootNode.removeChild(stamp);
              if (prevMinH !== null) rootNode.style.minHeight = prevMinH;
            }
            try {
              for (const p of patchedNodes) {
                p.el.style.minHeight = p.prevMinHeight;
                p.el.style.height = p.prevHeight;
              }
            } catch {}
            try { doc?.documentElement.classList.remove('pdf-freeze'); } catch {}
            diag.routes.push(routeDiag);
        }
    }

    const seenRouteFirstSlice = new Set<Route>();
    const seenMd5s = new Set<string>();

    for (const [i, route] of ROUTES.entries()) {
        const slice = await captureSingleRoute(route);
        if (slice) {
          const dedupeKey = `${route}:${slice.md5}`;
          if (!seenRouteFirstSlice.has(route)) {
            byRoute[route] = slice;
            seenRouteFirstSlice.add(route);
            seenMd5s.add(dedupeKey);
          } else if (!seenMd5s.has(dedupeKey)) {
             // In a multi-slice per route scenario, this would add more, but we only capture one.
          }
        }
        onProgress?.((i + 1) / ROUTES.length);
    }
    
    diag.guarantee.before = Object.values(byRoute).filter(Boolean).length;
    diag.guarantee.missingBefore = ROUTES.filter(r => !byRoute[r]);

    if (diag.guarantee.missingBefore.length > 0) {
      await ensureVisiblePoint();
    }

    for (const route of diag.guarantee.missingBefore) {
        onLog?.(`! Re-capturing missing route: ${route}`);
        let slice = await captureSingleRoute(route, 2);
        if (!slice) {
            onLog?.(`! Generating placeholder for ${route}`);
            onStatus?.(`⚠ Using placeholder for ${route}`);
            slice = createPlaceholder(route);
            diag.guarantee.placeholdersAdded.push(route);
            const routeDiag = diag.routes.find(r => r.route === route);
            if (routeDiag) routeDiag.placeholder = true;
        }
        byRoute[route] = slice;
    }

    const finalSlices = ROUTES.map(r => byRoute[r]).filter((s): s is ImageSlice => !!s);
    diag.guarantee.after = finalSlices.length;
    diag.totals = {
      slices: finalSlices.length,
      kb: Math.round(finalSlices.reduce((a,s)=>a + s.imageBase64.length,0) * 3/4/1024)
    };
    (diag as any).visibility = { pauses: paused.cnt, pausedMs: Math.round(paused.ms) };
    
    finalSlices.forEach(slice => {
        const d = diag.routes.find(r => r.route === slice.routeName && !r.final);
        if (d) {
            d.md5 = slice.md5;
            d.wPx = slice.wPx;
            d.hPx = slice.hPx;
            d.final = { kept: true, placeholder: !!d.placeholder };
        }
    });

    iframe.remove();
    return { slices: finalSlices, diag };
}

// ---- Back-compat shim for legacy callers -----------------------------------
export async function captureRouteAsA4Pages(
  route: Route,
  opts?: { lang?: 'en' | 'de'; onLog?: (s: string) => void }
): Promise<ImageSlice[]> {
  const lang = opts?.lang ?? 'en';
  const onLog = opts?.onLog;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-20000px';
  iframe.style.top = '0px';
  iframe.width = `${CAPTURE_WIDTH_PX + 40}`;
  iframe.height = '4000';
  document.body.appendChild(iframe);

  try {
    onLog?.(`→ Compat capture for ${route} ...`);
    iframe.src = `${route}?print=1&lang=${lang}&ts=${Date.now()}`;
    await waitIframeLoad(iframe);
    const win = iframe.contentWindow!;
    const doc = win.document;
    injectPrintCSS(doc);

    try { await (doc as any).fonts?.ready; } catch {}
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 80));

    const root = getRouteRoot(win);
    const rect = root.getBoundingClientRect();
    const needMinH = rect.height < 1000;
    const prevMinH = root.style.minHeight;
    if (needMinH) root.style.minHeight = '1800px';

    let dataUrl = await capturePrimary(root);
    let raw = rawFromDataUrl(dataUrl);
    let kb = Math.round((raw.length * 3) / 4 / 1024);

    if (kb < MIN_KB_OK) {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      dataUrl = await capturePrimary(root);
      raw = rawFromDataUrl(dataUrl);
      kb = Math.round((raw.length * 3) / 4 / 1024);

      if (kb < MIN_KB_OK) {
        const localH2C =
          (root.ownerDocument?.defaultView as any)?.html2canvas || html2canvas;
        const canvas = await localH2C(root, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        dataUrl = canvas.toDataURL('image/png');
        raw = rawFromDataUrl(dataUrl);
      }
    }

    if (needMinH) root.style.minHeight = prevMinH;
    
    if (!dataUrl) return [];

    const w = CAPTURE_WIDTH_PX;
    const h = Math.round(w / A4_ASPECT_RATIO);
    const md5 = Md5.hashStr(raw);
    return [
      { imageBase64: raw, wPx: w, hPx: h, routeName: route, pageIndex: 0, md5 },
    ];
  } finally {
    iframe.remove();
  }
}
