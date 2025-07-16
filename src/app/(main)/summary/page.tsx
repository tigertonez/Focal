
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput, BusinessHealth, BusinessHealthScoreKpi, RevenueSummary, CostSummary, ProfitSummary } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2, BadgeCheck, Lightbulb, ShieldAlert, ChevronDown, RefreshCw, Bot, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { strategizeHealthScore, type StrategizeHealthScoreOutput } from '@/ai/flows/strategize-health-score';
import { Separator } from '@/components/ui/separator';


// =================================================================
// Child Components
// =================================================================

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


const HealthBar = ({ label, value, tooltip }: { label: string, value: number, tooltip: string }) => {
    const getColor = (v: number) => {
        if (v < 40) return 'bg-destructive';
        if (v < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="space-y-1 w-full">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">{value.toFixed(0)} / 100</span>
                        </div>
                        <Progress value={value} indicatorClassName={getColor(value)} />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                    <p className="text-muted-foreground text-xs">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const HealthPanel = ({ 
  healthData,
  financialSummaries,
  onRecalculate 
}: { 
  healthData?: BusinessHealth,
  financialSummaries: { revenue: RevenueSummary, cost: CostSummary, profit: ProfitSummary },
  onRecalculate: () => void 
}) => {
    const [aiInsights, setAiInsights] = useState<StrategizeHealthScoreOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleStrategize = useCallback(async () => {
        if (!healthData) return;
        setIsLoading(true);
        setError(null);
        setAiInsights(null);
        try {
            const result = await strategizeHealthScore({
                businessHealth: healthData,
                revenueSummary: financialSummaries.revenue,
                costSummary: financialSummaries.cost,
                profitSummary: financialSummaries.profit,
            });
            setAiInsights(result);
        } catch (e: any) {
            setError(e.message || 'Failed to get AI strategy.');
        } finally {
            setIsLoading(false);
        }
    }, [healthData, financialSummaries]);

    if (!healthData) {
        return (
            <Card className="flex flex-col items-center justify-center rounded-lg p-8 text-center">
                 <CardTitle className="mb-2">Business Health Score</CardTitle>
                 <p className="text-muted-foreground mb-4 text-sm">This feature is new. Please re-run your report to see the analysis.</p>
                 <Button onClick={onRecalculate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Go to Inputs & Recalculate
                 </Button>
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
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Business Health Score</CardTitle>
                        <CardDescription>A weighted score based on key financial metrics to gauge your plan's viability.</CardDescription>
                    </div>
                    <Button onClick={handleStrategize} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Strategize with AI
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <div className={cn("text-5xl font-bold font-headline px-6 py-4 rounded-full", getScoreColor(score))}>
                           {score.toFixed(0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {kpis.map(kpi => <HealthBar key={kpi.label} {...kpi} />)}
                        </div>
                    </div>
                </div>
                
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>AI Strategy Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {aiInsights && (
                     <Alert className="mt-6">
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>AI-Powered Strategy</AlertTitle>
                        <AlertDescription>
                          <div className="space-y-3 mt-2">
                             <div>
                                <h4 className="font-semibold text-foreground">Strategic Summary</h4>
                                <p className="text-muted-foreground">{aiInsights.summary}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-foreground">Top Opportunities</h4>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {aiInsights.opportunities.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-foreground">Key Risks to Mitigate</h4>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {aiInsights.risks.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                          </div>
                        </AlertDescription>
                    </Alert>
                )}

                {(insights.length > 0 || alerts.length > 0) && !aiInsights && (
                  <div className="mt-6 space-y-4">
                      {insights.length > 0 && (
                          <Alert variant="default">
                              <Lightbulb className="h-4 w-4" />
                              <AlertTitle>Insights</AlertTitle>
                              <AlertDescription>
                                  <ul className="list-disc pl-5 mt-1">
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
                                  <ul className="list-disc pl-5 mt-1">
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


const BridgeRow = ({ label, value, currency, colorClass, isSubtle = false, icon }: { label: string, value: number, currency: string, colorClass?: string, isSubtle?: boolean, icon?: React.ReactNode }) => (
    <div className={cn("flex items-center justify-between py-2", isSubtle ? 'text-sm' : 'text-base')}>
        <div className="flex items-center gap-2">
            {icon}
            <span className={cn(isSubtle ? 'text-muted-foreground' : 'font-medium')}>{label}</span>
        </div>
        <span className={cn(colorClass, 'font-headline font-bold')}>{formatCurrency(value, currency)}</span>
    </div>
);

const CashBridge = ({ data, currency }: { data: EngineOutput, currency: string }) => {
    const { profitSummary, costSummary, cashFlowSummary } = data;

    const operatingProfit = profitSummary.totalOperatingProfit;
    const unsoldInventoryValue = costSummary.cogsOfUnsoldGoods;
    const estTaxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;
    const endingCash = cashFlowSummary.endingCashBalance;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profit to Cash Bridge</CardTitle>
                <CardDescription>How your operating profit converts to your final cash balance.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-4">
                <div className="space-y-1">
                    <BridgeRow 
                        label="Operating Profit" 
                        value={operatingProfit} 
                        currency={currency} 
                        icon={<PlusCircle className="h-4 w-4 text-green-500" />}
                    />
                    <BridgeRow 
                        label="Cash Tied in Unsold Inventory" 
                        value={-unsoldInventoryValue} 
                        currency={currency} 
                        colorClass="text-red-600"
                        icon={<MinusCircle className="h-4 w-4 text-red-500" />}
                    />
                    <div className="space-y-1">
                        <BridgeRow 
                            label="Estimated Taxes" 
                            value={-estTaxes} 
                            currency={currency} 
                            colorClass="text-red-600"
                            icon={<MinusCircle className="h-4 w-4 text-red-500" />}
                        />
                         <p className="pl-8 text-xs text-muted-foreground text-left">*Based on the estimated tax rate provided. Actual taxes may differ.</p>
                    </div>

                    <Separator className="my-2" />

                    <BridgeRow 
                        label="Ending Cash Balance" 
                        value={endingCash} 
                        currency={currency} 
                        colorClass="text-blue-600 font-bold"
                    />
                </div>
            </CardContent>
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
      
      <KPISection data={data} currency={inputs.parameters.currency} />
      
      <HealthPanel 
        healthData={data.businessHealth}
        financialSummaries={{
          revenue: data.revenueSummary,
          cost: data.costSummary,
          profit: data.profitSummary,
        }}
        onRecalculate={() => router.push('/inputs')}
      />

      <CashBridge data={data} currency={inputs.parameters.currency} />

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
