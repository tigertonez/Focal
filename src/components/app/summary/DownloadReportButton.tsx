
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ButtonState = 'idle' | 'generating' | 'error';

export function DownloadReportButton() {
  const [status, setStatus] = useState<ButtonState>('idle');
  const { toast } = useToast();

  const handleDownload = async () => {
    setStatus('generating');

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setStatus('idle');

    } catch (error: any) {
      setStatus('error');
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error.message,
      });
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'generating':
        return <><Loader2 className="animate-spin mr-2" /> Generating...</>;
      case 'error':
        return <><AlertCircle className="mr-2" /> Error, Retry?</>;
      default:
        return <><Download className="mr-2" /> Download Report</>;
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
