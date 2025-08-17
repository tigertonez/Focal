
// src/lib/pdfCapture.ts
export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };

const A4_PT = { w: 595, h: 842 }; // PDF points
const PT_PER_IN = 72;

export function dataUrlToRawBase64(dataUrl: string): string {
  if (!dataUrl?.startsWith('data:image/')) throw new Error('Invalid data URL');
  const i = dataUrl.indexOf('base64,'); if (i < 0) throw new Error('Missing base64 marker');
  return dataUrl.slice(i + 7);
}

export async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

/** Waits for fonts + 2 RAFs + small idle */
async function settle(win: Window) {
  try { await (win.document as any).fonts?.ready; } catch {}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await sleep(150);
}

/** Loads a route in a hidden same-origin iframe with ?print=1. Returns {win,doc,root}. */
export async function loadRouteInIframe(path: string): Promise<{win:Window,doc:Document,root:HTMLElement,cleanup:()=>void}> {
  const iframe = document.createElement('iframe');
  iframe.style.position='fixed'; iframe.style.left='-10000px'; iframe.style.top='-10000px';
  iframe.width='1200'; iframe.height='1800'; iframe.src = `${path}?print=1`;
  document.body.appendChild(iframe);
  await new Promise<void>(r => {
    if(!iframe.contentWindow) { // safety check
      setTimeout(()=>r(), 500);
      return;
    }
    iframe.onload = () => r()
  });

  const win = iframe.contentWindow!; const doc = iframe.contentDocument!;
  // mark as print mode
  doc.documentElement.setAttribute('data-print','1');
  return {
    win, doc,
    root: (doc.querySelector('[data-report-root]') as HTMLElement) || (doc.body.firstElementChild as HTMLElement) || doc.body as unknown as HTMLElement,
    cleanup: () => iframe.remove()
  };
}

/** Expand accordions/details inside iframe document. */
export async function expandAll(doc: Document) {
  doc.querySelectorAll('details').forEach(d => (d as HTMLDetailsElement).open = true);
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]'));
  for (const t of toggles) { try { t.click(); } catch {} await sleep(16); }
}

/** Returns an array of PNG raw base64 images; one per **A4 page**. */
export async function captureRouteAsA4Pages(path: string, opts: A4Opts = {}): Promise<string[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const a4ContentWpt = A4_PT.w - o.marginPt*2;
  const a4ContentHpt = A4_PT.h - o.marginPt*2;
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4ContentPx = { w: Math.floor(a4ContentWpt * pxPerPt), h: Math.floor(a4ContentHpt * pxPerPt) };

  const {win,doc,root,cleanup} = await loadRouteInIframe(path);
  try {
    await expandAll(doc);
    await settle(win);

    // Create virtual pagination: wrap content into .a4-page chunks of fixed px height
    const container = doc.createElement('div');
    container.id = 'a4-container';
    container.style.width = a4ContentPx.w + 'px';
    container.style.boxSizing = 'border-box';
    container.style.padding = '0';
    container.style.margin = '0 auto';
    doc.body.innerHTML = ''; doc.body.appendChild(container);

    // Move original root into a staging wrapper to measure child blocks
    const staging = doc.createElement('div');
    staging.style.width = a4ContentPx.w + 'px';
    staging.appendChild(root);
    doc.body.appendChild(staging);
    await settle(win);

    // Split by top-level blocks to avoid cutting lines mid-component
    const blocks = Array.from(root.children) as HTMLElement[];
    const pages: HTMLElement[] = [];
    let page = doc.createElement('div');
    page.className = 'a4-page'; page.style.width = a4ContentPx.w+'px'; page.style.minHeight = a4ContentPx.h+'px';
    page.style.boxSizing='border-box'; page.style.padding='0'; page.style.margin='0 auto';
    container.appendChild(page);
    pages.push(page);

    let used = 0;
    for (const block of blocks) {
      // ensure block is full width; avoid sticky/etc
      block.style.breakInside = 'avoid';
      block.style.pageBreakInside = 'avoid';
      const h = block.getBoundingClientRect().height || block.offsetHeight || 0;
      if (used + h > a4ContentPx.h && used > 0) {
        page = doc.createElement('div');
        page.className = 'a4-page'; page.style.width = a4ContentPx.w+'px'; page.style.minHeight = a4ContentPx.h+'px';
        container.appendChild(page);
        pages.push(page);
        used = 0;
      }
      page.appendChild(block);
      used += h;
    }

    await settle(win);

    // Capture each page node into PNG (raw base64)
    const { toPng } = await import('html-to-image');
    const raws: string[] = [];
    for (const p of pages) {
      const url = await toPng(p, {
        cacheBust: true,
        pixelRatio: 2,
        style: { transform:'none' },
        filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
      });
      const raw = dataUrlToRawBase64(url);
      if (raw && raw.length > 2000) raws.push(raw);
    }
    return raws;
  } finally {
    cleanup();
  }
}

/** Summary capture: capture a specific container element on the current page. */
export async function captureSummaryNodeRaw(node: HTMLElement): Promise<{raw:string,w:number,h:number}> {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    style: { transform:'none' },
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
  });
  const img = new Image(); img.src = url; await img.decode();
  return { raw: dataUrlToRawBase64(url), w: img.naturalWidth, h: img.naturalHeight };
}
