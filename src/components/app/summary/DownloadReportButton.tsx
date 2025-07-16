
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { type EngineInput } from '@/lib/types';

interface DownloadReportButtonProps {
  inputs: EngineInput;
}

export function DownloadReportButton({ inputs }: DownloadReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateForecastPdf = async () => {
    setIsLoading(true);

    try {
      // TODO: Add timeout handling (e.g. Promise.race)
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate PDF.');
      }

      const blob = await response.blob();
      const date = new Date().toISOString().split('T')[0];
      saveAs(blob, `forecast-report-${date}.pdf`);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={generateForecastPdf} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download Report
    </Button>
  );
}
