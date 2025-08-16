
'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download, Loader2, TestTube } from 'lucide-react';

// =================================================================
// Helper Functions
// =================================================================

/**
 * Captures a DOM element and returns its PNG representation.
 * @param el The HTMLElement to capture.
 * @returns A promise that resolves with the image data.
 */
async function captureReport(el: HTMLElement): Promise<{ imageBase64: string; format: 'png'; width: number; height: number }> {
  const html2canvas = (await import('html2canvas')).default;
  const scale = Math.min(2, window.devicePixelRatio || 1);

  // Apply a class to freeze animations/transitions during capture
  document.documentElement.classList.add('pdf-freeze');

  // Wait for fonts and for the DOM to settle after class application
  await document.fonts?.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  } finally {
    // Always remove the freeze class
    document.documentElement.classList.remove('pdf-freeze');
  }

  // Downscale very large images to keep PDF size reasonable
  const maxW = 1800;
  let finalCanvas = canvas;
  if (canvas.width > maxW) {
    const s = maxW / canvas.width;
    const downscaledCanvas = document.createElement('canvas');
    downscaledCanvas.width = Math.round(canvas.width * s);
    downscaledCanvas.height = Math.round(canvas.height * s);
    const ctx = downscaledCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, downscaledCanvas.width, downscaledCanvas.height);
    finalCanvas = downscaledCanvas;
  }
  
  const dataUrl = finalCanvas.toDataURL('image/png');
  const imageBase64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  return {
    imageBase64,
    format: 'png',
    width: finalCanvas.width,
    height: finalCanvas.height,
  };
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

    try {
      const el = document.getElementById('report-content');
      if (!el) {
        throw new Error('Report content container (#report-content) not found.');
      }
      
      const { imageBase64, format, width, height } = await captureReport(el);
      const title = 'ForecastReport';
      const isProbe = event.shiftKey;

      const payload = {
        mode: isProbe ? 'probe' : 'pdf',
        imageBase64,
        format,
        width,
        height,
        title,
        page: 'auto',
        margin: 24,
        fit: 'auto',
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
      
      console.info(`Response: ${response.status}`, { headers: Object.fromEntries(response.headers.entries()) });

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
       // Last resort fallback
      window.open(`/print/report?title=${encodeURIComponent('Forecast Report')}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isBusy} data-testid="download-report">
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
