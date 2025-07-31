

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput, BusinessHealth, BusinessHealthScoreKpi, RevenueSummary, CostSummary, ProfitSummary } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2, BadgeCheck, Lightbulb, ShieldAlert, ChevronDown, RefreshCw, Bot, Loader2, MinusCircle, PlusCircle, Sparkles, ListOrdered, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber, getProductColor } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { strategizeHealthScore, type StrategizeHealthScoreOutput } from '@/ai/flows/strategize-health-score';
import { Separator } from '@/components/ui/separator';
import { DownloadReportButton } from '@/components/app/summary/DownloadReportButton';
import { useForecast } from '@/context/ForecastContext';


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

const InsightSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h3>
    <div className="text-sm text-muted-foreground pl-7 space-y-2">{children}</div>
  </div>
);


const HealthPanel = ({ 
  healthData,
  financialSummaries,
  onRecalculate 
}: { 
  healthData?: BusinessHealth,
  financialSummaries: { revenue: RevenueSummary, cost: CostSummary, profit: ProfitSummary },
  onRecalculate: () => void 
}) => {
    const { inputs } = useForecast();
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
    
    const { score, kpis } = healthData;

    const getScoreColor = (s: number) => {
        if (s < 40) return 'bg-destructive text-destructive-foreground';
        if (s < 70) return 'bg-yellow-500 text-yellow-foreground';
        return 'bg-green-500 text-green-foreground';
    };
    
    const itemColorMap = useMemo(() => {
        const map = new Map<string, string>();
        [...inputs.products, ...inputs.fixedCosts].forEach(item => {
          const name = 'productName' in item ? item.productName : item.name;
          if (name) {
            map.set(name, getProductColor(item));
          }
        });
        return map;
    }, [inputs.products, inputs.fixedCosts]);
    
    const createMarkup = useCallback((text: string | undefined | string[]): { __html: string } => {
        if (!text) return { __html: '' };
        const textToProcess = Array.isArray(text) ? text.join(' ') : text;
        
        let processedText = textToProcess
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground/90">$1</strong>')
            .replace(/'([^']*)'/g, (match, itemName) => {
                const color = itemColorMap.get(itemName) || 'hsl(var(--foreground))';
                return `<span class="font-semibold" style="color: ${color};">${itemName}</span>`;
            });
            
        return { __html: processedText };
    }, [itemColorMap]);

    const renderContent = (content: string | string[] | undefined) => {
        if (!content) return <p>No insights generated.</p>;
        const contentArray = Array.isArray(content) ? content : [content];
        
        return (
            <ul className="list-none space-y-3">
                {contentArray.map((item, i) => (
                    <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <p className="leading-relaxed flex-1" dangerouslySetInnerHTML={createMarkup(item)} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Business Health Score</CardTitle>
                        <CardDescription>A weighted score based on key financial metrics to gauge your plan's viability.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-6">
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
                
                <Separator className="my-6" />

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>AI Strategy Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {!aiInsights && !isLoading && (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Get Your Strategic Analysis</h3>
                        <p className="text-muted-foreground mb-4">Unlock AI-powered insights to improve your business plan.</p>
                        <Button onClick={handleStrategize} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Strategic Report
                        </Button>
                    </div>
                )}
                
                {isLoading && (
                   <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Generating your strategic report...</p>
                   </div>
                )}
                
                {aiInsights && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-start">
                             <div>
                                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Strategic Health Report</CardTitle>
                                <CardDescription>
                                  AI-powered analysis of your business health score.
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleStrategize} disabled={isLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Regenerate
                            </Button>
                        </div>
                        
                        <InsightSection title="Strategic Summary" icon={<Lightbulb className="text-amber-500" />}>
                           <p className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(aiInsights.summary)} />
                        </InsightSection>

                        <InsightSection title="Key Strengths" icon={<CheckCircle className="text-green-500" />}>
                          {renderContent(aiInsights.strengths)}
                        </InsightSection>
                        
                        <InsightSection title="Top Opportunities" icon={<TrendingUp className="text-blue-500" />}>
                          {renderContent(aiInsights.opportunities)}
                        </InsightSection>

                        <InsightSection title="Key Risks to Mitigate" icon={<ShieldAlert className="text-red-500" />}>
                           {renderContent(aiInsights.risks)}
                        </InsightSection>
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
        <span className={cn(colorClass, 'font-bold')}>{formatCurrency(value, currency)}</span>
    </div>
);

const CashBridge = ({ data, currency }: { data: EngineOutput, currency: string }) => {
    const { profitSummary, costSummary, cashFlowSummary } = data;

    const operatingProfit = profitSummary.totalOperatingProfit;
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
      <div id="report-content" className="space-y-8">
        <div className="flex justify-between items-start">
          <SectionHeader title="Financial Summary" description="An overview of your business forecast." />
        </div>
        
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
      </div>

      <footer className="flex justify-between items-center mt-8 pt-6 border-t">
        <Button onClick={() => router.push('/cash-flow')}>
          <ArrowLeft className="mr-2" /> Back to Cash Flow
        </Button>
        <DownloadReportButton />
      </footer>
    </div>
  );
}

export default function SummaryPage() {
    const { financials, inputs: contextInputs } = useForecast();

    if (financials.isLoading) {
        return <SummaryPageSkeleton />;
    }

    if (financials.error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Calculation Error</AlertTitle>
                    <AlertDescription>
                        {financials.error} Please correct the issues on the Inputs page and try again.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!financials.data || !contextInputs) {
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

    return <SummaryPageContent data={financials.data} inputs={contextInputs} />;
}
