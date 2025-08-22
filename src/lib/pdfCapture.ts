// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';

export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };
export type ImageSlice = {
  imageBase64: string; wPx: number; hPx: number;
  routeName: string; pageIndex: number; md5: string;
};

const A4_PT = { w: 595.28, h: 841.89 };
const PT_PER_IN = 72;
const CAPTURE_WIDTH = 1280;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const rawFromDataUrl = (url:string)=> {
  const i = url.indexOf('base64,'); if (i < 0) throw new Error('Missing base64 marker');
  return url.slice(i+7);
};

// ---------- DIAG ------------
type RouteDiag = {
  route: string;
  seq: number;
  usedHandshake: boolean;
  ready: boolean;
  waitMs: number;
  svgCount: number;
  rechartsHeights: number[];
  patchedContainers: number;
  capture: {
    attempts: number;
    method: 'html-to-image' | 'html2canvas' | 'failed';
    dataUrlKB: number;
  };
  dedupe: {
    withinRouteDropped: number;
  };
};
let __LAST_ROUTE_DIAG__: Partial<RouteDiag> | null = null;
export function popLastRouteDiag(): Partial<RouteDiag> | null {
  const d = __LAST_ROUTE_DIAG__;
  __LAST_ROUTE_DIAG__ = null;
  return d;
}
// ----------------------------

async function waitIframeReady(win: Window) {
  let tries = 0;
  while ((!win.document || win.document.readyState !== 'complete' || !win.document.body) && tries < 80) {
    await sleep(50); tries++;
  }
  if (!win.document?.body) throw new Error('Iframe body timeout');
}

/**
 * Robustly waits for the iframe content to be ready for capture.
 */
async function settleInIframe(win: Window, doc: Document, { timeoutMs = 2500 } = {}): Promise<Partial<RouteDiag>> {
  const started = performance.now();
  const diag: Partial<RouteDiag> = {
    usedHandshake: false,
    ready: false,
    waitMs: 0,
    svgCount: 0,
    rechartsHeights: [],
    patchedContainers: 0,
  };

  try {
    await (doc as any).fonts?.ready;
  } catch {}

  win.dispatchEvent(new Event('resize'));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 120));

  const check = () => {
    if ((win as any).__ROUTE_PRINT__?.ready) {
      diag.usedHandshake = true;
      return true;
    }
    const root = doc.querySelector('[data-report-root]');
    if (!root) return false;

    const svgs = Array.from(root.querySelectorAll('svg.recharts-surface'));
    diag.svgCount = svgs.length;
    const hasVisibleSvg = svgs.some(s => {
      try { const b = s.getBBox(); return b.width > 0 && b.height > 0; } catch { return false; }
    });
    if (hasVisibleSvg) return true;
    
    const containers = Array.from(root.querySelectorAll<HTMLElement>('.recharts-responsive-container'));
    diag.rechartsHeights = containers.map(c => c.offsetHeight);
    containers.forEach(c => {
      if (c.offsetHeight <= 1) {
        c.style.minHeight = '360px';
        c.setAttribute('data-print-patched', '1');
        diag.patchedContainers = (diag.patchedContainers || 0) + 1;
      }
    });

    return containers.some(c => c.offsetHeight > 1);
  };
  
  let elapsed = 0;
  const interval = 100;
  while(elapsed < timeoutMs) {
    if (check()) {
      diag.ready = true;
      break;
    }
    await sleep(interval);
    elapsed += interval;
  }

  diag.waitMs = Math.round(performance.now() - started);
  return diag;
}


function injectPrintCSS(doc: Document) {
  const style = doc.createElement('style');
  style.textContent = `
    html,body{width:${CAPTURE_WIDTH}px!important; margin:0 auto!important; background:#fff!important;}
    [data-report-root]{width:${CAPTURE_WIDTH}px!important; margin:0 auto!important; padding-bottom: 24px;}
    .container{max-width:${CAPTURE_WIDTH}px!important;}
    .overflow-auto,.overflow-y-auto{overflow:visible!important;}
    [data-no-print="true"]{display:none!important;}
    html[data-print="1"] .hidden { display: block !important; }
    .recharts-responsive-container, .recharts-wrapper { width: 100% !important; height: 100% !important; }
    section { break-inside: avoid; }
    [data-radix-collapsible-trigger] { cursor: default !important; }
    [data-radix-collapsible-content][data-state="closed"] { display: block !important; }
  `;
  doc.head.appendChild(style);
}


