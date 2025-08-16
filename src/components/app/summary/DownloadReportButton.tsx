
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert a Data URL to a raw base64 string
function toBase64FromDataUrl(dataUrl: string): string {
  const i = dataUrl.indexOf('base64,');
  return i >= 0 ? dataUrl.slice(i + 7) : dataUrl; // strip prefix if present
}

// Helper function to capture the report content as a PNG
async function captureReportAsPng(): Promise<{ imageBase64: string; format: 'png' }> {
  const node = document.getElementById('report-content');
  if (!node) {
    throw new Error('Could not find the report content element (#report-content).');
  }

  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
  
  const dataUrl = canvas.toDataURL('image/png'); // Use PNG for reliability
  const imageBase64 = toBase64FromDataUrl(dataUrl);

  return { imageBase64, format: 'png' };
}


export function DownloadReportButton() {
  const [isBusy, setIsBusy] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isBusy) return;

    const isProbe = event.shiftKey;
    setIsBusy(true);
    
    const title = 'ForecastReport';

    try {
      const { imageBase64, format } = await captureReportAsPng();
      
      const payload = {
          mode: 'image',
          format,
          imageBase64,
          title,
      };

      if (isProbe) {
        // --- PROBE PATH (Shift+Click) ---
        console.info('Performing PDF probe (Shift+Click)...');
        const response = await fetch('/api/print/pdf', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const responseJson = await response.json();
        alert(`PDF PROBE RESULT:\n\n${JSON.stringify(responseJson, null, 2)}`);

      } else {
        // --- REAL DOWNLOAD PATH (Normal Click) ---
        console.info('Requesting PDF download...');
        const response = await fetch('/api/print/pdf', {
          method: 'POST',
          headers: { 'content-type': 'application/json' }, // Server defaults to PDF without 'accept: application/json'
          body: JSON.stringify(payload),
        });

        console.info(`PDF response status: ${response.status}`, { headers: Object.fromEntries(response.headers.entries()) });

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
      }

    } catch (err: any) {
      console.error('PDF download error:', err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: err.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isBusy}
      data-testid="download-report"
    >
      {isBusy ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Download className="mr-2" />
      )}
      {isBusy ? 'Generating...' : 'Download Report'}
    </Button>
  );
}
