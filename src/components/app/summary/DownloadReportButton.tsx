
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { apiUrl, withQuery } from '@/lib/paths';
import { useToast } from '@/hooks/use-toast';

const FORCE_FALLBACK = true;

let debugMode = true;
const debugSteps = ['entry','import','launch'] as const;
let debugIndex = 0;


/**
 * A client-side component that handles the PDF download process.
 * It includes a health check, PDF fetching with a timeout,
 * and a fallback to opening the print view in a new tab on failure.
 * It also has a step-by-step debug mode for the first few clicks.
 */
export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);

    const isDebug = !FORCE_FALLBACK && debugMode && debugIndex < debugSteps.length;
    
    if (isDebug) {
      const step = debugSteps[debugIndex++];
      const queryParams = { debug: 1, step, title: 'Strategic Report', locale: 'en' };
      const url = withQuery('/api/print/pdf', queryParams);

      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let payload: any = null;
        try {
          payload = ct.includes('application/json') ? await res.json() : await res.text();
        } catch {
          payload = { raw: 'failed to parse response' };
        }

        console.info('[pdf:debug:step]', step, 'status=', res.status, 'ct=', ct, 'payload=', payload);

        if (!process.env || process.env.NODE_ENV !== 'production') {
          alert('PDF DEBUG step=' + step + '\nstatus=' + res.status + '\nct=' + ct + '\n' + JSON.stringify(payload));
        }

        if (res.status >= 400 || (payload && payload.ok === true && (payload.phase === 'READY' || payload.phase === 'GOTO_OK' || payload.phase === 'LAUNCHED'))) {
          debugMode = false;
        }
      } catch (err: any) {
        console.warn('[pdf:debug:fetch-error]', step, err);
        if (!process.env || process.env.NODE_ENV !== 'production') {
            alert('PDF DEBUG FETCH FAILED step=' + step + '\n' + err.message);
        }
        debugMode = false;
      } finally {
        setIsLoading(false);
      }
      return; // End the debug click here
    }

    // --- Normal Path (or Forced Fallback) ---
    const queryParams: Record<string, any> = { title: 'Strategic Report', locale: 'en' };
    const printPageUrl = withQuery('/print/report', queryParams);
    
    const fallbackToImageEmbed = async () => {
        console.info('[pdf:client] Starting fallback: capturing report content to image...');
        try {
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

            const imageDataUri = canvas.toDataURL('image/jpeg', 0.85);
            const imageBase64 = imageDataUri.split(',')[1];
            
            // Log payload info
            const payloadBytes = Math.round((imageBase64.length * 3) / 4);
            console.info('[pdf:client] POSTing to embed API.', {
              path: "/api/print/pdf (POST)",
              bytes: payloadBytes,
              format: "jpeg",
            });

            const embedController = new AbortController();
            const embedTimeoutId = setTimeout(() => embedController.abort(), 60000);
            
            const embedRes = await fetch(apiUrl('/api/print/pdf'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
                body: JSON.stringify({ imageBase64, format: 'jpeg', title: 'ForecastReport' }),
                signal: embedController.signal,
            });
            
            clearTimeout(embedTimeoutId);
            const contentType = embedRes.headers.get('content-type') || '';
            
            if (embedRes.ok && contentType.includes('application/pdf')) {
                const blob = await embedRes.blob();
                console.info(`[pdf:client] PDF blob received. Status=${embedRes.status}, Content-Type=${contentType}, Size=${(blob.size / 1024).toFixed(1)} KB. Triggering download...`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ForecastReport-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const errorJson = await embedRes.json().catch(() => ({ message: 'Failed to parse error response from embed fallback.' }));
                throw new Error(`PDF Fallback failed: ${errorJson.code || embedRes.statusText}`);
            }

        } catch (embedErr: any) {
            console.warn('[pdf:embed-fallback]', embedErr.message || 'An unknown error occurred in image embed fallback.');
            toast({
                variant: 'destructive',
                title: 'PDF Generation Failed',
                description: `Could not generate PDF (${embedErr.message}). Opening a print-friendly page instead.`,
            });
            window.open(printPageUrl, '_blank', 'noopener,noreferrer');
        }
    };
    
    try {
      if (FORCE_FALLBACK) {
        await fallbackToImageEmbed();
        return;
      }
      
      const launchCheckRes = await fetch(apiUrl('/api/print/pdf?debug=1&step=launch'));
      const launchStatus = await launchCheckRes.json();

      if (!launchStatus.ok && launchStatus.code === 'LAUNCH_FAILED') {
          console.warn('[pdf:preflight-fail]', 'Headless browser launch failed, switching to image embed fallback.');
          await fallbackToImageEmbed();
          return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const pdfRes = await fetch(withQuery('/api/print/pdf', queryParams), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (pdfRes.ok && (pdfRes.headers.get('content-type') || '').includes('application/pdf')) {
        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ForecastReport-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await pdfRes.text();
        throw new Error(`PDF generation failed: ${errorText || pdfRes.statusText}`);
      }
    } catch (err: any) {
      console.warn('[pdf-download]', err.message || 'An unknown error occurred, attempting image fallback.');
      await fallbackToImageEmbed();
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
