
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

  const captureReport = async (): Promise<{ imageDataUrl: string, format: 'png' }> => {
    const html2canvas = (await import('html2canvas')).default;
    const reportNode = document.getElementById('report-content');
    if (!reportNode) {
      throw new Error("Report content element #report-content not found. Cannot generate PDF.");
    }
    
    // Prefer PNG as it has better support in some decoders
    const canvas = await html2canvas(reportNode, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
    const dataUrl = canvas.toDataURL('image/png'); // Full "data:image/png;base64,..." string
    
    return { imageDataUrl: dataUrl, format: 'png' };
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const title = `ForecastReport-${Date.now()}`;

    try {
      const { imageDataUrl, format } = await captureReport();
      const payload = { imageDataUrl, format, title };

      if (!didProbe) {
        // --- ONE-SHOT JSON PROBE on first click ---
        const probeRes = await fetch('/api/print/pdf?debug=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const probeJson = await probeRes.json();
        alert(`PDF PROBE (this is a one-time check):\n\n${JSON.stringify(probeJson, null, 2)}`);
        didProbe = true;
      } else {
        // --- NORMAL DOWNLOAD path for subsequent clicks ---
        const pdfRes = await fetch('/api/print/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
          body: JSON.stringify(payload)
        });

        if (!pdfRes.ok) {
            const errorJson = await pdfRes.json().catch(() => ({ code: pdfRes.statusText }));
            throw new Error(`PDF generation failed: ${errorJson.code || pdfRes.status}`);
        }

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
        description: `${err.message || 'An unknown error occurred.'} Please try again.`,
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
