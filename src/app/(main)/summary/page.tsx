
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { ProfitToCashBridge } from '@/components/app/summary/ProfitToCashBridge';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { SummaryKpiCards } from '@/components/app/summary/SummaryKpiCards';
import { BusinessHealthScore } from '@/components/app/summary/BusinessHealthScore';

function SummaryPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();

  const handleDownload = () => {
    // Hide the buttons during capture
    const buttons = document.querySelectorAll('footer button');
    buttons.forEach(btn => (btn as HTMLElement).style.visibility = 'hidden');

    html2canvas(document.body, {
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      useCORS: true,
      logging: false,
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
      <SectionHeader title="Financial Summary" description="A high-level overview of your financial forecast." />
      
      <div className="space-y-8">
         <SummaryKpiCards data={data} inputs={inputs} />
         <BusinessHealthScore healthData={data.businessHealth} />
         <ProfitToCashBridge data={data} currency={inputs.parameters.currency} />
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
  const [financials, setFinancials] = useState<{ data: EngineOutput | null; inputs: EngineInput | null; error: string | null; isLoading: boolean }>({
    data: null,
    inputs: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    const result = getFinancials();
    setFinancials({ ...result, isLoading: false });
  }, []);

  const { data, inputs, error, isLoading } = financials;

  if (isLoading) {
    return <SummaryPageSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Data Error</AlertTitle>
          <AlertDescription>
            {error} Please generate a new report from the Inputs page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || !inputs) {
    return <SummaryPageSkeleton />;
  }

  return <SummaryPageContent data={data} inputs={inputs} />;
}
