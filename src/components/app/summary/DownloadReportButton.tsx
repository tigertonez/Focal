
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

let didProbe = false; // Module-level flag for one-shot probe

/**
 * A client-side component that handles PDF download exclusively via a POST fallback.
 * The first click performs a silent "probe" to verify the server-side rendering,
 * and subsequent clicks trigger the actual file download.
 */
export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const captureReport = async (): Promise<{ imageBase64: string, format: 'jpg' }> => {
    const html2canvas = (await import('html2canvas')).default;
    const reportNode = document.getElementById('report-content');
    if (!reportNode) throw new Error("Report content element #report-content not found.");

    let canvas = await html2canvas(reportNode, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });

    // Clamp image size to prevent Vercel body limit issues
    const MAX_WIDTH = 1600;
    if (canvas.width > MAX_WIDTH) {
      const newCanvas = document.createElement('canvas');
      const aspect = canvas.height / canvas.width;
      newCanvas.width = MAX_WIDTH;
      newCanvas.height = MAX_WIDTH * aspect;
      const ctx = newCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context for canvas resizing.');
      ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
      canvas = newCanvas;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const rawBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    return { imageBase64: rawBase64, format: 'jpg' };
  };

  const postAndHandlePdf = async (payload: { imageBase64: string, format: string, title: string, debug?: boolean }) => {
    const isDebug = payload.debug || false;
    const res = await fetch('/api/print/pdf' + (isDebug ? '?debug=1' : ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': isDebug ? 'application/json' : 'application/pdf',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: `Server returned status ${res.status}` }));
      throw new Error(errorJson.code || res.statusText);
    }

    return res;
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const title = `ForecastReport-${Date.now()}`;

    try {
      if (!didProbe) {
        // --- ONE-SHOT JSON PROBE on first click ---
        const { imageBase64, format } = await captureReport();
        console.info(`[pdf:probe] Captured image. Size: ~${Math.round((imageBase64.length * 3) / 4 / 1024)} KB. Probing POST API...`);
        const probeRes = await postAndHandlePdf({ imageBase64, format, title, debug: true });
        const probeJson = await probeRes.json();
        alert(`PDF PROBE (this is a one-time check):\n\n${JSON.stringify(probeJson, null, 2)}`);
        didProbe = true;
      } else {
        // --- NORMAL DOWNLOAD path for subsequent clicks ---
        const { imageBase64, format } = await captureReport();
        const payloadBytes = Math.round((imageBase64.length * 3) / 4);
        console.info('[pdf:download] POSTing to embed API.', { path: "/api/print/pdf (POST)", bytes: payloadBytes, format });

        const pdfRes = await postAndHandlePdf({ imageBase64, format, title });
        const blob = await pdfRes.blob();
        
        console.info(`[pdf:download] PDF blob received. Status=${pdfRes.status}, Content-Type=${pdfRes.headers.get('content-type')}, Size=${(blob.size / 1024).toFixed(1)} KB.`);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.warn('[pdf:client-error]', err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: `Could not generate PDF (${err.message || 'An unknown error occurred.'}). Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      data-testid="download-report"
    >
      {isLoading ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Download className="mr-2" />
      )}
      {isLoading ? 'Generating...' : 'Download Report'}
    </Button>
  );
}
