
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Loader2, TestTube } from 'lucide-react';
import { toPng } from 'html-to-image';


// =================================================================
// Configuration & Constants
// =================================================================
const FULL_REPORT_ROUTES = ['/inputs', '/revenue', '/costs', '/profit', '/cash-flow', '/summary'] as const;
type AppRoute = typeof FULL_REPORT_ROUTES[number];

// =================================================================
// Capture & Utility Functions
// =================================================================

// Wait helpers
const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

// Wait for fonts, images, and an optional page readiness flag
async function waitForStable(win: Window, maxMs = 6000) {
  const d = win.document;

  // fonts
  if ('fonts' in d) { try { await (d as any).fonts.ready; } catch {} }

  // images
  const imgs = Array.from(d.images || []);
  await Promise.all(imgs.map(img => (img.decode?.() ?? Promise.resolve()).catch(()=>{})));

  // settle layout: watch scrollHeight stabilize
  const start = Date.now();
  let last = d.documentElement.scrollHeight;
  for (;;) {
    await sleep(150);
    const nowH = d.documentElement.scrollHeight;
    const stable = Math.abs(nowH - last) < 2;
    last = nowH;

    // allow pages to signal "I finished populating dynamic data"
    const readyFlag = (win as any).__PDF_READY__ === true;

    if (stable && readyFlag) break;
    if (Date.now() - start > maxMs) break;
  }

  // extra 2 RAFs to flush layout
  await raf2();
}

// Put the page into "print mode" inside the iframe
function enablePdfMode(d: Document) {
  d.documentElement.classList.add('pdf-mode');
  if (!d.head.querySelector('style[data-injected="pdf-mode"]')) {
    const style = d.createElement('style');
    style.setAttribute('data-injected', 'pdf-mode');
    style.textContent = `
      .pdf-mode *{animation:none!important;transition:none!important}
      .pdf-mode{font-synthesis:none!important;text-rendering:geometricPrecision!important;
        -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
      /* hide chrome */
      .pdf-mode header,.pdf-mode nav,.pdf-mode footer,[data-hide-in-pdf="true"]{display:none!important}
      /* unstick */
      .pdf-mode [style*="position:sticky"],.pdf-mode .sticky{position:static!important;top:auto!important}
      .pdf-mode [style*="position:fixed"]{position:static!important}
      /* overflow -> visible so nothing is clipped */
      .pdf-mode .overflow-auto,.pdf-mode .overflow-y-auto,.pdf-mode .overflow-hidden{overflow:visible!important}
      /* try to open common collapsibles */
      .pdf-mode details{open:true!important}
      .pdf-mode [data-state="closed"]{display:block!important;height:auto!important;opacity:1!important}
      .pdf-mode [data-accordion-content],[data-collapsible-content]{display:block!important;height:auto!important}
      /* full width containers for clean slicing */
      .pdf-mode .container{max-width:100%!important}
    `;
    d.head.appendChild(style);
  }
}

// Best-effort: open toggles from common libs (HeadlessUI/Radix/custom)
function forceOpenToggles(d: Document) {
  d.querySelectorAll<HTMLElement>('[aria-expanded="false"],[data-state="closed"]').forEach(el => {
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      try { (el as HTMLButtonElement).click(); } catch {}
    }
  });
  d.querySelectorAll('details').forEach((dtl:any)=> dtl.open = true);
}

// Capture a route inside an iframe that remains visible to layout (opacity:0 instead of visibility:hidden).
async function captureRouteInIframe(route: string, pxWidth = 1440): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.src = `${route}${route.includes('?') ? '&' : '?'}pdf=1`;
    Object.assign(iframe.style, {
      position:'fixed', left:'0', top:'0',
      width:`${pxWidth}px`, height:'100vh',
      opacity:'0', pointerEvents:'none', border:'0', zIndex:'-1', display:'block',
    });
    document.body.appendChild(iframe);

    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow!;
        const d = win.document;

        enablePdfMode(d);
        forceOpenToggles(d);

        // Scroll to bottom then top to trigger lazy/virtualized content
        win.scrollTo(0, d.documentElement.scrollHeight);
        await raf2();
        win.scrollTo(0, 0);

        // Expand iframe to full doc height for capture
        iframe.style.height = `${d.documentElement.scrollHeight}px`;

        await waitForStable(win);

        // HiDPI capture
        const node = d.documentElement;
        const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor:'#fff' });

        const img = new Image();
        img.onload = () => { cleanup(); resolve(img); };
        img.onerror = (e) => { cleanup(); reject(e); };
        img.src = dataUrl;
      } catch (e) {
        cleanup(); reject(e);
      }
    };
    iframe.onerror = (e) => { cleanup(); reject(e); };
  });
}

