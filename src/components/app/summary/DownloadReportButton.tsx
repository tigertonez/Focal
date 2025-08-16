
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Loader2, TestTube } from 'lucide-react';
import { toPng } from 'html-to-image';


// =================================================================
// Configuration
// =================================================================

const FULL_REPORT_ROUTES = ['/summary', '/revenue', '/costs', '/profit', '/cash-flow'] as const;
type AppRoute = typeof FULL_REPORT_ROUTES[number];
type Preferences = { page: 'A4' | 'Letter' | 'auto'; fit: 'contain' | 'cover' | 'auto'; margin: number; };

// =================================================================
// Capture & Utility Functions
// =================================================================

async function waitForFonts() {
  try {
    const weights = [400, 500, 600, 700];
    await Promise.all(weights.map(w => document.fonts.load(`1rem Inter, sans-serif`, { weight: w })));
    await document.fonts.ready;
    console.info("All relevant fonts are loaded and ready.");
  } catch (err) {
    console.warn("Could not wait for fonts, capture may be imperfect.", err);
  }
}

function addFreeze(el: HTMLElement) { el.classList.add('pdf-freeze'); }
function removeFreeze(el: HTMLElement) { el.classList.remove('pdf-freeze'); }

function lockHeights(root: HTMLElement) {
  const locked: Array<{el: HTMLElement; style: string | null}> = [];
  root.querySelectorAll<HTMLElement>('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      locked.push({ el, style: el.getAttribute('style') });
      el.style.minHeight = `${r.height}px`;
      el.style.height = `${r.height}px`;
    }
  });
  return () => {
    for (const {el, style} of locked) {
      if (style === null) el.removeAttribute('style'); else el.setAttribute('style', style);
    }
  };
}

function targetWidthPx(page: 'a4' | 'letter' | 'auto', naturalWidth: number) {
  const sharpnessFactor = 1.15;
  const pt = page === 'a4' ? 595 : page === 'letter' ? 612 : 0;
  if (pt === 0) {
    const auto = Math.round(Math.max(naturalWidth, 2400) * sharpnessFactor);
    return Math.min(auto, 3400);
  }
  const px300 = (pt * 300) / 72;
  const px350 = Math.round(px300 * sharpnessFactor);
  return Math.min(Math.max(px350, 2600), 3400);
}

async function captureCurrentPage(prefs: Preferences): Promise<{ dataUrl: string; width: number; height: number; }> {
    const el = document.getElementById('report-content');
    if (!el) throw new Error('Report content container (#report-content) not found.');

    await waitForFonts();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    
    addFreeze(document.documentElement);
    const unlock = lockHeights(el);

    try {
        const rect = el.getBoundingClientRect();
        const tw = targetWidthPx(prefs.page, Math.round(rect.width));
        const pixelRatio = tw / rect.width;

        const dataUrl = await toPng(el, {
            cacheBust: true, pixelRatio, backgroundColor: '#ffffff',
            filter: (n) => !(n instanceof HTMLElement && n.classList.contains('no-print')),
        });
        
        const width = Math.round(rect.width * pixelRatio);
        const height = Math.round(rect.height * pixelRatio);
        console.log('[PDF] capture', { pixelRatio, width, height, page: prefs.page });
        return { dataUrl, width, height };
    } finally {
        unlock();
        removeFreeze(document.documentElement);
    }
}

async function captureRouteInIframe(path: AppRoute, prefs: Preferences) {
    console.info(`[PDF] Starting iframe capture for: ${path}`);
    return new Promise<{ dataUrl: string; width: number; height: number }>(async (resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.src = `${location.origin}${path}`;
        iframe.style.cssText = `position:fixed; left:-9999px; top:0; width:${document.documentElement.clientWidth}px; height:${window.innerHeight}px; border:0;`;

        const handleError = (msg: string) => {
            iframe.remove();
            reject(new Error(msg));
        };

        const timeout = setTimeout(() => handleError(`Iframe load timed out for ${path}`), 15000);

        iframe.onload = async () => {
            clearTimeout(timeout);
            try {
                const doc = iframe.contentDocument;
                if (!doc) return handleError(`Could not access contentDocument for ${path}`);

                addFreeze(doc.documentElement);
                await (doc as any).fonts?.ready?.catch(() => {});
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                
                const node = doc.getElementById('report-content') || doc.body;
                const rect = node.getBoundingClientRect();
                const tw = targetWidthPx(prefs.page, Math.round(rect.width));
                const pixelRatio = tw / rect.width;

                const dataUrl = await toPng(node, { cacheBust: true, pixelRatio, backgroundColor: '#ffffff' });
                const width = Math.round(rect.width * pixelRatio);
                const height = Math.round(rect.height * pixelRatio);
                console.info(`[PDF] Finished iframe capture for: ${path}`, { width, height });
                resolve({ dataUrl, width, height });

            } catch (err: any) {
                handleError(err.message || String(err));
            } finally {
                iframe.remove();
            }
        };

        iframe.onerror = () => handleError(`Iframe failed to load for ${path}`);
        document.body.appendChild(iframe);
    });
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
    const preferences: Preferences = { page: 'A4', fit: 'contain', margin: 20 };
    
    try {
      let payload: any;
      const toBase64 = (url: string) => url.replace(/^data:image\/png;base64,/, '');

      if (isFullReport) {
          const images = [];
          for (const route of FULL_REPORT_ROUTES) {
              try {
                  const capture = await captureRouteInIframe(route, preferences);
                  images.push({
                      imageBase64: toBase64(capture.dataUrl),
                      format: 'png',
                      width: capture.width,
                      height: capture.height,
                      name: route,
                  });
              } catch(e) {
                  console.warn(`[PDF] Skipping route ${route} due to capture error:`, e);
              }
          }
          payload = { images, ...preferences, title, mode: isProbe ? 'probe' : 'pdf' };
      } else {
          const capture = await captureCurrentPage(preferences);
          payload = {
              imageBase64: toBase64(capture.dataUrl),
              format: 'png',
              width: capture.width,
              height: capture.height,
              ...preferences,
              title,
              mode: isProbe ? 'probe' : 'pdf',
          };
      }
      
      const response = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isProbe && { 'Accept': 'application/json' }),
        },
        body: JSON.stringify(payload),
      });

      console.log('PDF response status:', response.status, { headers: Object.fromEntries(response.headers.entries()) });
      
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
