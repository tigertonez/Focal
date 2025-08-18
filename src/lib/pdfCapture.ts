// src/lib/pdfCapture.ts
export type A4Opts = { marginPt?: number; dpi?: number };
export const DEFAULT_A4: Required<A4Opts> = { marginPt: 24, dpi: 150 };

const A4_PT = { w: 595.28, h: 841.89 }; // A4 in points
const PT_PER_IN = 72;

export type ImageSlice = { imageBase64: string; wPx: number; hPx: number; name?: string };

export function dataUrlToRawBase64(dataUrl: string): string {
  if (!dataUrl?.startsWith('data:image/')) throw new Error('Invalid data URL');
  const i = dataUrl.indexOf('base64,');
  if (i < 0) throw new Error('Missing base64 marker');
  return dataUrl.slice(i + 7);
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Waits for fonts + 2 RAFs + small idle */
async function settle(win: Window) {
  try {
    await (win.document as any).fonts?.ready;
  } catch {}
  await new Promise((r) => win.requestAnimationFrame(() => win.requestAnimationFrame(r)));
  await sleep(120);
}

/** Loads a route in a hidden same-origin iframe with ?print=1. Returns {win,doc,root,cleanup}. */
export async function loadRouteInIframe(
  path: string
): Promise<{ win: Window; doc: Document; root: HTMLElement; cleanup: () => void }> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-10000px';
  iframe.width = '1400';
  iframe.height = '2400';
  iframe.src = `${path}${path.includes('?') ? '&' : '?'}print=1`;
  document.body.appendChild(iframe);

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    // safety: resolve if load doesn't fire (rare), but after a delay
    setTimeout(resolve, 3000);
  });

  const win = iframe.contentWindow!;
  const doc = iframe.contentDocument!;

  // mark as print mode
  doc.documentElement.setAttribute('data-print', '1');

  // Robust root detection (prefer explicit markers; then main content)
  const root =
    (doc.querySelector('[data-report-root]') as HTMLElement) ||
    (doc.getElementById('report-content') as HTMLElement) ||
    (doc.querySelector('main') as HTMLElement) ||
    (doc.querySelector('[role="main"]') as HTMLElement) ||
    (doc.body.firstElementChild as HTMLElement) ||
    (doc.body as unknown as HTMLElement);

  return {
    win,
    doc,
    root,
    cleanup: () => iframe.remove(),
  };
}

/** Expand accordions/details inside iframe document. */
export async function expandAll(doc: Document) {
  // Details
  doc.querySelectorAll('details').forEach((d) => ((d as HTMLDetailsElement).open = true));

  // Radix/other toggles
  const toggles = Array.from(
    doc.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]')
  );
  for (const t of toggles) {
    try {
      t.click();
    } catch {}
    await sleep(16);
  }
}

/** Returns an array of PNG slices (objects) sized for A4; one object per A4 page. */
export async function captureRouteAsA4Pages(path: string, opts: A4Opts = {}): Promise<ImageSlice[]> {
  const o = { ...DEFAULT_A4, ...opts };
  const a4ContentWpt = A4_PT.w - o.marginPt * 2;
  const a4ContentHpt = A4_PT.h - o.marginPt * 2;
  const pxPerPt = o.dpi / PT_PER_IN;
  const a4ContentPx = {
    w: Math.floor(a4ContentWpt * pxPerPt),
    h: Math.floor(a4ContentHpt * pxPerPt),
  };

  const { win, doc, root, cleanup } = await loadRouteInIframe(path);
  try {
    await expandAll(doc);
    await settle(win);

    // Create virtual pagination container
    const container = doc.createElement('div');
    container.id = 'a4-container';
    container.style.width = a4ContentPx.w + 'px';
    container.style.boxSizing = 'border-box';
    container.style.padding = '0';
    container.style.margin = '0 auto';

    // Staging wrapper to measure/move child blocks
    const staging = doc.createElement('div');
    staging.style.width = a4ContentPx.w + 'px';
    staging.appendChild(root);

    // Replace body with container + staging
    doc.body.innerHTML = '';
    doc.body.appendChild(container);
    doc.body.appendChild(staging);
    await settle(win);

    // Split by top-level blocks to avoid cutting mid-component
    const blocks = Array.from(root.children) as HTMLElement[];
    const pages: HTMLElement[] = [];
    let page = doc.createElement('div');
    page.className = 'a4-page';
    Object.assign(page.style, {
      width: a4ContentPx.w + 'px',
      minHeight: a4ContentPx.h + 'px',
      boxSizing: 'border-box',
      padding: '0',
      margin: '0 auto',
    });
    container.appendChild(page);
    pages.push(page);

    let used = 0;
    for (const block of blocks) {
      block.style.breakInside = 'avoid';
      block.style.pageBreakInside = 'avoid';
      const rect = block.getBoundingClientRect();
      const h = Math.ceil(rect.height || block.offsetHeight || 0);

      if (used + h > a4ContentPx.h && used > 0) {
        page = doc.createElement('div');
        page.className = 'a4-page';
        Object.assign(page.style, {
          width: a4ContentPx.w + 'px',
          minHeight: a4ContentPx.h + 'px',
          boxSizing: 'border-box',
          padding: '0',
          margin: '0 auto',
        });
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
    const out: ImageSlice[] = [];
    let idx = 0;
    for (const p of pages) {
      const url = await toPng(p, {
        cacheBust: true,
        pixelRatio: 2,
        style: { transform: 'none' },
        filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
        imagePlaceholder:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
      });
      if (!url) continue;

      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } catch {
        continue;
      }

      const raw = dataUrlToRawBase64(url);
      if (raw && raw.length > 2000) {
        out.push({ imageBase64: raw, wPx: img.naturalWidth, hPx: img.naturalHeight, name: `page-${idx++}` });
      }
    }
    return out;
  } finally {
    cleanup();
  }
}

/** Summary capture: capture a specific container element on the current page. */
export async function captureSummaryNodeRaw(
  node: HTMLElement
): Promise<{ raw: string; w: number; h: number }> {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    style: { transform: 'none' },
    filter: (el) => !(el as HTMLElement).closest?.('[data-no-print="true"]'),
    imagePlaceholder:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
  });
  if (!url) throw new Error('Capture failed: empty data URL');

  const img = new Image();
  img.src = url;
  await img.decode();

  return { raw: dataUrlToRawBase64(url), w: img.naturalWidth, h: img.naturalHeight };
}