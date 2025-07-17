
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFinancials } from '@/lib/get-financials';

type ButtonState = 'idle' | 'generating' | 'error' | 'success';

export function DownloadReportButton() {
  const [status, setStatus] = useState<ButtonState>('idle');
  const { toast } = useToast();

  const handleDownload = async () => {
    setStatus('generating');

    // 1. Get data from localStorage
    const financials = getFinancials();
    if (financials.error || !financials.data || !financials.inputs) {
      toast({
        variant: 'destructive',
        title: 'Forecast Data Missing',
        description: 'Please run a forecast from the Inputs page before downloading a report.',
      });
      setStatus('error');
      return;
    }

    // 2. Set up fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: financials.inputs,
          data: financials.data,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 3. Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      // 4. Handle successful download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'forecast.pdf';
      if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
              filename = match[1];
          }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);

    } catch (error: any) {
      clearTimeout(timeoutId);
      setStatus('error');
      console.error('Download error:', error);
      
      const description = error.name === 'AbortError' 
          ? 'The request timed out. Please try again.' 
          : error.message;

      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description,
      });
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'generating':
        return <><Loader2 className="animate-spin" /> Generating...</>;
      case 'error':
        return <><AlertCircle /> Error, Retry?</>;
      case 'success':
        return <>Downloaded!</>;
      default:
        return <><Download /> Download Report</>;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={status === 'generating'}
        className="shadow-lg"
      >
        {getButtonContent()}
      </Button>
    </div>
  );
}
