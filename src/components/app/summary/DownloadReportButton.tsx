
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

let didProbe = false;

export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    const title = `ForecastReport-${Date.now()}`;
    
    try {
      const reportNode = document.getElementById('report-content');
      if (!reportNode) {
        throw new Error("Report content element #report-content not found. Cannot generate PDF.");
      }
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportNode, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      
      const dataUrl = canvas.toDataURL('image/png'); // use PNG for reliability
      const imageBase64 = dataUrl.split(',')[1];     // <-- send raw base64 ONLY

      if (!didProbe) {
        const res = await fetch('/api/print/pdf', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ mode: 'image', format: 'png', imageBase64, title: 'ForecastReport' }),
        });
        const j = await res.json();
        alert('PDF PROBE (one-time):\n' + JSON.stringify(j, null, 2));
        didProbe = true;
        return;
      }

      const res = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' }, // no JSON accept -> returns application/pdf
        body: JSON.stringify({ mode: 'image', format: 'png', imageBase64, title: 'ForecastReport' }),
      });

      if (!res.ok || (res.headers.get('content-type') || '').indexOf('application/pdf') === -1) {
        const j = await res.json().catch(() => ({}));
        throw new Error('PDF download failed: ' + JSON.stringify(j));
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ForecastReport-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
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
