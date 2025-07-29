
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { getFinancials } from '@/lib/get-financials';
import type { EngineOutput, EngineInput, BusinessHealth, BusinessHealthScoreKpi, RevenueSummary, CostSummary, ProfitSummary } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, TrendingUp, TrendingDown, Landmark, PiggyBank, Target, CalendarCheck2, BadgeCheck, Lightbulb, ShieldAlert, ChevronDown, RefreshCw, Bot, Loader2, MinusCircle, PlusCircle, Sparkles, ListOrdered, CheckCircle, ChevronRight, BarChart } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


// =================================================================
// Child Components
// =================================================================

const KPISection = ({ data, currency, t }: { data: EngineOutput, currency: string, t: any }) => {
  const { revenueSummary, costSummary, profitSummary, cashFlowSummary } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
  onRecalculate,
  t
}: { 
  healthData?: BusinessHealth,
  financialSummaries: { revenue: RevenueSummary, cost: CostSummary, profit: ProfitSummary },
  onRecalculate: () => void,
  t: any
}) => {
    const { inputs, locale } = useForecast();
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
                products: inputs.products,
                language: locale,
            });
            setAiInsights(result);
        } catch (e: any) {
            setError(e.message || 'Failed to get AI strategy.');
        } finally {
            setIsLoading(false);
        }
    }, [healthData, financialSummaries, inputs, locale]);

    if (!healthData) {
        return (
            <Card className="flex flex-col items-center justify-center rounded-lg p-8 text-center">
                 <CardTitle className="mb-2">{t.insights.summary.title}</CardTitle>
                 <p className="text-muted-foreground mb-4 text-sm">{t.pages.summary.health.new}</p>
                 <Button onClick={onRecalculate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.pages.summary.health.recalculate}
                 </Button>
            </Card>
        );
    }
    
    const { score, kpis } = healthData;
    const kpiTooltips: Record<string, string> = {
        'Net Margin': t.pages.summary.health.netMarginHelp,
        'Cash Runway': t.pages.summary.health.runwayHelp,
        'Contribution Margin': t.pages.summary.health.contributionMarginHelp,
        'Peak Funding': t.pages.summary.health.peakFundingHelp,
        'Sell-Through': t.pages.summary.health.sellThroughHelp,
        'Break-Even': t.pages.summary.health.breakEvenHelp,
    };

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
                        <CardTitle>{t.insights.summary.title}</CardTitle>
                        <CardDescription>{t.insights.summary.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-6">
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <div className={cn("text-5xl font-bold font-headline px-6 py-4 rounded-full", getScoreColor(score))}>
                           {score.toFixed(0)}
                        </div>
                        <p className="text-sm text-muted-foreground">{t.insights.summary.overallScore}</p>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {kpis.map(kpi => <HealthBar key={kpi.label} label={kpi.label} value={kpi.value} tooltip={kpiTooltips[kpi.label] || kpi.tooltip} />)}
                        </div>
                    </div>
                </div>
                
                <Separator className="my-6" />

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{t.insights.summary.strategize.error}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {!aiInsights && !isLoading && (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">{t.insights.summary.strategize.title}</h3>
                        <p className="text-muted-foreground mb-4">{t.insights.summary.strategize.description}</p>
                        <Button onClick={handleStrategize} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {t.insights.summary.strategize.button}
                        </Button>
                    </div>
                )}
                
                {isLoading && (
                   <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">{t.insights.summary.strategize.loaderText}</p>
                   </div>
                )}
                
                {aiInsights && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-start">
                             <div>
                                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> {t.insights.summary.strategize.reportTitle}</CardTitle>
                                <CardDescription>
                                  {t.insights.summary.strategize.reportDescription}
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleStrategize} disabled={isLoading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t.insights.regenerate}
                            </Button>
                        </div>
                        
                        <InsightSection title={t.insights.summary.strategize.summary} icon={<Lightbulb className="text-amber-500" />}>
                           <p className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(aiInsights.summary)} />
                        </InsightSection>

                        <InsightSection title={t.insights.summary.strategize.strengths} icon={<CheckCircle className="text-green-500" />}>
                          {renderContent(aiInsights.strengths)}
                        </InsightSection>
                        
                        <InsightSection title={t.insights.summary.strategize.opportunities} icon={<TrendingUp className="text-blue-500" />}>
                          {renderContent(aiInsights.opportunities)}
                        </InsightSection>

                        <InsightSection title={t.insights.summary.strategize.risks} icon={<ShieldAlert className="text-red-500" />}>
                           {renderContent(aiInsights.risks)}
                        </InsightSection>
                     </div>
                )}
            </CardContent>
        </Card>
    );
};


