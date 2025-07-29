'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForecast } from '@/context/ForecastContext';
import html2canvas from 'html2canvas';

export function DownloadReportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useForecast();

  const handleDownload = async () => {
    setLoading(true);
    const reportContent = document.getElementById('report-content');
    
    if (!reportContent) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find content to capture.",
        });
        setLoading(false);
        return;
    }

    try {
      const canvas = await html2canvas(reportContent, { 
        logging: false,
        useCORS: true, 
        scale: 2 // Higher resolution
      });
      const imageDataUri = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller file size

      const res = await fetch('/api/report', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUri }),
      });
      
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.details || errorBody.error || 'Failed to generate PDF from server.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `ForecastReport-${Date.now()}.pdf` });
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

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
    <Button
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="animate-spin mr-2" />
      ) : (
        <Download className="mr-2" />
      )}
      {t.insights.download}
    </Button>
  );
}
