
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
    
    // Abort controller for fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

    try {
      // 1. Probe the health endpoint first
      const healthRes = await fetch(apiUrl('/api/print/health'));
      console.info('[pdf]', 'health', { status: healthRes.status, ok: healthRes.ok, ct: healthRes.headers.get('content-type') });
      if (!healthRes.ok) {
        const errorText = await healthRes.text();
        throw new Error(`Health check failed: ${errorText || healthRes.statusText}`);
      }

      // 2. Request the PDF from the server
      const pdfRes = await fetch(withQuery('/api/print/pdf', queryParams), {
        signal: controller.signal,
        headers: isDebug ? { 'Accept': 'application/json' } : {},
      });

      console.info('[pdf]', 'pdf_fetch', { status: pdfRes.status, ok: pdfRes.ok, ct: pdfRes.headers.get('content-type') });
      clearTimeout(timeoutId); // Clear the timeout if fetch succeeds

      // 3. Process the response
      const contentType = pdfRes.headers.get('content-type') || '';
      
      if (isDebug || contentType.includes('application/json')) {
        const json = await pdfRes.json();
        console.info('[pdf:debug]', json);
        if (process.env.NODE_ENV !== 'production') {
            if (json.ok) {
                alert('PDF DEBUG OK: ' + JSON.stringify(json));
                return; // Success, stop here
            } else {
                 alert('PDF DEBUG FAIL: code=' + json.code + ' message=' + (json.message || ''));
                 // Let it proceed to the catch block for fallback
                 throw new Error(`Debug run failed with code: ${json.code}`);
            }
        }
      } else if (pdfRes.ok && contentType.includes('application/pdf')) {
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
      // 4. On any failure, run diagnostics and fall back to opening the print page
      console.warn('[pdf-download]', err.message || 'An unknown error occurred');
      
      // Perform capabilities check on fallback
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
