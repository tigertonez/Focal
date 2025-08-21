
// src/lib/pdfCapture.ts
'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Md5 } from 'ts-md5';
import { isSpecialSeries, SPECIAL_SERIES_LOCK } from './specialSeries';

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
  anchorFound: boolean;
  usedDom: 'clone' | 'original';
  usedFallback: 'none' | 'tall' | 'html2canvas';
  missingRoot: boolean;
  contentWidthPx: number;
  rechartsCount: number;
  readyMs: number;
  durationMs: number;
  pages: number;
  slices: number;
  sliceDims: Array<{w:number;h:number;kb:number;md5:string}>;
  colorsFrozen: boolean;
  frozenNodeCount: number;
  paletteSource: 'live-dom' | 'iframe-computed';
  errors: string[];
  specialSeriesLocked?: string[];
  specialColorsApplied?: boolean;
};
let __LAST_ROUTE_DIAG__: RouteDiag | null = null;
export function popLastRouteDiag(): RouteDiag | null {
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
 * It waits for fonts and polls for chart and layout stability.
 */
async function settleInIframe(doc: Document, root: HTMLElement): Promise<number> {
    const started = performance.now();
    try { await doc.fonts?.ready; } catch {}

    if (doc.visibilityState === 'hidden') {
      await sleep(800);
      return performance.now() - started;
    }

    const checkStability = async (
        getValue: () => number,
        checks: number = 3,
        interval: number = 150
    ): Promise<boolean> => {
        let lastValue = getValue();
        let stableChecks = 0;
        for (let i = 0; i < checks; i++) {
            await sleep(interval);
            const currentValue = getValue();
            if (currentValue > 0 && currentValue === lastValue) {
                stableChecks++;
            } else {
                stableChecks = 0;
            }
            lastValue = currentValue;
        }
        return stableChecks >= checks -1;
    };

    const isLayoutStable = await checkStability(() => root.scrollHeight);
    const areChartsStable = await checkStability(() => doc.querySelectorAll('svg.recharts-surface').length);

    if (!isLayoutStable || !areChartsStable) {
        console.warn(`[settle] Layout or chart stability not reached for ${doc.location.pathname}`);
    }
    
    return performance.now() - started;
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

/**
 * Freezes computed SVG styles as inline attributes to ensure they are captured by html-to-image.
 * This should run in the iframe, after settling and before capture.
 * @param doc The document or root element to process.
 * @returns The number of nodes that were modified.
 */
function freezeSvgColors(doc: Document | HTMLElement): number {
  let frozenNodeCount = 0;
  const svgs = doc.querySelectorAll('svg.recharts-surface');
  svgs.forEach(svg => {
    const elements = svg.querySelectorAll('path, rect, circle, line, text, g');
    elements.forEach(el => {
      const element = el as HTMLElement;
      const computed = getComputedStyle(element);
      
      const finalFill = computed.fill !== 'none' && computed.fill !== 'rgb(0, 0, 0)' ? (computed.fill === 'currentColor' ? computed.color : computed.fill) : '';
      const finalStroke = computed.stroke !== 'none' ? (computed.stroke === 'currentColor' ? computed.color : computed.stroke) : '';
      const finalOpacity = computed.opacity !== '1' ? computed.opacity : '';
      
      if (finalFill && finalFill !== 'rgba(0, 0, 0, 0)') {
          element.setAttribute('fill', finalFill);
          frozenNodeCount++;
      }
      if (finalStroke && finalStroke !== 'rgba(0, 0, 0, 0)') {
          element.setAttribute('stroke', finalStroke);
          frozenNodeCount++;
      }
      if (finalOpacity) {
          element.setAttribute('opacity', finalOpacity);
          frozenNodeCount++;
      }
    });
  });
  return frozenNodeCount;
}

export async function loadRouteInIframe(path: string, locale: 'en'|'de'):
Promise<{win:Window,doc:Document,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0px';
  iframe.width = String(CAPTURE_WIDTH + 20);
  iframe.height = '2400';
  iframe.src = `${path}${path.includes('?') ? '&' : '?'}print=1&lang=${locale}`;
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
  return { pages, stage, usedDom: 'original' as const };
}

async function captureElementToPng(el: HTMLElement): Promise<string> {
  try {
    return await toPng(el, {
      cacheBust: true, pixelRatio: 2, style: { transform: 'none' },
      skipFonts: false, useCORS: true,
      filter: (node) => !(node as HTMLElement).closest?.('[data-no-print="true"]'),
    });
  } catch (e) {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    return canvas.toDataURL('image/png');
  }
}

async function tallFallback(doc: Document, root: HTMLElement, a4Px:{w:number,h:number}) {
  root.style.width = `${CAPTURE_WIDTH}px`;
  root.style.margin = '0 auto';

  const url = await captureElementToPng(root);
  const img = new Image();
  img.src = url; await img.decode().catch(()=>{});
  const canvas = doc.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const sliceH = a4Px.h;
  canvas.width = img.naturalWidth || CAPTURE_WIDTH * 2;
  canvas.height = sliceH;

  const out: {url:string; h:number}[] = [];
  for (let y = 0; y < (img.naturalHeight || a4Px.h); y += sliceH) {
    const h = Math.min(sliceH, (img.naturalHeight || a4Px.h) - y);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    out.push({ url: canvas.toDataURL('image/png'), h });
  }
  return out;
}

export async function captureRouteAsA4Pages(path: string, locale: 'en'|'de', opts: A4Opts = {}, diagExtras: { seq: number }): Promise<ImageSlice[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4Px = {
    w: Math.floor((A4_PT.w - o.marginPt * 2) * pxPerPt),
    h: Math.floor((A4_PT.h - o.marginPt * 2) * pxPerPt),
  };

  const started = performance.now();
  const diag: RouteDiag = {
    route: path, seq: diagExtras.seq, anchorFound: false, usedDom: 'clone', usedFallback: 'none', missingRoot: false, contentWidthPx: CAPTURE_WIDTH,
    rechartsCount: 0, readyMs: 0, durationMs: 0, pages: 0, slices: 0, sliceDims: [],
    colorsFrozen: false, frozenNodeCount: 0, paletteSource: 'iframe-computed', errors: [],
  };
  
  const { win, doc, cleanup } = await loadRouteInIframe(path, locale);
  try {
    let root = doc.querySelector('[data-report-root]') as HTMLElement | null;
    diag.anchorFound = !!root;
    if (!root) { diag.missingRoot = true; root = doc.body; }

    diag.readyMs = await settleInIframe(doc, root);
    
    try {
        diag.frozenNodeCount = freezeSvgColors(root);
        diag.colorsFrozen = diag.frozenNodeCount > 0;
        diag.paletteSource = 'iframe-computed';
        
        if (path.includes('/costs')) {
            diag.specialSeriesLocked = Object.keys(SPECIAL_SERIES_LOCK);
            diag.specialColorsApplied = true;
        }

    } catch (e: any) {
        diag.errors.push(`ColorFreezeFailed: ${e.message || String(e)}`);
    }

    diag.rechartsCount = doc.querySelectorAll('svg.recharts-surface').length;

    let pagesEl: HTMLElement[] = [];
    let stage: HTMLElement | null = null;
    let usedDom: 'clone' | 'original' = 'clone';
    try {
      if (diag.anchorFound) {
          const pg = paginateAttached(doc, root!, a4Px);
          pagesEl = pg.pages; stage = pg.stage; usedDom = pg.usedDom;
          diag.usedDom = usedDom;
      } else {
        throw new Error("Pagination skipped: no data-report-root found.");
      }
    } catch (e:any) {
      diag.errors.push(`paginate: ${e.message||String(e)}`);
    }

    let slices: ImageSlice[] = [];
    const seen = new Set<string>();

    if (pagesEl.length === 0) {
      diag.usedFallback = 'tall';
      const chunks = await tallFallback(doc, root!, a4Px);
      for (let i=0;i<chunks.length;i++) {
        const url = chunks[i].url;
        if (!url?.startsWith('data:image/png;base64,')) continue;
        const raw = rawFromDataUrl(url);
        const md5 = Md5.hashStr(raw);
        const tmpImg = new Image(); tmpImg.src = url; await tmpImg.decode().catch(()=>{});
        if (seen.has(md5)) continue; seen.add(md5);
        slices.push({ imageBase64: raw, wPx: tmpImg.naturalWidth || a4Px.w, hPx: chunks[i].h, routeName: path, pageIndex: i, md5 });
        diag.sliceDims.push({ w: tmpImg.naturalWidth||a4Px.w, h: chunks[i].h, kb: Math.round(raw.length*3/4/1024), md5 });
      }
    } else {
      for (const [i,p] of pagesEl.entries()) {
        let url = '';
        try { url = await captureElementToPng(p); }
        catch (e:any) { diag.errors.push(`capture:${i} ${e.message||String(e)}`); diag.usedFallback = 'html2canvas'; continue; }
        if (!url?.startsWith('data:image/png;base64,')) continue;
        const raw = rawFromDataUrl(url);
        const md5 = Md5.hashStr(raw);
        if (seen.has(md5)) continue; seen.add(md5);
        const tmpImg = new Image(); tmpImg.src = url; await tmpImg.decode().catch(()=>{});
        slices.push({ imageBase64: raw, wPx: tmpImg.naturalWidth || a4Px.w, hPx: tmpImg.naturalHeight || a4Px.h, routeName: path, pageIndex: i, md5 });
        diag.sliceDims.push({ w: tmpImg.naturalWidth||a4Px.w, h: tmpImg.naturalHeight||a4Px.h, kb: Math.round(raw.length*3/4/1024), md5 });
      }
    }

    if (stage) stage.remove();

    diag.pages = pagesEl.length || slices.length;
    diag.slices = slices.length;
    diag.durationMs = Math.round(performance.now() - started);
    __LAST_ROUTE_DIAG__ = diag;

    return slices;
  } finally {
    cleanup();
  }
}
