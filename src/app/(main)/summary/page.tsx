
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';

// =================================================================
// PLACEHOLDER COMPONENTS (PART A)
// =================================================================

/**
 * KPISection - Renders the 6 main KPI cards.
 * Expected Data (Part B): `totalRevenue`, `totalOperating` (from costSummary),
 * `totalGrossProfit` (from profitSummary), `endingCashBalance` (from cashFlowSummary),
 * `breakEvenMonth` (from profitSummary), `peakFundingNeed` (from cashFlowSummary)
 */
const KPISection = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex h-24 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm">
          KPI Card {i + 1}
        </div>
      ))}
    </div>
  );
};

/**
 * HealthPanel - Renders the Business Health Score.
 * Expected Data (Part B): `healthScore` (0-100), `insights[]` (array of strings),
 * `alerts[]` (array of strings)
 */
const HealthPanel = () => {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm">
      TODO: Health Score Panel
    </div>
  );
};

/**
 * CashBridge - Renders the Profit-to-Cash bridge visual.
 * Expected Data (Part B): `totalOperatingProfit` (from profitSummary),
 * `cogsOfUnsoldGoods` (from costSummary), `totalNetProfit` vs `totalOperatingProfit` for taxes,
 * `endingCashBalance` (from cashFlowSummary)
 */
const CashBridge = () => {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm">
      TODO: Profit-to-Cash Bridge
    </div>
  );
};


// =================================================================
// MAIN PAGE COMPONENT
// =================================================================

function SummaryPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title="Financial Summary" description="An overview of your business forecast." />
      
      {/* --- Row 1: KPI Cards --- */}
      <KPISection />
      
      {/* --- Row 2: Health Score --- */}
      <HealthPanel />

      {/* --- Row 3: Profit-to-Cash Bridge --- */}
      <CashBridge />

      <footer className="flex justify-start mt-8 pt-6 border-t">
        <Button onClick={() => router.push('/cash-flow')}>
          <ArrowLeft className="mr-2" /> Back to Cash Flow
        </Button>
      </footer>
    </div>
  );
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
                    <AlertTitle>Calculation Error</AlertTitle>
                    <AlertDescription>
                        {error} Please correct the issues on the Inputs page and try again.
                    </Description>
                </Alert>
            </div>
        );
    }

    if (!data || !inputs) {
        return (
            <div className="p-4 md:p-8 text-center">
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No Data Found</AlertTitle>
                    <AlertDescription>
                        Please run a report from the Inputs page to see the summary.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <SummaryPageContent data={data} inputs={inputs} />;
}
