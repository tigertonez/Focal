'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import {Md5} from 'ts-md5';

export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };
export type ImageSlice = { imageBase64: string; wPx: number; hPx: number; routeName: string; pageIndex: number; md5: string };

const A4_PT = { w: 595.28, h: 841.89 };
const PT_PER_IN = 72;
const CAPTURE_WIDTH = 1280;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const rawFromDataUrl = (url:string)=> {
  const i = url.indexOf('base64,'); if (i < 0) throw new Error('Missing base64 marker');
  return url.slice(i+7);
};

/** Wait until iframe has a body and the route signalled readiness. */
async function waitIframeReady(win: Window) {
  let tries = 0;
  while ((!win.document || win.document.readyState !== 'complete' || !win.document.body) && tries < 80) {
    await sleep(50); tries++;
  }
  if (!win.document?.body) throw new Error('Iframe document body not found after timeout.');

  try { await (win.document as any).fonts?.ready; } catch {}

  const maybe = (win as any).__PRINT_READY__;
  if (maybe && typeof (maybe as Promise<any>).then === 'function') {
    // IMPORTANT: never hang forever – proceed after 6s
    await Promise.race([maybe, sleep(6000)]);
  } else {
    // Fallback if page doesn't expose __PRINT_READY__
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(250);
  }
}

/** Load route in same-origin iframe with print flags; guarantee body exists. */
export async function loadRouteInIframe(path: string, locale: 'en'|'de'): Promise<{win:Window,doc:Document,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.width = String(CAPTURE_WIDTH);
  iframe.height = '2400';
  iframe.src = `${path}${path.includes('?') ? '&' : '?'}print=1&lang=${locale}`;
  document.body.appendChild(iframe);

  await new Promise<void>(res => {
    const failover = setTimeout(res, 5000); // safety timeout
    iframe.onload = () => { clearTimeout(failover); res(); };
  });

  if (!iframe.contentWindow) throw new Error('Iframe window unavailable');
  const win = iframe.contentWindow;
  await waitIframeReady(win);
  const doc = iframe.contentDocument!;
  doc.documentElement.setAttribute('data-print','1');

  // INJECT a small stylesheet to lock layout and remove scrollbars in print
  const style = doc.createElement('style');
  style.textContent = `
    html, body { width: ${CAPTURE_WIDTH}px !important; margin: 0 auto !important; background: #fff !important; overflow: visible !important; }
    .container { max-width: ${CAPTURE_WIDTH}px !important; }
    [data-no-print="true"] { display: none !important; }
    .overflow-auto, .overflow-y-auto, .overflow-x-auto { overflow: visible !important; }
  `;
  doc.head.appendChild(style);

  // also mirror app classes if present
  if (document.documentElement.className) {
    doc.documentElement.className = document.documentElement.className;
  }
  
  // kick layout so Recharts can remeasure in the live route BEFORE we clone
  doc.defaultView?.dispatchEvent(new Event('resize'));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  return { win, doc, cleanup: () => iframe.remove() };
}

/** Build A4 pages INSIDE the DOM so measurements are correct. */
function paginateAttached(doc: Document, sourceRoot: HTMLElement, a4Px: {w:number,h:number}) {
  const stage = doc.createElement('div');
  stage.id = '__print_stage__';
  doc.body.appendChild(stage);
  Object.assign(stage.style, { width:`${a4Px.w}px`, margin:'0 auto', boxSizing:'border-box', overflow:'visible' });

  const working = sourceRoot.cloneNode(true) as HTMLElement;
  working.querySelectorAll('[data-no-print="true"]').forEach(el => el.remove());
  stage.appendChild(working);

  const container = doc.createElement('div');
  stage.appendChild(container);

  const newPage = () => {
    const p = doc.createElement('div');
    Object.assign(p.style, {
      width: `${a4Px.w}px`,
      overflow: 'hidden',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      margin: '0 auto',
      padding: '0'
    });
    container.appendChild(p);
    return p;
  };
  
  let page = newPage();
  let usedHeight = 0;

  const getOuterHeight = (el: HTMLElement) => {
    const style = doc.defaultView!.getComputedStyle(el);
    return el.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);
  };

  const splitNode = (node: HTMLElement) => {
    if (node.tagName === 'TABLE') {
      const table = node;
      const head = table.tHead ? table.tHead.cloneNode(true) : null;
      const rows = Array.from((table.tBodies[0] || table).rows);
      
      const newTable = () => {
        const tbl = table.cloneNode(false) as HTMLTableElement;
        if (head) tbl.appendChild(head.cloneNode(true));
        tbl.appendChild(doc.createElement('tbody'));
        page.appendChild(tbl);
        return tbl.tBodies[0];
      };

      let currentBody = newTable();
      for (const row of rows) {
        const rowHeight = getOuterHeight(row as HTMLElement);
        if (usedHeight + rowHeight > a4Px.h && usedHeight > 0) {
          page.style.height = `${usedHeight}px`; // Finalize height of completed page
          page = newPage();
          usedHeight = 0;
          currentBody = newTable();
        }
        currentBody.appendChild(row);
        usedHeight += rowHeight;
      }
    } else {
      const shell = node.cloneNode(false) as HTMLElement;
      page.appendChild(shell);
      const children = Array.from(node.children) as HTMLElement[];
      for (const child of children) {
          const childHeight = getOuterHeight(child);
          if(usedHeight + childHeight > a4Px.h && usedHeight > 0) {
              page.style.height = `${usedHeight}px`;
              page = newPage();
              usedHeight = 0;
              const nextShell = node.cloneNode(false) as HTMLElement;
              page.appendChild(nextShell);
              nextShell.appendChild(child);
              usedHeight += childHeight;
          } else {
              shell.appendChild(child);
              usedHeight += childHeight;
          }
      }
    }
  };

  const blocks = Array.from(working.children) as HTMLElement[];
  for (const block of blocks) {
    const blockHeight = getOuterHeight(block);
    if (usedHeight > 0 && usedHeight + blockHeight > a4Px.h) {
        page.style.height = `${usedHeight}px`;
        page = newPage();
        usedHeight = 0;
    }
    if (blockHeight > a4Px.h) {
        splitNode(block);
    } else {
        page.appendChild(block);
        usedHeight += blockHeight;
    }
  }
  
  const pages = Array.from(container.children) as HTMLElement[];
  if (pages.length === 0) throw new Error('Pagination produced 0 pages');
  pages.forEach(p => { if (!p.style.height) p.style.height = `${a4Px.h}px`; });
  return { pages, stage };
}

