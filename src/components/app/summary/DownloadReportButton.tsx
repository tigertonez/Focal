
'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Loader2, TestTube } from 'lucide-react';
import { toPng } from 'html-to-image';


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

function addFreeze(root: HTMLElement) {
  root.classList.add('pdf-freeze');
}
function removeFreeze(root: HTMLElement) {
  root.classList.remove('pdf-freeze');
}

function lockHeights(root: HTMLElement) {
  const locked: Array<{el: HTMLElement; style: string | null}> = [];
  const all = root.querySelectorAll<HTMLElement>('*');
  all.forEach(el => {
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
      if (style === null) el.removeAttribute('style');
      else el.setAttribute('style', style);
    }
  };
}

function targetWidthPx(page: 'a4' | 'letter' | 'auto', naturalWidth: number) {
  const pt = page === 'a4' ? 595 : page === 'letter' ? 612 : 0;
  if (pt === 0) return Math.min(Math.max(naturalWidth, 2200), 3200); // auto: keep big, cap upper bound
  const px = Math.round((pt * 300) / 72); // ≈ 300 DPI
  return Math.min(Math.max(px, 2200), 3200);
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
    
    const el = document.getElementById('report-content');
    if (!el) {
        toast({ variant: 'destructive', title: 'PDF Capture Failed', description: 'Report content container (#report-content) not found.' });
        setIsBusy(false);
        return;
    }
    
    try {
      await waitForFonts();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      addFreeze(document.documentElement);
      const unlock = lockHeights(el);

      let imageBase64, format, width, height;
      const preferences = { page: 'a4', margin: 24, fit: 'contain' };

      try {
        const rect = el.getBoundingClientRect();
        const tw = targetWidthPx(preferences.page as any, Math.round(rect.width));
        const pixelRatio = tw / rect.width;

        console.info(`Capturing PNG at ${tw}px width (pixelRatio: ${pixelRatio.toFixed(2)})`);

        const dataUrl = await toPng(el, {
            cacheBust: true,
            pixelRatio,
            backgroundColor: '#ffffff',
            filter: (n) => !(n instanceof HTMLElement && n.classList.contains('no-print')),
        });
        
        const [meta, base64] = dataUrl.split(',');
        imageBase64 = base64.split('base64;').pop() || '';
        format = meta.includes('image/png') ? 'png' : 'jpeg';
        width = Math.round(rect.width * pixelRatio);
        height = Math.round(rect.height * pixelRatio);
      } finally {
        unlock();
        removeFreeze(document.documentElement);
      }
      
      const title = 'ForecastReport';
      const payload = {
        imageBase64,
        format,
        width,
        height,
        page: preferences.page,
        margin: preferences.margin,
        fit: preferences.fit,
        title,
        mode: isProbe ? 'probe' : 'pdf',
      };
      
      console.info('POST /api/print/pdf', {
          mode: payload.mode,
          format: payload.format,
          width: payload.width,
          height: payload.height,
          approxBytes: Math.round(imageBase64.length * 0.75),
      });

      const response = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isProbe && { 'Accept': 'application/json' }),
        },
        body: JSON.stringify(payload),
      });
      
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.info(`Response: ${response.status}`, { headers: responseHeaders });

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
      window.open(`/print/report?title=${encodeURIComponent('Forecast Report')}`, '_blank', 'noopener,noreferrer');
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
      <TestTube className="ml-2 h-3 w-3 opacity-60 group-hover:opacity-100" title="Hold Shift+Click for probe" />
    </Button>
  );
}