// Slice tall image to A4 content slices
function sliceForA4(img: HTMLImageElement, opts: { marginMm?: number, dpi?: number } = {}) {
  const marginMm = opts.marginMm ?? 12;
  const dpi = opts.dpi ?? 300;
  const mmToPx = (mm:number) => Math.round((mm/25.4)*dpi);
  const A4W = mmToPx(210), A4H = mmToPx(297);
  const contentW = A4W - 2*mmToPx(marginMm);
  const contentH = A4H - 2*mmToPx(marginMm);

  const scale = contentW / img.naturalWidth;
  const scaledW = Math.round(img.naturalWidth * scale);
  const scaledH = Math.round(img.naturalHeight * scale);

  const scaled = document.createElement('canvas');
  scaled.width = scaledW; scaled.height = scaledH;
  const sctx = scaled.getContext('2d')!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(img, 0, 0, scaledW, scaledH);

  const out: string[] = [];
  for (let y=0; y<scaledH; y += contentH) {
    const h = Math.min(contentH, scaledH - y);
    const c = document.createElement('canvas');
    c.width = contentW; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(scaled, 0, y, contentW, h, 0, 0, contentW, h);
    out.push(c.toDataURL('image/png'));
  }
  return { slices: out, page:'A4' };
}

function dataUrlToBase64(dataUrl: string) {
    return dataUrl.split(',')[1];
}


// =================================================================
// Main Component
// =================================================================

export function DownloadReportButton() {
  const [isBusy, setIsBusy] = React.useState(false);
  const { toast } = useToast();

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isBusy) return;
    setIsBusy(true);

    const isProbe = event.shiftKey;
    const isFullReport = event.altKey || (event.metaKey && !event.shiftKey);
    const title = isFullReport ? 'FullForecastReport' : 'ForecastReport';
    
    try {
      let payload: any;

      if (isFullReport) {
          const allSlices: { base64: string, width: number, height: number }[] = [];
          const slicesPerRoute: Record<string, number> = {};

          for (const route of FULL_REPORT_ROUTES) {
              try {
                  console.log(`[PDF] Capturing route: ${route}`);
                  const capturedImg = await captureRouteInIframe(route);
                  const { slices } = sliceForA4(capturedImg);
                  console.log(`[PDF] Sliced ${route} into ${slices.length} pages.`);
                  slicesPerRoute[route] = slices.length;

                  slices.forEach(sliceDataUrl => {
                     const img = new Image();
                     img.src = sliceDataUrl;
                     allSlices.push({
                         base64: dataUrlToBase64(sliceDataUrl),
                         width: img.width,
                         height: img.height
                     });
                  });
              } catch(e: any) {
                  console.warn(`[PDF] Skipping route ${route} due to capture error:`, e.message);
                  slicesPerRoute[route] = 0;
              }
          }
          payload = { 
            images: allSlices,
            page: 'A4',
            margin: 36,
            mode: 'full',
            title,
          };
          if (isProbe) {
            payload.debug = true;
            payload.slicesPerRoute = slicesPerRoute;
          }
      } else { // Single page
          const node = document.getElementById('report-content');
          if (!node) throw new Error("Could not find #report-content element.");
          
          enablePdfMode(document);
          forceOpenToggles(document);
          await raf2();

          const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor:'#fff' });
          const img = new Image();
          img.src = dataUrl;
          await new Promise(r => img.onload = r);
          
          payload = {
              imageBase64: dataUrlToBase64(dataUrl),
              width: img.naturalWidth,
              height: img.naturalHeight,
              page: 'auto',
              fit: 'contain',
              margin: 36,
              title,
          };
           if (isProbe) payload.debug = true;
      }
      
      const response = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isProbe && { 'Accept': 'application/json' }),
        },
        body: JSON.stringify(payload),
      });
      
      if (isProbe) {
        const jsonData = await response.json();
        alert(`PDF PROBE:\n${JSON.stringify(jsonData, null, 2)}`);
        return;
      }
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(`PDF generation failed: ${errorJson.code || response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('PDF download error:', err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: err.message || 'An unknown error occurred. Please try again.',
      });
      window.open(`/print/report?title=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isBusy} data-testid="download-report" className="group">
      {isBusy ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Download className="mr-2" />
      )}
      {isBusy ? 'Generating...' : 'Download Report'}
      <TestTube className="ml-2 h-3 w-3 opacity-60 group-hover:opacity-100" title="Hold Shift for Probe, Alt/Opt for Full Report" />
    </Button>
  );
}
