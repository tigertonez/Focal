'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { getFinancials } from '@/lib/get-financials';
import { useToast } from '@/hooks/use-toast';

export function DownloadReportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setLoading(true);

    const financials = getFinancials();
    if (financials.error || !financials.data || !financials.inputs) {
        toast({
            variant: "destructive",
            title: "Cannot generate report",
            description: "Please run a report from the Inputs page first.",
        });
        setLoading(false);
        return;
    }
    
    try {
      // Pass the live data directly in the request body
      const res = await fetch('/api/report', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: financials.inputs, data: financials.data }),
      });
      
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || 'Failed to generate PDF from server.');
      }

      const blob = await res.blob();

      if (blob.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error("Report too large to download. Please refine your forecast range.");
      }

      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `ForecastReport-${Date.now()}.pdf` });
      document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e: any) { 
      console.error(e);
      toast({
          variant: "destructive",
          title: "Download Failed",
          description: e.message
      })
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={loading}
        className="shadow-lg"
      >
        {loading ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          <Download className="mr-2" />
        )}
        Download Report
      </Button>
    </div>
  );
}
