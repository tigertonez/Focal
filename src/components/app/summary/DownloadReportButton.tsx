'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export function DownloadReportButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report', { method: 'POST' });
      console.log('PDF-STATUS', res.status);
      if (!res.ok) throw new Error('Stub failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'stub.pdf' });
      document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { 
      console.error(e);
      alert('Download failed. Check console.'); 
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
