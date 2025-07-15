
'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function SummaryPageContent() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Summary" description="A high-level overview of your financial forecast." />
      <div className="text-center text-muted-foreground">
        <p>A summary of your forecast will be displayed here.</p>
      </div>
      <footer className="flex justify-end mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/inputs')}>
          <ArrowLeft className="mr-2" /> Back to Inputs
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
