
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FORCE_FALLBACK = true;

/**
 * A client-side component that handles the PDF download process.
 * It is forced to use an image-based fallback path that does not
 * rely on a headless browser on the server.
 */
export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProbed, setIsProbed] = useState(false); // State to track if the initial probe has been done
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
      ctx?.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
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
      const errorJson = await res.json().catch(() => ({ code: 'UNKNOWN_ERROR', message: 'Failed to parse error from server.' }));
      throw new Error(`PDF generation failed: ${errorJson.code || res.statusText}`);
    }

    return res;
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const title = `ForecastReport-${Date.now()}`;

    try {
      if (FORCE_FALLBACK) {
        if (!isProbed) {
          // --- ONE-SHOT JSON PROBE on first click ---
          const { imageBase64, format } = await captureReport();
          console.info(`[pdf:probe] Captured image. Size: ~${Math.round((imageBase64.length * 3) / 4 / 1024)} KB. Probing API...`);
          const probeRes = await postAndHandlePdf({ imageBase64, format, title, debug: true });
          const probeJson = await probeRes.json();
          
          alert(`PDF API PROBE (this is a one-time check):\n\n${JSON.stringify(probeJson, null, 2)}`);
          setIsProbed(true); // Mark probe as done so next click is a real download
        } else {
          // --- NORMAL DOWNLOAD path for subsequent clicks ---
          const { imageBase64, format } = await captureReport();
          const payloadBytes = Math.round((imageBase64.length * 3) / 4);
          console.info('[pdf:download] POSTing to embed API.', {
            path: "/api/print/pdf (POST)",
            bytes: payloadBytes,
            format,
          });

          const pdfRes = await postAndHandlePdf({ imageBase64, format, title });
          const blob = await pdfRes.blob();
          
          console.info(`[pdf:download] PDF blob received. Status=${pdfRes.status}, Content-Type=${pdfRes.headers.get('content-type')}, Size=${(blob.size / 1024).toFixed(1)} KB. Triggering download...`);

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      } else {
        // Legacy GET path is kept here but disabled by the FORCE_FALLBACK flag
        // This path will not be executed.
        console.warn('GET path is disabled by FORCE_FALLBACK flag.');
      }
    } catch (err: any) {
      console.warn('[pdf:client-error]', err.message || 'An unknown error occurred.');
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: `Could not generate PDF (${err.message}). Please try again.`,
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
