

'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CashFlowPageSkeleton } from '@/components/app/cash-flow/CashFlowPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, TrendingDown, CalendarClock, Banknote, ArrowRight, Sparkles } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CashFlowChart } from '@/components/app/cash-flow/charts/CashFlowChart';
import { CashFlowTable } from '@/app/(main)/cash-flow/CashFlowTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CashFlowInsights } from '@/components/app/cash-flow/CashFlowInsights';
import { useForecast } from '@/context/ForecastContext';

function CashFlowPageContent({ data, inputs, t }: { data: EngineOutput, inputs: EngineInput, t: any }) {
  const router = useRouter();
  const { cashFlowSummary, profitSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialCashPosition = cashFlowSummary.potentialCashBalance;
  const cashProgress = potentialCashPosition > 0 ? (cashFlowSummary.endingCashBalance / potentialCashPosition) * 100 : 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title={t.pages.cashFlow.title} description={t.pages.cashFlow.description} />
      
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label={t.pages.cashFlow.kpi.ending} 
            value={formatCurrency(cashFlowSummary.endingCashBalance, currency)} 
            icon={<Wallet />}
            helpTitle={t.pages.cashFlow.kpi.ending}
            help={t.pages.cashFlow.kpi.endingHelp}
          />
          <KpiCard 
            label={t.pages.cashFlow.kpi.peak}
            value={formatCurrency(cashFlowSummary.peakFundingNeed, currency)} 
            icon={<TrendingDown />}
            helpTitle={t.pages.cashFlow.kpi.peak}
            help={t.pages.cashFlow.kpi.peakHelp}
          />
          <KpiCard 
            label={t.pages.cashFlow.kpi.cashPositive}
            value={cashFlowSummary.cashPositiveMonth !== null ? `${cashFlowSummary.cashPositiveMonth} Months` : 'N/A'} 
            icon={<CalendarClock />}
            helpTitle={t.pages.cashFlow.kpi.cashPositive}
            help={t.pages.cashFlow.kpi.cashPositiveHelp}
          />
          <KpiCard 
            label={t.pages.cashFlow.kpi.runway}
            value={isFinite(cashFlowSummary.runway) ? `${formatNumber(cashFlowSummary.runway)} Months` : 'Infinite'}
            icon={<Banknote />}
            helpTitle={t.pages.cashFlow.kpi.runway}
            help={t.pages.cashFlow.kpi.runwayHelp}
          />
        </div>
        {potentialCashPosition > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t.pages.cashFlow.progress}</span>
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
                <CardTitle>{t.pages.cashFlow.charts.cumulative}</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] w-full pl-0">
               <CashFlowChart data={data} currency={currency} />
            </CardContent>
        </Card>
        
        <CashFlowTable data={data} currency={currency} t={t} />
        
        <div className="pt-4">
          <CashFlowInsights />
        </div>
      </section>


      <footer className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/profit')}>
          <ArrowLeft className="mr-2" /> {t.pages.cashFlow.footer.back}
        </Button>
        <Button onClick={() => router.push('/summary')}>
          {t.pages.cashFlow.footer.continue} <ArrowRight className="ml-2" />
        </Button>
      </footer>
    </div>
  );
}


export default function CashFlowPage() {
    const { t, financials, inputs: contextInputs } = useForecast();

    if (financials.isLoading) {
        return <CashFlowPageSkeleton t={t} />;
    }

    if (financials.error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        {financials.error} {t.errors.calculationErrorDescription}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!financials.data || !contextInputs) {
        return <CashFlowPageSkeleton t={t} />;
    }

    return <CashFlowPageContent data={financials.data} inputs={contextInputs} t={t} />;
}
