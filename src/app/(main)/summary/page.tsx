
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// =================================================================
// PLACEHOLDER COMPONENTS (PART A)
// =================================================================

/**
 * KPISection - Renders the 6 main KPI cards.
 * Expected Data (Part B): `totalRevenue` (from revenueSummary), `totalOperating` (from costSummary),
 * `totalGrossProfit` (from profitSummary), `endingCashBalance` (from cashFlowSummary),
 * `breakEvenMonth` (from profitSummary), `peakFundingNeed` (from cashFlowSummary)
 */
const KPISection = ({ data, currency }: { data: EngineOutput, currency: string }) => {
  const { revenueSummary, costSummary, profitSummary, cashFlowSummary } = data;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Total Revenue"
        value={formatCurrency(revenueSummary.totalRevenue, currency)}
        icon={<TrendingUp />}
        helpTitle="Total Revenue"
        help="The total income generated from sales over the forecast period before any costs are deducted."
      />
      <KpiCard
        label="Total Costs"
        value={formatCurrency(costSummary.totalOperating, currency)}
        icon={<TrendingDown />}
        helpTitle="Total Operating Costs"
        help="The sum of all fixed and variable costs required to run the business."
      />
      <KpiCard
        label="Gross Profit"
        value={formatCurrency(profitSummary.totalGrossProfit, currency)}
        icon={<Landmark />}
        helpTitle="Gross Profit"
        help="Total Revenue minus the direct cost of goods sold (COGS). It measures how efficiently you produce and sell your products."
      />
      <KpiCard
        label="Ending Cash"
        value={formatCurrency(cashFlowSummary.endingCashBalance, currency)}
        icon={<PiggyBank />}
        helpTitle="Ending Cash Balance"
        help="The total cash your business will have in the bank at the end of the forecast period."
      />
      <KpiCard
        label="Break-Even"
        value={profitSummary.breakEvenMonth ? `${profitSummary.breakEvenMonth} Months` : 'N/A'}
        icon={<CalendarCheck2 />}
        helpTitle="Profit Break-Even"
        help="The month in which your cumulative operating profit becomes positive."
      />
      <KpiCard
        label="Funding Need"
        value={formatCurrency(cashFlowSummary.peakFundingNeed, currency)}
        icon={<Target />}
        helpTitle="Peak Funding Need"
        help="The lowest point of your cumulative cash balance. This is the minimum capital required to prevent your cash from going below zero."
      />
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
    <Card className="flex h-32 items-center justify-center rounded-lg text-muted-foreground">
      TODO: Health Score Panel
    </Card>
  );
};

/**
 * CashBridge - Renders the Profit-to-Cash bridge visual.
 * Expected Data (Part B): `operatingProfit`, `cogsOfUnsoldGoods` (from costSummary),
 * `totalNetProfit` vs `totalOperatingProfit` for taxes,
 * `endingCashBalance` (from cashFlowSummary)
 */
const CashBridge = () => {
  return (
    <Card className="flex h-48 items-center justify-center rounded-lg text-muted-foreground">
      TODO: Profit-to-Cash Bridge
    </Card>
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
      <KPISection data={data} currency={inputs.parameters.currency} />
      
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
                    </AlertDescription>
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
