
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput, BusinessHealth } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2, BadgeCheck, Lightbulb, ShieldAlert, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// =================================================================
// PLACEHOLDER COMPONENTS (PART A & B)
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        label="Profit Break-Even"
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
const HealthBar = ({ label, value }: { label: string, value: number }) => {
    const getColor = (v: number) => {
        if (v < 40) return 'bg-destructive';
        if (v < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value.toFixed(0)} / 100</span>
            </div>
            <Progress value={value} indicatorClassName={getColor(value)} />
        </div>
    );
};

const HealthPanel = ({ healthData }: { healthData?: BusinessHealth }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!healthData) {
        return (
            <Card className="flex h-32 items-center justify-center rounded-lg text-muted-foreground">
                Business Health Score data is not available.
            </Card>
        );
    }
    const { score, kpis, insights, alerts } = healthData;

    const getScoreColor = (s: number) => {
        if (s < 40) return 'bg-destructive text-destructive-foreground';
        if (s < 70) return 'bg-yellow-500 text-yellow-foreground';
        return 'bg-green-500 text-green-foreground';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
                <CardDescription>A weighted score based on key financial metrics to gauge your plan's viability.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <div className={cn("text-5xl font-bold font-headline px-6 py-4 rounded-full", getScoreColor(score))}>
                           {score.toFixed(0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                {kpis.slice(0, 2).map(kpi => <HealthBar key={kpi.label} {...kpi} />)}
                            </div>
                            <CollapsibleContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4 animate-in fade-in-0 zoom-in-95">
                                {kpis.slice(2).map(kpi => <HealthBar key={kpi.label} {...kpi} />)}
                            </CollapsibleContent>

                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full mt-4 text-sm">
                                    <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                                    {isOpen ? 'Hide' : 'Show'} Score Breakdown
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </div>
                </div>

                {(insights.length > 0 || alerts.length > 0) && (
                  <div className="mt-6 space-y-4">
                      {insights.length > 0 && (
                          <Alert variant="default">
                              <Lightbulb className="h-4 w-4" />
                              <AlertTitle>Insights</AlertTitle>
                              <AlertDescription>
                                  <ul className="list-disc pl-5">
                                      {insights.map((item, i) => <li key={i}>{item}</li>)}
                                  </ul>
                              </AlertDescription>
                          </Alert>
                      )}
                      {alerts.length > 0 && (
                          <Alert variant="destructive">
                              <ShieldAlert className="h-4 w-4" />
                              <AlertTitle>Alerts</AlertTitle>
                              <AlertDescription>
                                  <ul className="list-disc pl-5">
                                    {alerts.map((item, i) => <li key={i}>{item}</li>)}
                                  </ul>
                              </AlertDescription>
                          </Alert>
                      )}
                  </div>
                )}
            </CardContent>
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
      <HealthPanel healthData={data.businessHealth} />

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
