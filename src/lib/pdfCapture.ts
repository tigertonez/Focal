
'use client';
export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };

export type ImageSlice = { imageBase64: string; wPx: number; hPx: number };

const A4_PT = { w: 595.28, h: 841.89 };
const PT_PER_IN = 72;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));
const dataUrlToRaw = (url:string)=>{
  const i = url.indexOf('base64,'); if (i<0) throw new Error('Missing base64 marker');
  return url.slice(i+7);
};

async function waitReady(win: Window) {
  const doc = win.document;
  try { await (doc as any).fonts?.ready; } catch {}
  // wait for route's own signal; fallback to layout settle
  if (win.__PRINT_READY__) {
    await win.__PRINT_READY__;
  } else {
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await sleep(120);
  }
}

export async function loadRouteInIframe(path: string, locale: 'en'|'de'): Promise<{win:Window,doc:Document,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.width = '1400';
  iframe.height = '2400';
  iframe.src = `${path}${path.includes('?') ? '&' : '?'}print=1&lang=${locale}`;
  document.body.appendChild(iframe);

  await new Promise<void>((res, rej) => {
    const t = setTimeout(()=>res(), 5000); // continue even if onload not firing
    iframe.onload = () => { clearTimeout(t); res(); };
  });

  if (!iframe.contentWindow) throw new Error('Iframe window unavailable');
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument!;
  doc.documentElement.setAttribute('data-print','1');
  return { win, doc, cleanup: ()=> iframe.remove() };
}

/** Recursively fill A4 pages: split oversized blocks and tables */
function paginateIntoPages(doc: Document, root: HTMLElement, a4Px: {w:number,h:number}): HTMLElement[] {
  const container = doc.createElement('div');
  const pages: HTMLElement[] = [];
  const newPage = ()=> {
    const p = doc.createElement('div');
    Object.assign(p.style, { width:`${a4Px.w}px`, minHeight:`${a4Px.h}px`, boxSizing:'border-box', margin:'0 auto', padding:'0' });
    container.appendChild(p); pages.push(p); return p;
  };
  let page = newPage();
  let used = 0;

  const pushNode = (el: HTMLElement) => {
    el.style.breakInside = 'avoid';
    el.style.pageBreakInside = 'avoid';
    page.appendChild(el);
    used = page.scrollHeight; // re-measure
  };

  const splitNode = (el: HTMLElement) => {
    // Handle tables specially by moving rows across pages
    if (el.tagName === 'TABLE') {
      const table = el;
      const cloneTop = table.cloneNode(false) as HTMLElement;
      const cloneBottom = table.cloneNode(false) as HTMLElement;
      const tbody = table.querySelector('tbody') || table;
      const rows = Array.from(tbody.children) as HTMLElement[];
      const topBody = doc.createElement('tbody');
      const botBody = doc.createElement('tbody');
      cloneTop.appendChild(topBody); cloneBottom.appendChild(botBody);

      for (const row of rows) {
        page.appendChild(cloneTop);
        topBody.appendChild(row);
        if (page.scrollHeight > a4Px.h) {
          // move last row to bottom page
          topBody.removeChild(row);
          botBody.appendChild(row);
          page = newPage();
          used = 0;
          page.appendChild(cloneBottom);
        }
      }
      return;
    }
    // Generic deep split: move children one-by-one, create new pages as needed
    const children = Array.from(el.children) as HTMLElement[];
    const shell = el.cloneNode(false) as HTMLElement;
    pushNode(shell);
    for (const child of children) {
      shell.appendChild(child);
      if (page.scrollHeight > a4Px.h) {
        // move child to next page
        shell.removeChild(child);
        page = newPage();
        const nextShell = el.cloneNode(false) as HTMLElement;
        page.appendChild(nextShell);
        nextShell.appendChild(child);
      }
    }
  };

  const walk = (node: HTMLElement) => {
    const h = node.getBoundingClientRect().height || node.offsetHeight || 0;
    if (h === 0) { pushNode(node); return; }

    // start new page if this block won't fit and current page has content
    if (used > 0 && (used + h) > a4Px.h) {
      page = newPage(); used = 0;
    }

    // If still too tall for a fresh page, we must split
    if (h > a4Px.h) {
      splitNode(node);
      used = page.scrollHeight;
    } else {
      pushNode(node);
    }
  };

  Array.from(root.children).forEach(ch => walk(ch as HTMLElement));
  return pages;
}

export async function captureRouteAsA4Pages(path: string, locale: 'en'|'de', opts: A4Opts = {}): Promise<ImageSlice[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4Px = {
    w: Math.floor((A4_PT.w - o.marginPt*2) * pxPerPt),
    h: Math.floor((A4_PT.h - o.marginPt*2) * pxPerPt),
  };

  const { win, doc, cleanup } = await loadRouteInIframe(path, locale);
  try {
    await waitReady(win);

    // Find capture root
    const root = (doc.querySelector('[data-report-root]') as HTMLElement) || (doc.body.firstElementChild as HTMLElement) || doc.body as unknown as HTMLElement;

    // Build virtual pages container and paginate
    const stage = doc.createElement('div');
    Object.assign(stage.style, { width:`${a4Px.w}px`, margin:'0 auto' });
    doc.body.innerHTML = '';
    doc.body.appendChild(stage);

    // Clone content before pagination to avoid mutating live nodes that manage state
    const clone = root.cloneNode(true) as HTMLElement;
    stage.appendChild(clone);

    const pages = paginateIntoPages(doc, clone, a4Px);
    await waitReady(win);

    // Capture each page
    const { toPng } = await import('html-to-image');
    const slices: ImageSlice[] = [];
    for (const p of pages) {
      const url = await toPng(p, {
        cacheBust: true,
        pixelRatio: 2,
        style: { transform:'none' },
        skipFonts: false,
        useCORS: true,
        filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
      }).catch(async () => {
        // retry once after a small settle
        await waitReady(win);
        return toPng(p, { cacheBust:true, pixelRatio:2, style:{transform:'none'}, skipFonts:false, useCORS:true });
      });

      if (!url || !url.startsWith('data:image/png;base64,')) continue;
      const raw = dataUrlToRaw(url);
      if (raw.length < 2000) continue; // guard tiny/empty
      const img = new Image();
      img.src = url; await img.decode().catch(()=>{});
      slices.push({ imageBase64: raw, wPx: img.naturalWidth || a4Px.w, hPx: img.naturalHeight || a4Px.h });
    }
    return slices;
  } finally {
    cleanup();
  }
}

/** Single node capture (Summary) – unchanged API */
export async function captureSummaryNodeRaw(node: HTMLElement): Promise<{raw:string,w:number,h:number}> {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    style: { transform:'none' },
    skipFonts: false,
    useCORS: true,
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  if (!url || !url.startsWith('data:image/png;base64,')) throw new Error('Summary capture failed');
  const img = new Image(); img.src = url; await img.decode();
  const raw = dataUrlToRaw(url);
  return { raw, w: img.naturalWidth, h: img.naturalHeight };
}