async function loadRouteInIframe(path: string, locale: 'en'|'de'):
Promise<{win:Window,doc:Document,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0px';
  iframe.width = String(CAPTURE_WIDTH + 20);
  iframe.height = '2400';
  iframe.src = `${path}${path.includes('?') ? '&' : '?'}print=1&lang=${locale}&ts=${Date.now()}`;
  document.body.appendChild(iframe);

  await new Promise<void>(res => {
    const t = setTimeout(res, 8000);
    iframe.onload = () => { clearTimeout(t); res(); };
  });

  if (!iframe.contentWindow) throw new Error('iframe window unavailable');
  const win = iframe.contentWindow;
  await waitIframeReady(win);

  const doc = iframe.contentDocument!;
  injectPrintCSS(doc);
  doc.documentElement.setAttribute('data-print','1');
  doc.documentElement.classList.add('pdf-mode');

  if (document.documentElement.className) {
    doc.documentElement.className = document.documentElement.className;
  }
  return { win, doc, cleanup: () => iframe.remove() };
}

function paginateAttached(doc: Document, sourceRoot: HTMLElement, a4Px: {w:number,h:number}) {
    if (sourceRoot === doc.body) {
      throw new Error("Paginator guard: sourceRoot must not be <body>.");
    }
  const stage = doc.createElement('div');
  stage.id = '__print_stage__';
  Object.assign(stage.style, { width:`${a4Px.w}px`, margin:'0 auto', boxSizing:'border-box', overflow:'visible' });
  
  doc.body.appendChild(stage);

  const working = sourceRoot;
  stage.appendChild(working);

  const container = doc.createElement('div');
  stage.appendChild(container);

  const newPage = () => {
    const p = doc.createElement('div');
    Object.assign(p.style, {
      width: `${a4Px.w}px`,
      backgroundColor: '#fff',
      margin: '0 auto',
      overflow: 'hidden',
      boxSizing: 'border-box'
    });
    container.appendChild(p);
    return p;
  };

  let page = newPage();
  let usedHeight = 0;

  const getOuterHeight = (el: HTMLElement) => {
    const cs = doc.defaultView!.getComputedStyle(el);
    return el.offsetHeight + parseInt(cs.marginTop) + parseInt(cs.marginBottom);
  };

  const splitNode = (node: HTMLElement) => {
    if (node.tagName === 'TABLE') {
      const table = node as HTMLTableElement;
      const head = table.tHead ? table.tHead.cloneNode(true) : null;
      const rows = Array.from((table.tBodies[0] || table).rows);
      const newTable = () => {
        const tbl = table.cloneNode(false) as HTMLTableElement;
        if (head) tbl.appendChild(head.cloneNode(true));
        const tb = doc.createElement('tbody'); tbl.appendChild(tb);
        page.appendChild(tbl);
        return tb;
      };
      let body = newTable();
      for (const row of rows) {
        const h = getOuterHeight(row as any);
        if (usedHeight > 0 && usedHeight + h > a4Px.h) {
          page.style.height = `${usedHeight}px`; page = newPage(); usedHeight = 0; body = newTable();
        }
        body.appendChild(row); usedHeight += h;
      }
    } else {
      const shell = node.cloneNode(false) as HTMLElement;
      page.appendChild(shell);
      const children = Array.from(node.children) as HTMLElement[];
      for (const child of children) {
        const h = getOuterHeight(child);
        if (usedHeight > 0 && usedHeight + h > a4Px.h) {
          page.style.height = `${usedHeight}px`; page = newPage(); usedHeight = 0;
          const nextShell = node.cloneNode(false) as HTMLElement;
          page.appendChild(nextShell);
          nextShell.appendChild(child);
          usedHeight += h;
        } else {
          shell.appendChild(child); usedHeight += h;
        }
      }
    }
  };

  const blocks = Array.from(working.children) as HTMLElement[];
  for (const block of blocks) {
    const h = getOuterHeight(block);
    if (usedHeight > 0 && usedHeight + h > a4Px.h) {
      page.style.height = `${usedHeight}px`; page = newPage(); usedHeight = 0;
    }
    if (h > a4Px.h) splitNode(block);
    else { page.appendChild(block); usedHeight += h; }
  }

  const pages = Array.from(container.children) as HTMLElement[];
  if (pages.length === 0) throw new Error('Pagination produced 0 pages');
  pages.forEach(p => { if (!p.style.height) p.style.height = `${a4Px.h}px`; });
  return { pages, stage };
}


