
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CashFlowPageSkeleton } from '@/components/app/cash-flow/CashFlowPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, Wallet, TrendingDown, CalendarClock, Banknote } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CashFlowChart } from '@/components/app/cash-flow/charts/CashFlowChart';
import { CashFlowTable } from '@/components/app/cash-flow/CashFlowTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CashFlowInsights } from '@/components/app/cash-flow/CashFlowInsights';


function CashFlowPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();
  const { cashFlowSummary, profitSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialCashPosition = cashFlowSummary.potentialCashBalance;
  const cashProgress = potentialCashPosition > 0 ? (cashFlowSummary.endingCashBalance / potentialCashPosition) * 100 : 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title="Cash Flow Analysis" description="Monthly cash flow, funding needs, and runway." />
      
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Ending Cash Balance" 
            value={formatCurrency(cashFlowSummary.endingCashBalance, currency)} 
            icon={<Wallet />}
            helpTitle="Ending Cash Balance"
            help="The total cash your business will have in the bank at the end of the forecast period. It's the final result of all cash inflows and outflows."
          />
          <KpiCard 
            label="Peak Funding Need" 
            value={formatCurrency(cashFlowSummary.peakFundingNeed, currency)} 
            icon={<TrendingDown />}
            helpTitle="Peak Funding Need"
            help="The lowest point of your cumulative cash balance. This is the minimum amount of capital required to prevent your cash from going below zero during the forecast."
          />
          <KpiCard 
            label="Months to Break-Even" 
            value={cashFlowSummary.breakEvenMonth !== null ? `${cashFlowSummary.breakEvenMonth} Months` : 'N/A'} 
            icon={<CalendarClock />}
            helpTitle="Months to Cash Break-Even"
            help="The first month where your cumulative cash balance becomes positive, indicating the business can self-sustain its cash flow."
          />
          <KpiCard 
            label="Cash Runway (Months)" 
            value={isFinite(cashFlowSummary.runway) ? `${formatNumber(cashFlowSummary.runway)}` : 'Infinite'}
            icon={<Banknote />}
            helpTitle="Cash Runway"
            help="An estimate of how many months your business can operate with its current cash before it runs out. Calculated as (Ending Cash / Average Monthly Fixed Costs)."
          />
        </div>
        {potentialCashPosition > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Achieved vs. Potential Cash Position</span>
              <span className="font-medium text-foreground">
                 {formatCurrency(cashFlowSummary.endingCashBalance, currency)} of {formatCurrency(potentialCashPosition, currency)}
              </span>
            </div>
            <Progress value={cashProgress} className="h-2" />
          </div>
        )}
      </section>

      <section className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Cumulative Cash Flow</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] w-full pl-0">
               <CashFlowChart data={data} currency={currency} />
            </CardContent>
        </Card>
        <div className="overflow-y-auto">
          <CashFlowTable data={data} currency={currency} />
        </div>
        <div className="pt-4">
          <CashFlowInsights />
        </div>
      </section>


      <footer className="flex justify-end mt-8 pt-6 border-t">
        <Button onClick={() => router.push('/summary')}>
          Continue to Summary <ArrowRight className="ml-2" />
        </Button>
      </footer>
    </div>
  );
}


export default function CashFlowPage() {
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
        return <CashFlowPageSkeleton />;
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
        return <CashFlowPageSkeleton />;
    }

    return <CashFlowPageContent data={data} inputs={inputs} />;
}
