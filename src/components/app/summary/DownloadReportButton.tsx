
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { apiUrl, withQuery } from '@/lib/paths';

let nextClickDebug = true; // One-time debug flag for the session

/**
 * A client-side component that handles the PDF download process.
 * It includes a health check, PDF fetching with a timeout,
 * and a fallback to opening the print view in a new tab on failure.
 */
export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    const isDebug = nextClickDebug;
    nextClickDebug = false; // Ensure next click is not a debug run

    const queryParams: Record<string, any> = { title: 'Strategic Report', locale: 'en' };
    if (isDebug) {
      queryParams.debug = 1;
    }
    
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

      const pdfRes = await fetch(pdfApiUrl, {
        signal: controller.signal,
        headers: isDebug ? { 'Accept': 'application/json' } : {},
      });
      clearTimeout(timeoutId);

      const contentType = (pdfRes.headers.get('content-type') || '').toLowerCase();

      if (isDebug) {
        let payload: any = null;
        try {
            payload = await pdfRes.json();
        } catch {
            try {
                const text = await pdfRes.text();
                payload = { raw: text };
            } catch {
                payload = { raw: null };
            }
        }
        
        console.info('[pdf:debug:url]', pdfApiUrl);
        console.info('[pdf:debug:status]', pdfRes.status, pdfRes.ok, contentType);
        console.info('[pdf:debug:payload]', payload);
        
        if (!process.env || process.env.NODE_ENV !== 'production') {
          alert('PDF DEBUG ' + (pdfRes.ok ? 'OK' : 'FAIL') + ':\n' +
                'status=' + pdfRes.status + '\n' +
                'ct=' + contentType + '\n' +
                JSON.stringify(payload));
        }
        return; // Stop execution here for the debug run
      }

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
