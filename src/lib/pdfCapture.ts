'use client';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };
export type ImageSlice = { imageBase64: string; wPx: number; hPx: number };

const A4_PT = { w: 595.28, h: 841.89 };
const PT_PER_IN = 72;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const rawFromDataUrl = (url:string)=> {
  const i = url.indexOf('base64,'); if (i < 0) throw new Error('Missing base64 marker');
  return url.slice(i+7);
};

/** Wait until iframe has a body and the route signalled readiness. */
async function waitIframeReady(win: Window) {
  let tries = 0;
  while ((!win.document || win.document.readyState !== 'complete' || !win.document.body) && tries < 60) {
    await sleep(50); tries++;
  }
  if (!win.document.body) throw new Error('Iframe document body not found after timeout.');

  try { await (win.document as any).fonts?.ready; } catch {}
  
  // route may set window.__PRINT_READY__ via signalPrintReady()
  if ((win as any).__PRINT_READY__) {
    await (win as any).__PRINT_READY__;
  } else {
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await sleep(120);
  }
}

/** Load route in same-origin iframe with print flags; guarantee body exists. */
export async function loadRouteInIframe(path: string, locale: 'en'|'de'): Promise<{win:Window,doc:Document,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.width = '1400';
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
  if (document.documentElement.className) {
    doc.documentElement.className = document.documentElement.className;
  }
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
          page.style.height = `${a4Px.h}px`;
          page = newPage();
          usedHeight = 0;
          currentBody = newTable();
        }
        currentBody.appendChild(row);
        usedHeight += rowHeight;
      }
    } else {
      // Generic deep node split
      const shell = node.cloneNode(false) as HTMLElement;
      page.appendChild(shell);
      const children = Array.from(node.children) as HTMLElement[];
      for (const child of children) {
          const childHeight = getOuterHeight(child);
          if(usedHeight + childHeight > a4Px.h && usedHeight > 0) {
              page.style.height = `${a4Px.h}px`;
              page = newPage();
              usedHeight = 0;
              const nextShell = node.cloneNode(false) as HTMLElement;
              page.appendChild(nextShell);
              nextShell.appendChild(child);
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
        page.style.height = `${a4Px.h}px`;
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
  pages.forEach(p => p.style.height = `${a4Px.h}px`);
  return { pages, stage };
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
    
    const { pages, stage } = paginateAttached(doc, root, a4Px);
    await waitIframeReady(win);

    const slices: ImageSlice[] = [];
    for (const p of pages) {
      let url = '';
      try {
        url = await toPng(p, {
          cacheBust: true, pixelRatio: 2, style: { transform: 'none' },
          skipFonts: false, useCORS: true,
          filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
        });
      } catch (e) {
        console.warn('html-to-image failed, falling back to html2canvas', e);
        try {
            const canvas = await html2canvas(p, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            url = canvas.toDataURL('image/png');
        } catch (e2) {
             console.error('html2canvas also failed', e2);
        }
      }

      if (!url || !url.startsWith('data:image/png;base64,') || url.length < 10000) continue;
      const raw = rawFromDataUrl(url);
      if (raw.length < 2000) continue;
      const img = new Image(); img.src = url; await img.decode().catch(()=>{});
      slices.push({ imageBase64: raw, wPx: img.naturalWidth || a4Px.w, hPx: img.naturalHeight || a4Px.h });
    }
    
    stage.remove();
    if (slices.length === 0) throw new Error('No printable content was captured (0 slices).');
    return slices;
  } finally {
    cleanup();
  }
}

export async function captureSummaryNodeRaw(node: HTMLElement): Promise<{raw:string; w:number; h:number}> {
  const url = await toPng(node, {
    cacheBust: true, pixelRatio: 2, style: { transform:'none' },
    skipFonts: false, useCORS: true,
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  if (!url?.startsWith('data:image/png;base64,')) throw new Error('Summary capture failed');
  const img = new Image(); img.src = url; await img.decode();
  return { raw: rawFromDataUrl(url), w: img.naturalWidth, h: img.naturalHeight };
}
