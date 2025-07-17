
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export function DownloadReportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Failed to generate PDF stub');
        alert('Download failed. Check the console for errors.');
        setIsLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stub.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF stub:', error);
      alert('Download failed. Check the console for errors.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={isLoading}
        className="shadow-lg"
      >
        {isLoading ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          <Download className="mr-2" />
        )}
        Download Report
      </Button>
    </div>
  );
}
