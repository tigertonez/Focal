
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { apiUrl, withQuery } from '@/lib/paths';

let debugMode = true;
const debugSteps = ['entry','import','launch','goto','ready'] as const;
let debugIndex = 0;


/**
 * A client-side component that handles the PDF download process.
 * It includes a health check, PDF fetching with a timeout,
 * and a fallback to opening the print view in a new tab on failure.
 * It also has a step-by-step debug mode for the first few clicks.
 */
export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    const isDebug = debugMode && debugIndex < debugSteps.length;
    
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
          payload = null;
        }

        console.info('[pdf:debug:step]', step, 'status=', res.status, 'ct=', ct, 'payload=', payload);

        if (!process.env || process.env.NODE_ENV !== 'production') {
          alert('PDF DEBUG step=' + step + '\nstatus=' + res.status + '\nct=' + ct + '\n' + JSON.stringify(payload));
        }

        if (res.status >= 400 || (payload && payload.ok === true && (payload.phase === 'READY' || payload.phase === 'GOTO_OK'))) {
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

    // --- Normal Path ---
    const queryParams: Record<string, any> = { title: 'Strategic Report', locale: 'en' };
    const printUrl = withQuery('/print/report', queryParams);
    const pdfApiUrl = withQuery('/api/print/pdf', queryParams);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

    try {
      const healthRes = await fetch(apiUrl('/api/print/health'));
      console.info('[pdf:health]', healthRes.status, healthRes.ok, healthRes.headers.get('content-type') || '');
      if (!healthRes.ok) {
        const errorText = await healthRes.text();
        throw new Error(`Health check failed: ${errorText || healthRes.statusText}`);
      }

      const pdfRes = await fetch(pdfApiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = (pdfRes.headers.get('content-type') || '').toLowerCase();

      if (pdfRes.ok && contentType.includes('application/pdf')) {
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
      console.warn('[pdf-download]', err.message || 'An unknown error occurred');
      
      fetch(apiUrl('/api/print/capabilities'))
        .then(res => res.json())
        .then(data => console.info('[pdf:fallback]', 'capabilities', data))
        .catch(capErr => console.warn('[pdf:fallback]', 'capabilities check failed', capErr));
      
      clearTimeout(timeoutId);
      window.open(printUrl, '_blank', 'noopener,noreferrer');
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
