
'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

function SummaryPageContent() {
  const router = useRouter();

  const handleDownload = () => {
    // Hide the buttons during capture
    const buttons = document.querySelectorAll('footer button');
    buttons.forEach(btn => (btn as HTMLElement).style.visibility = 'hidden');

    html2canvas(document.body, {
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      useCORS: true,
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'financial-summary.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Show the buttons again
      buttons.forEach(btn => (btn as HTMLElement).style.visibility = 'visible');
    });
  };

  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Summary" description="A high-level overview of your financial forecast." />
      <div className="text-center text-muted-foreground">
        <p>A summary of your forecast will be displayed here.</p>
      </div>
      <footer className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/inputs')}>
          <ArrowLeft className="mr-2" /> Back to Inputs
        </Button>
         <Button onClick={handleDownload}>
          <Download className="mr-2" /> Download Report
        </Button>
      </footer>
    </div>
  )
}

export default function SummaryPage() {
  // In the future, this page will be converted to a Server Component
  // that fetches data on the server.
  const summaryData = null;

  if (!summaryData) {
    // For now, we show the content with a placeholder.
    return <SummaryPageContent />;
  }
  
  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Summary" description="A high-level overview of your financial forecast." />
      <div className="text-center text-muted-foreground">
        <p>A summary of your forecast will be displayed here.</p>
      </div>
    </div>
  );
}