async function captureTallFallback(root: HTMLElement, doc: Document, a4Px: {w:number,h:number}) {
  const url = await toPng(root, {
    cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff',
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  const img = new Image(); img.src = url; await img.decode();

  const slices: ImageSlice[] = [];
  const canvas = doc.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.naturalWidth;

  let y = 0, idx = 0;
  while (y < img.naturalHeight) {
    const h = Math.min(a4Px.h, img.naturalHeight - y);
    canvas.height = h;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, y, img.naturalWidth, h, 0, 0, img.naturalWidth, h);
    const sliceUrl = canvas.toDataURL('image/png');
    const raw = sliceUrl.substring(sliceUrl.indexOf('base64,') + 7);
    const md5 = Md5.hashStr(raw);
    slices.push({ imageBase64: raw, wPx: canvas.width, hPx: h, routeName: location.pathname, pageIndex: idx, md5 });
    y += h; idx++;
  }
  return slices;
}


export async function captureRouteAsA4Pages(path: string, locale: 'en'|'de', opts: A4Opts = {}): Promise<ImageSlice[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4Px = {
    w: Math.floor((A4_PT.w - o.marginPt * 2) * pxPerPt),
    h: Math.floor((A4_PT.h - o.marginPt * 2) * pxPerPt),
  };

  const { win, doc, cleanup } = await loadRouteInIframe(path, locale);
  try {
    let root = doc.querySelector('[data-report-root]') as HTMLElement | null;
    if (!root) throw new Error(`[data-report-root] not found on route: ${path}`);
    
    // Resize event to help Recharts measure correctly
    win.dispatchEvent(new Event('resize'));
    await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));

    console.debug('[PDF DIAG]', { route: path, width: CAPTURE_WIDTH, recharts: doc.querySelectorAll('svg.recharts-surface').length, rootW: root?.offsetWidth, rootH: root?.offsetHeight });
    const { pages, stage } = paginateAttached(doc, root, a4Px);
    await waitIframeReady(win);

    const slices: ImageSlice[] = [];
    const seenHashes = new Set<string>();

    for (const [i, p] of pages.entries()) {
      let url = '';
      try {
        url = await toPng(p, {
          cacheBust: true, pixelRatio: 2, style: { transform: 'none' },
          skipFonts: false, useCORS: true,
          filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
        });
      } catch (e) {
        console.warn(`html-to-image failed for ${path} page ${i}, falling back to html2canvas`, e);
        try {
            const canvas = await html2canvas(p, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            url = canvas.toDataURL('image/png');
        } catch (e2) {
             console.error(`html2canvas also failed for ${path} page ${i}`, e2);
             continue;
        }
      }

      if (!url || !url.startsWith('data:image/png;base64,') || url.length < 2000) continue;
      
      const raw = rawFromDataUrl(url);
      const md5 = Md5.hashStr(raw);

      if (seenHashes.has(md5)) continue;
      seenHashes.add(md5);
      
      const img = new Image(); img.src = url; await img.decode().catch(()=>{});
      slices.push({ imageBase64: raw, wPx: img.naturalWidth || a4Px.w, hPx: img.naturalHeight || a4Px.h, routeName: path, pageIndex: i, md5 });
    }

    if (slices.length === 0) {
      console.warn(`Route ${path} produced 0 slices. Using tall-capture fallback.`);
      const rootForFallback = doc.querySelector('[data-report-root]') as HTMLElement | null;
      if (rootForFallback) {
        const fallbackSlices = await captureTallFallback(rootForFallback, doc, a4Px);
        stage.remove();
        cleanup();
        return fallbackSlices;
      }
    }
    
    const svgCount = doc.querySelectorAll('svg.recharts-surface').length;
    const rootEl = doc.querySelector('[data-report-root]') as HTMLElement | null;
    const rootWidth = rootEl?.getBoundingClientRect().width ?? 0;
    const narrow = rootWidth > 0 && rootWidth < 1100;

    ((window as any).__CAPTURE_DIAG__ ??= []).push({
      route: path,
      slices: slices.length,
      svgCount,
      rootWidth,
      narrow,
    });

    stage.remove();
    return slices;
  } finally {
    cleanup();
  }
}

export async function captureSummaryNodeRaw(node: HTMLElement): Promise<{raw:string; w:number; h:number}> {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, {
    cacheBust: true, pixelRatio: 2, style: { transform:'none' },
    skipFonts: false, useCORS: true,
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  if (!url?.startsWith('data:image/png;base64,')) throw new Error('Summary capture failed');
  const img = new Image(); img.src = url; await img.decode();
  return { raw: rawFromDataUrl(url), w: img.naturalWidth, h: img.naturalHeight };
}
