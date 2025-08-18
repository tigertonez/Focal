// src/lib/pdfCapture.ts
'use client';

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
  while ((!win.document || !win.document.body) && tries < 50) {
    await sleep(50); tries++;
  }
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
    const failover = setTimeout(res, 2000); // continue even if onload is slow
    iframe.onload = () => { clearTimeout(failover); res(); };
  });

  if (!iframe.contentWindow) throw new Error('Iframe window unavailable');
  const win = iframe.contentWindow;
  await waitIframeReady(win);
  const doc = iframe.contentDocument!;
  doc.documentElement.setAttribute('data-print','1');
  return { win, doc, cleanup: () => iframe.remove() };
}

/** Build A4 pages INSIDE the DOM so measurements are correct. */
function paginateAttached(doc: Document, sourceRoot: HTMLElement, a4Px: {w:number,h:number}) {
  // Stage holds the printable pages; keep original content hidden but in DOM.
  let stage = doc.getElementById('__print_stage__') as HTMLElement | null;
  if (!stage) {
    stage = doc.createElement('div');
    stage.id = '__print_stage__';
    doc.body.appendChild(stage);
  }
  Object.assign(stage.style, { width:`${a4Px.w}px`, margin:'0 auto', boxSizing:'border-box' });

  // Hide original root so it doesn’t interfere with layout.
  sourceRoot.style.visibility = 'hidden';
  sourceRoot.style.position = 'absolute';
  sourceRoot.style.left = '-999999px';

  // Clone content to avoid mutating live components.
  const cloned = sourceRoot.cloneNode(true) as HTMLElement;
  stage.innerHTML = ''; // fresh run
  stage.appendChild(cloned);

  // Container that will hold page DIVs (attached to DOM!)
  const container = doc.createElement('div');
  stage.appendChild(container);

  const newPage = () => {
    const p = doc.createElement('div');
    Object.assign(p.style, {
      width: `${a4Px.w}px`,
      minHeight: `${a4Px.h}px`,
      boxSizing: 'border-box',
      margin: '0 auto',
      padding: '0'
    });
    container.appendChild(p);
    return p;
  };

  let page = newPage();
  let used = 0;

  const push = (el: HTMLElement) => {
    el.style.breakInside = 'avoid';
    el.style.pageBreakInside = 'avoid';
    page.appendChild(el);
    used = page.offsetHeight;
  };

  const splitTable = (table: HTMLTableElement) => {
    const rows = Array.from((table.tBodies[0] ?? table).rows) as HTMLElement[];
    const head = table.tHead ? (table.tHead.cloneNode(true) as HTMLElement) : null;

    let cur = doc.createElement('table');
    cur.className = table.className;
    cur.style.width = '100%';
    if (head) cur.appendChild(head.cloneNode(true));
    page.appendChild(cur);

    const body = doc.createElement('tbody');
    cur.appendChild(body);

    for (const row of rows) {
      body.appendChild(row);
      if (page.offsetHeight > a4Px.h) {
        // move row to next page
        body.removeChild(row);
        page = newPage();
        used = 0;
        cur = doc.createElement('table');
        cur.className = table.className;
        cur.style.width = '100%';
        if (head) cur.appendChild(head.cloneNode(true));
        page.appendChild(cur);
        const nb = doc.createElement('tbody'); cur.appendChild(nb);
        nb.appendChild(row);
      }
    }
  };

  const splitDeep = (node: HTMLElement) => {
    if (node.tagName === 'TABLE') return splitTable(node as HTMLTableElement);

    const shell = node.cloneNode(false) as HTMLElement;
    push(shell);
    const kids = Array.from(node.children) as HTMLElement[];
    for (const k of kids) {
      shell.appendChild(k);
      if (page.offsetHeight > a4Px.h) {
        shell.removeChild(k);
        page = newPage();
        used = 0;
        const nextShell = node.cloneNode(false) as HTMLElement;
        page.appendChild(nextShell);
        nextShell.appendChild(k);
      }
    }
  };

  const blocks = Array.from(cloned.children) as HTMLElement[];
  for (const b of blocks) {
    const h = (b.getBoundingClientRect().height || b.offsetHeight || 0);
    if (used > 0 && (used + h) > a4Px.h) {
      page = newPage(); used = 0;
    }
    if (h > a4Px.h) splitDeep(b); else push(b);
  }

  const pages = Array.from(container.children) as HTMLElement[];
  if (pages.length === 0) throw new Error('Pagination produced 0 pages');
  return { pages, stage, sourceRoot };
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
    // Find capture root; if missing, wrap body children
    let root = doc.querySelector('[data-report-root]') as HTMLElement | null;
    if (!root) {
      root = doc.createElement('div');
      root.setAttribute('data-report-root','1');
      while (doc.body.firstChild) root.appendChild(doc.body.firstChild);
      doc.body.appendChild(root);
    }

    const { pages, stage, sourceRoot } = paginateAttached(doc, root, a4Px);

    // Capture attached pages
    const { toPng } = await import('html-to-image');
    const slices: ImageSlice[] = [];
    for (const p of pages) {
      const url = await toPng(p, {
        cacheBust: true,
        pixelRatio: 2,
        style: { transform: 'none' },
        skipFonts: false,
        useCORS: true,
        filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
      }).catch(async () => {
        await waitIframeReady(win);
        return toPng(p, { cacheBust:true, pixelRatio:2, style:{transform:'none'}, skipFonts:false, useCORS:true });
      });

      if (!url || !url.startsWith('data:image/png;base64,')) continue;
      const raw = rawFromDataUrl(url);
      if (raw.length < 2000) continue;
      const img = new Image(); img.src = url; await img.decode().catch(()=>{});
      slices.push({ imageBase64: raw, wPx: img.naturalWidth || a4Px.w, hPx: img.naturalHeight || a4Px.h });
    }

    // restore visibility then cleanup
    sourceRoot.style.visibility = '';
    sourceRoot.style.position = '';
    sourceRoot.style.left = '';
    stage.remove();

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
