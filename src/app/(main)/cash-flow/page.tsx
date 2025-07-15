
'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CashFlowPageSkeleton } from '@/components/app/cash-flow/CashFlowPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function CashFlowPageContent() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Cash Flow" description="Monthly cash flow and runway." />
       <div className="text-center text-muted-foreground">
        <p>Cash flow analysis will be displayed here.</p>
      </div>
       <footer className="flex justify-end mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/inputs')}>
          <ArrowLeft className="mr-2" /> Back to Inputs
        </Button>
      </footer>
    </div>
  );
}


export default function CashFlowPage() {
    // In the future, this page will be converted to a Server Component
    // that fetches data on the server, similar to the Costs page.
  const cashFlowData = null;

  if (!cashFlowData) {
    // For now, we show the content with a placeholder.
    return <CashFlowPageContent />;
  }

  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Cash Flow" description="Monthly cash flow and runway." />
       <div className="text-center text-muted-foreground">
        <p>Cash flow analysis will be displayed here.</p>
      </div>
    </div>
  );
}
