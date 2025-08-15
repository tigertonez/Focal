

'use client';

import React, { useCallback } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2, ChevronRight, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DownloadReportButton } from '@/components/app/summary/DownloadReportButton';
import { useForecast } from '@/context/ForecastContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HealthPanel } from '@/components/app/summary/HealthPanel';

// =================================================================
// Child Components
// =================================================================

const KPISection = ({ data, currency, t }: { data: EngineOutput, currency: string, t: any }) => {
  const { revenueSummary, costSummary, profitSummary, cashFlowSummary } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KpiCard
        label={t.pages.summary.kpi.revenue}
        value={formatCurrency(revenueSummary.totalRevenue, currency)}
        icon={<TrendingUp />}
        helpTitle={t.pages.summary.kpi.revenue}
        help={t.pages.summary.kpi.revenueHelp}
      />
      <KpiCard
        label={t.pages.summary.kpi.costs}
        value={formatCurrency(costSummary.totalOperating, currency)}
        icon={<TrendingDown />}
        helpTitle={t.pages.summary.kpi.costs}
        help={t.pages.summary.kpi.costsHelp}
      />
      <KpiCard
        label={t.pages.summary.kpi.grossProfit}
        value={formatCurrency(profitSummary.totalGrossProfit, currency)}
        icon={<Landmark />}
        helpTitle={t.pages.summary.kpi.grossProfit}
        help={t.pages.summary.kpi.grossProfitHelp}
      />
      <KpiCard
        label={t.pages.summary.kpi.endingCash}
        value={formatCurrency(cashFlowSummary.endingCashBalance, currency)}
        icon={<PiggyBank />}
        helpTitle={t.pages.summary.kpi.endingCash}
        help={t.pages.summary.kpi.endingCashHelp}
      />
      <KpiCard
        label={t.pages.summary.kpi.breakEven}
        value={profitSummary.breakEvenMonth ? `${profitSummary.breakEvenMonth} Months` : 'N/A'}
        icon={<CalendarCheck2 />}
        helpTitle={t.pages.summary.kpi.breakEven}
        help={t.pages.summary.kpi.breakEvenHelp}
      />
      <KpiCard
        label={t.pages.summary.kpi.funding}
        value={formatCurrency(cashFlowSummary.peakFundingNeed, currency)}
        icon={<Target />}
        helpTitle={t.pages.summary.kpi.funding}
        help={t.pages.summary.kpi.fundingHelp}
      />
    </div>
  );
};

const FinancialWaterfall = ({ data, inputs, currency, t }: { data: EngineOutput, inputs: EngineInput, currency: string, t: any }) => {
    const { revenueSummary, costSummary, profitSummary } = data;
    const { accountingMethod } = inputs.parameters;

    const totalRevenue = revenueSummary.totalRevenue;
    
    let costsToSubtract;
    let costLabel;
    
    if (accountingMethod === 'cogs') {
        costsToSubtract = costSummary.cogsOfSoldGoods;
        costLabel = t.insights.summary.waterfall.cogs;
    } else { // Conservative 'total_costs'
        costsToSubtract = costSummary.totalVariable;
        costLabel = t.insights.summary.waterfall.variableCosts;
    }

    const grossProfit = totalRevenue - costsToSubtract;
    const opex = profitSummary.totalGrossProfit - profitSummary.totalOperatingProfit;
    const operatingProfit = profitSummary.totalOperatingProfit;
    const taxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;
    const netProfit = profitSummary.totalNetProfit;

    const BridgeRow = ({ label, value, colorClass, isSubtle, icon, indent, isNegative = false }: { label: string, value: number, colorClass?: string, isSubtle?: boolean, icon?: React.ReactNode, indent?: boolean, isNegative?: boolean }) => (
      <div className={`flex items-center justify-between py-1.5 text-sm ${indent ? 'pl-6' : ''}`}>
          <div className="flex items-center gap-2">
              {icon}
              <span className="text-muted-foreground">{label}</span>
          </div>
          <span className={`font-medium ${colorClass}`}>{isNegative ? '-' : ''}{formatCurrency(value, currency, false)}</span>
      </div>
    );

    return (
        <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
                 <div className="flex w-full items-center justify-between rounded-t-lg border bg-muted/50 px-4 py-3 text-left text-sm font-semibold shadow-sm hover:bg-muted/80 cursor-pointer">
                     <div className="flex items-center gap-3">
                         <BarChart className="h-5 w-5 text-primary" />
                         <span>{t.insights.summary.waterfall.title}</span>
                     </div>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Card className="rounded-t-none border-t-0">
                    <CardContent className="px-6 py-4">
                        <div className="space-y-1">
                            <BridgeRow label={t.insights.summary.waterfall.revenue} value={totalRevenue} />
                            <BridgeRow label={costLabel} value={costsToSubtract} colorClass="text-red-600" indent isNegative />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.grossProfit} value={grossProfit} />
                            <BridgeRow label={t.insights.summary.waterfall.opex} value={opex} colorClass="text-red-600" indent isNegative />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.operatingProfit} value={operatingProfit} />
                            <BridgeRow label={t.insights.summary.waterfall.taxes} value={taxes} colorClass="text-red-600" indent isNegative />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.netProfit} value={netProfit} colorClass="text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    );
};


// =================================================================
// MAIN PAGE COMPONENT
// =================================================================

function SummaryPageContent({ data, inputs, t }: { data: EngineOutput, inputs: EngineInput, t: any }) {
  const router = useRouter();

  const handleRecalculate = useCallback(() => {
    router.push('/inputs');
  }, [router]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div id="report-content" className="space-y-6">
        <SectionHeader title={t.pages.summary.title} description={t.pages.summary.description} />
        
        <KPISection data={data} currency={inputs.parameters.currency} t={t} />
        
        <div className="space-y-6">
          <HealthPanel 
              healthData={data.businessHealth}
              financialSummaries={{
                revenue: data.revenueSummary,
                cost: data.costSummary,
                profit: data.profitSummary,
              }}
              onRecalculate={handleRecalculate}
              t={t}
          />

          <FinancialWaterfall data={data} inputs={inputs} currency={inputs.parameters.currency} t={t} />
        </div>
      </div>

      <footer className="flex flex-wrap justify-between items-center mt-8 pt-6 border-t gap-4">
        <Button variant="outline" onClick={() => router.push('/cash-flow')}>
          <ArrowLeft className="mr-2" /> Back to Cash Flow
        </Button>
        <DownloadReportButton />
      </footer>
    </div>
  );
}

export default function SummaryPage() {
    const { t, financials, inputs } = useForecast();

    if (financials.isLoading) {
        return <SummaryPageSkeleton t={t} />;
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

    if (!financials.data || !inputs) {
        return (
            <div className="p-4 md:p-8 text-center">
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.noData}</AlertTitle>
                    <AlertDescription>
                        {t.errors.noDataDescription}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <SummaryPageContent data={financials.data} inputs={inputs} t={t} />;
}
