
'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CashFlowPageSkeleton } from '@/components/app/cash-flow/CashFlowPageSkeleton';

export default function CashFlowPage() {
  // In the future, a `useCashFlow` hook would provide this data.
  const cashFlowData = null;

  if (!cashFlowData) {
    return <CashFlowPageSkeleton />;
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