const BridgeRow = ({ label, value, currency, colorClass, isSubtle = false, icon, indent = false }: { label: string, value: number, currency: string, colorClass?: string, isSubtle?: boolean, icon?: React.ReactNode, indent?: boolean }) => (
    <div className={cn("flex items-center justify-between py-1.5", isSubtle ? 'text-sm' : 'text-base', indent && 'pl-6')}>
        <div className="flex items-center gap-2">
            {icon}
            <span className={cn(isSubtle ? 'text-muted-foreground' : 'font-medium')}>{label}</span>
        </div>
        <span className={cn(colorClass, 'font-bold')}>{formatCurrency(value, currency)}</span>
    </div>
);

const FinancialWaterfall = ({ data, currency, t }: { data: EngineOutput, currency: string, t: any }) => {
    const { revenueSummary, costSummary, profitSummary } = data;

    const totalRevenue = revenueSummary.totalRevenue;
    let cogs;
    if (data.businessHealth) { // Check if health score is calculated (i.e. 'cogs' mode was used if applicable)
        cogs = revenueSummary.totalRevenue - profitSummary.totalGrossProfit;
    } else {
        cogs = costSummary.totalVariable; // Fallback for conservative accounting
    }

    const grossProfit = profitSummary.totalGrossProfit;
    const opex = profitSummary.totalGrossProfit - profitSummary.totalOperatingProfit;
    const operatingProfit = profitSummary.totalOperatingProfit;
    const taxes = profitSummary.totalOperatingProfit - profitSummary.totalNetProfit;
    const netProfit = profitSummary.totalNetProfit;

    return (
        <Collapsible>
            <CollapsibleTrigger asChild>
                 <div className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 text-left text-sm font-semibold shadow-sm hover:bg-muted/80">
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
                            <BridgeRow label={t.insights.summary.waterfall.revenue} value={totalRevenue} currency={currency} />
                            <BridgeRow label={t.insights.summary.waterfall.cogs} value={-cogs} currency={currency} colorClass="text-red-600" indent icon={<MinusCircle className="h-3.5 w-3.5 text-red-500/80" />} />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.grossProfit} value={grossProfit} currency={currency} />
                            <BridgeRow label={t.insights.summary.waterfall.opex} value={-opex} currency={currency} colorClass="text-red-600" indent icon={<MinusCircle className="h-3.5 w-3.5 text-red-500/80" />} />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.operatingProfit} value={operatingProfit} currency={currency} />
                            <BridgeRow label={t.insights.summary.waterfall.taxes} value={-taxes} currency={currency} colorClass="text-red-600" indent icon={<MinusCircle className="h-3.5 w-3.5 text-red-500/80" />} />
                            <Separator className="my-1" />
                            <BridgeRow label={t.insights.summary.waterfall.netProfit} value={netProfit} currency={currency} colorClass="text-blue-600 font-bold" />
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

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-start">
        <SectionHeader title={t.pages.summary.title} description={t.pages.summary.description} />
      </div>
      
      <KPISection data={data} currency={inputs.parameters.currency} t={t} />
      
      <HealthPanel 
        healthData={data.businessHealth}
        financialSummaries={{
          revenue: data.revenueSummary,
          cost: data.costSummary,
          profit: data.profitSummary,
        }}
        onRecalculate={() => router.push('/inputs')}
        t={t}
      />

      <FinancialWaterfall data={data} currency={inputs.parameters.currency} t={t} />

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
    const { t } = useForecast();
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
        return <SummaryPageSkeleton t={t} />;
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        {error} {t.errors.calculationErrorDescription}
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
                    <AlertTitle>{t.errors.noData}</AlertTitle>
                    <AlertDescription>
                        {t.errors.noDataDescription}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <SummaryPageContent data={data} inputs={inputs} t={t} />;
}

    