async function capturePageWithFallback(pageEl: HTMLElement, win: Window): Promise<{ method: 'html-to-image' | 'html2canvas', dataUrl: string }> {
  let dataUrl = '';
  let method: 'html-to-image' | 'html2canvas' = 'html-to-image';
  
  // Attempt 1: html-to-image
  try {
    dataUrl = await toPng(pageEl, { cacheBust: true, pixelRatio: 2, style: { transform: 'none' } });
  } catch {}

  // Check if retry is needed
  if (!dataUrl || rawFromDataUrl(dataUrl).length < 20000) {
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 120));
    // Attempt 2: html-to-image again
    try {
        const retryUrl = await toPng(pageEl, { cacheBust: true, pixelRatio: 2, style: { transform: 'none' } });
        if(retryUrl.length > dataUrl.length) dataUrl = retryUrl;
    } catch {}
  }
  
  // Fallback to html2canvas
  if (!dataUrl || rawFromDataUrl(dataUrl).length < 20000) {
    try {
      method = 'html2canvas';
      const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      dataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      console.error('[pdfCapture] html2canvas fallback also failed.', e);
    }
  }

  return { method, dataUrl };
}

export async function captureRouteAsA4Pages(path: string, locale: 'en'|'de', opts: A4Opts = {}, diagExtras: { seq: number }): Promise<ImageSlice[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4Px = {
    w: Math.floor((A4_PT.w - o.marginPt * 2) * pxPerPt),
    h: Math.floor((A4_PT.h - o.marginPt * 2) * pxPerPt),
  };

  const routeDiag: Partial<RouteDiag> = { route: path, seq: diagExtras.seq };
  
  const { win, doc, cleanup } = await loadRouteInIframe(path, locale);
  try {
    let root = doc.querySelector('[data-report-root]') as HTMLElement | null;
    if (!root) { root = doc.body; }

    const settleDiag = await settleInIframe(win, doc);
    Object.assign(routeDiag, settleDiag);

    let pagesEl: HTMLElement[] = [];
    let stage: HTMLElement | null = null;
    try {
        if (root !== doc.body) {
            const pg = paginateAttached(doc, root, a4Px);
            pagesEl = pg.pages; stage = pg.stage;
        } else {
            pagesEl = [doc.body];
        }
    } catch (e:any) {
       console.warn(`[pdfCapture] Pagination failed for ${path}, capturing body.`, e);
       pagesEl = [doc.body];
    }
    
    const slices: ImageSlice[] = [];
    for (const [i, p] of pagesEl.entries()) {
      const { method, dataUrl } = await capturePageWithFallback(p, win);
      if (!dataUrl?.startsWith('data:image/png;base64,')) continue;
      
      const raw = rawFromDataUrl(dataUrl);
      const md5 = Md5.hashStr(raw);

      const tmpImg = new Image(); tmpImg.src = dataUrl; await tmpImg.decode().catch(()=>{});
      
      const slice: ImageSlice = { 
        imageBase64: raw, 
        wPx: tmpImg.naturalWidth || a4Px.w, 
        hPx: tmpImg.naturalHeight || a4Px.h, 
        routeName: path, 
        pageIndex: i, 
        md5 
      };

      routeDiag.capture = {
        attempts: 1, // Simplified for now
        method,
        dataUrlKB: Math.round(raw.length * 3/4 / 1024)
      };

      slices.push(slice);
    }
    
    if (stage) stage.remove();
    __LAST_ROUTE_DIAG__ = routeDiag;
    return slices;
  } finally {
    cleanup();
  }
}
