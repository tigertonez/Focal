'use client';

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
  if (document.documentElement.className) { // copy theme class (e.g. "dark")
    doc.documentElement.className = document.documentElement.className;
  }
  return { win, doc, cleanup: () => iframe.remove() };
}

/** Build A4 pages INSIDE the DOM so measurements are correct. */
function paginateAttached(doc: Document, sourceRoot: HTMLElement, a4Px: {w:number,h:number}) {
  // Stage holds the printable pages; keep original content hidden but in DOM.
  let stage = doc.getElementById('__print_stage__') as HTMLElement | null;
  if (stage) stage.remove(); // clear from previous runs
  
  stage = doc.createElement('div');
  stage.id = '__print_stage__';
  doc.body.appendChild(stage);
  Object.assign(stage.style, { width:`${a4Px.w}px`, margin:'0 auto', boxSizing:'border-box', overflow:'visible' });

  // Clone content into the stage to avoid mutating live components
  const cloned = sourceRoot.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('[data-no-print="true"]').forEach(el => el.remove());
  stage.appendChild(cloned);

  const container = doc.createElement('div');
  stage.appendChild(container);

  const newPage = () => {
    const p = doc.createElement('div');
    Object.assign(p.style, {
      width: `${a4Px.w}px`,
      minHeight: `${a4Px.h}px`,
      height: `${a4Px.h}px`, // fixed height for page
      overflow: 'hidden',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      margin: '0 auto',
      padding: '0'
    });
    container.appendChild(p);
    return p;
  };
  
  const pages: HTMLElement[] = [];
  let currentPage = newPage();
  pages.push(currentPage);

  const walkAndSplit = (node: HTMLElement, currentY: number) => {
    if (node.tagName === 'TABLE') {
      const head = node.querySelector('thead');
      const body = node.querySelector('tbody');
      if (body) {
        const rows = Array.from(body.rows) as HTMLElement[];
        let tableOnPage = currentPage.querySelector(`[data-table-id="${node.id}"]`) as HTMLElement | null;

        rows.forEach(row => {
          if (!tableOnPage) {
            tableOnPage = node.cloneNode(false) as HTMLElement;
            if(head) tableOnPage.appendChild(head.cloneNode(true));
            tableOnPage.appendChild(doc.createElement('tbody'));
            tableOnPage.setAttribute('data-table-id', node.id || `tbl-${Math.random()}`);
            currentPage.appendChild(tableOnPage);
          }
          const tableBody = tableOnPage.querySelector('tbody')!;
          tableBody.appendChild(row);

          if (currentPage.scrollHeight > a4Px.h) {
            tableBody.removeChild(row);
            currentPage = newPage();
            pages.push(currentPage);
            tableOnPage = null; // force new table on new page
            // Re-add row to new page
            tableOnPage = node.cloneNode(false) as HTMLElement;
            if(head) tableOnPage.appendChild(head.cloneNode(true));
            tableOnPage.appendChild(doc.createElement('tbody'));
            tableOnPage.setAttribute('data-table-id', node.id || `tbl-${Math.random()}`);
            currentPage.appendChild(tableOnPage);
            tableOnPage.querySelector('tbody')!.appendChild(row);
          }
        });
      }
    } else {
      const children = Array.from(node.children) as HTMLElement[];
      for (const child of children) {
          const childHeight = child.offsetHeight;
          if ((currentPage.scrollHeight + childHeight) > a4Px.h && currentPage.childNodes.length > 0) {
              currentPage = newPage();
              pages.push(currentPage);
          }
          currentPage.appendChild(child);
      }
    }
  }

  walkAndSplit(cloned, 0);

  if (pages.length === 0) throw new Error('Pagination produced 0 pages');
  return { pages, stage, sourceRoot: cloned };
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
    if (!root) {
      root = doc.createElement('div');
      root.setAttribute('data-report-root','1');
      while (doc.body.firstChild) root.appendChild(doc.body.firstChild);
      doc.body.appendChild(root);
    }
    
    await waitIframeReady(win);
    
    const { pages } = paginateAttached(doc, root, a4Px);

    const slices: ImageSlice[] = [];
    const { toPng } = await import('html-to-image');

    for (const p of pages) {
      let url: string | undefined;
      try {
        url = await toPng(p, { cacheBust: true, pixelRatio: 2, useCORS:true, style:{transform:'none'}, skipFonts: false });
      } catch(e) {
        console.warn('html-to-image failed, trying html2canvas', e);
        try {
          const canvas = await html2canvas(p, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          url = canvas.toDataURL('image/png');
        } catch (e2) {
          console.error('html2canvas also failed', e2);
        }
      }

      if (!url || !url.startsWith('data:image/png;base64,') || url.length < 10000) continue;
      
      const raw = rawFromDataUrl(url);
      const img = new Image();
      img.src = url;
      try { await img.decode(); } catch {}
      slices.push({ imageBase64: raw, wPx: img.naturalWidth || a4Px.w, hPx: img.naturalHeight || a4Px.h });
    }
    
    if(slices.length === 0) throw new Error("No printable content was captured (0 slices).");

    return slices;
  } finally {
    cleanup();
  }
}

/** Single-page capture for Summary (unchanged): */
export async function captureSummaryNodeRaw(node: HTMLElement): Promise<{raw:string; w:number; h:number}> {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    style: { transform:'none' },
    skipFonts: false,
    useCORS: true,
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  if (!url?.startsWith('data:image/png;base64,')) throw new Error('Summary capture failed');
  const img = new Image(); img.src = url; await img.decode().catch(()=>{});
  return { raw: rawFromDataUrl(url), w: img.naturalWidth, h: img.naturalHeight };
}
