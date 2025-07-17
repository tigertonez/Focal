
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileDown, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFinancials } from '@/lib/get-financials';

type DownloadState = 'idle' | 'loading' | 'retrying' | 'error' | 'success';

/**
 * A client-side component to trigger the PDF download.
 * It handles loading states, error reporting (with retry), and success feedback.
 */
export function DownloadReportButton() {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const MAX_RETRIES = 1; // Only one automatic retry

  const handleDownload = async () => {
    // --- 1. Guard against missing data ---
    const financialData = getFinancials();
    if (financialData.error || !financialData.data || !financialData.inputs) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Report',
        description: financialData.error || 'Run a forecast from the Inputs page first.',
      });
      return;
    }

    setDownloadState(retryCount > 0 ? 'retrying' : 'loading');

    // --- 2. Fetch PDF from API with AbortController ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: financialData.inputs,
          data: financialData.data,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // --- 3. Handle non-OK responses ---
      if (!response.ok) {
        if (response.status === 429) {
          toast({ variant: 'destructive', title: 'Server Busy', description: 'Too many requests. Please try again in a minute.' });
          setDownloadState('error');
          return;
        }
        const errorText = await response.text();
        console.error(`Download failed with status ${response.status}:`, errorText);
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
        } catch {
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
      }

      // --- 4. Handle successful response (Blob) ---
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadState('success');
      toast({
          title: 'Download Started',
          description: 'Your PDF report is being downloaded.',
          action: <CheckCircle className="text-green-500" />
      })
      setTimeout(() => setDownloadState('idle'), 3000); // Reset after 3s

    } catch (error: any) {
        console.error('Download failed:', error);
        // --- 5. Exponential back-off retry logic ---
        if (error.name === 'AbortError') {
             toast({ variant: 'destructive', title: 'Request Timed Out', description: 'The server took too long to respond.' });
        }
        
        if (retryCount < MAX_RETRIES) {
            setRetryCount(retryCount + 1);
            const delay = Math.pow(2, retryCount) * 1000; // 1s
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: `Will retry in ${delay / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`,
                action: <RefreshCw className="animate-spin" />
            });
            setTimeout(handleDownload, delay);
        } else {
            setDownloadState('error');
            toast({
                variant: 'destructive',
                title: 'PDF Generation Failed',
                description: error.name === 'AbortError' ? 'The request timed out.' : error.message,
            });
            setTimeout(() => {
                setDownloadState('idle');
                setRetryCount(0);
            }, 5000);
        }
    }
  };
  
  const getButtonContent = () => {
    switch(downloadState) {
        case 'loading': return <><Loader2 className="animate-spin" /> Generating...</>;
        case 'retrying': return <><RefreshCw className="animate-spin" /> Retrying...</>;
        case 'error': return <><AlertTriangle /> Error</>;
        case 'success': return <><CheckCircle /> Success!</>;
        default: return <><FileDown /> Download Report</>;
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        onClick={handleDownload}
        disabled={downloadState === 'loading' || downloadState === 'retrying'}
        size="lg"
        className="shadow-lg"
      >
        {getButtonContent()}
      </Button>
    </div>
  );
}
