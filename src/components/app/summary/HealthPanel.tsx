
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { type BusinessHealth, type BusinessHealthScoreKpi, type RevenueSummary, type CostSummary, type ProfitSummary, type StrategizeHealthScoreOutput } from '@/lib/types';
import { strategizeHealthScore } from '@/ai/flows/strategize-health-score';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn, getProductColor } from '@/lib/utils';
import { RefreshCw, Sparkles, Loader2, Lightbulb, CheckCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import { StaticProgress } from '@/components/print/StaticProgress';
import { Progress } from '@/components/ui/progress';

const HealthBar = ({ label, value, tooltip, isPrint = false }: { label: string, value: number, tooltip: string, isPrint?: boolean }) => {
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
                        {isPrint ? <StaticProgress value={value} indicatorClassName={getColor(value)} /> : <Progress value={value} indicatorClassName={getColor(value)} />}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3" data-no-print="true">
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

export const HealthPanel = ({ 
  healthData,
  financialSummaries,
  onRecalculate,
  t,
  isPrint = false
}: { 
  healthData?: BusinessHealth,
  financialSummaries: { revenue: RevenueSummary, cost: CostSummary, profit: ProfitSummary },
  onRecalculate: () => void,
  t: any,
  isPrint?: boolean
}) => {
    const { inputs, locale, ensureForecastReady } = useForecast();
    const [aiInsights, setAiInsights] = useState<StrategizeHealthScoreOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasAiInsights = aiInsights && Object.values(aiInsights).some(v => Array.isArray(v) ? v.length > 0 : !!v);
    
    const handleStrategize = useCallback(async () => {
        if (isPrint || !healthData) return; // Don't run for print
        setIsLoading(true);
        setError(null);
        setAiInsights(null);
        try {
            await ensureForecastReady();
            const result = await strategizeHealthScore({
                businessHealth: healthData,
                revenueSummary: financialSummaries.revenue,
                costSummary: financialSummaries.cost,
                profitSummary: financialSummaries.profit,
                products: inputs.products,
                language: locale,
                companyContext: inputs.company,
            });
            setAiInsights(result);
        } catch (e: any) {
            setError(e.message || 'Failed to get AI strategy.');
        } finally {
            setIsLoading(false);
        }
    }, [isPrint, healthData, financialSummaries, inputs, locale, ensureForecastReady]);

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

    if (isPrint && !healthData) {
        return null;
    }

    if (!healthData) {
        return (
            <Card className="flex flex-col items-center justify-center rounded-lg p-8 text-center" data-no-print={isPrint}>
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
                            {kpis.map(kpi => <HealthBar 
                                key={kpi.labelKey} 
                                label={t.pages.summary.health.kpis[kpi.labelKey as keyof typeof t.pages.summary.health.kpis]} 
                                value={kpi.value} 
                                tooltip={t.pages.summary.health[kpi.tooltipKey as keyof typeof t.pages.summary.health]}
                                isPrint={isPrint}
                            />)}
                        </div>
                    </div>
                </div>
                
                <div data-no-print="true">
                    <Separator className="my-6" />

                    {error && (
                        <Alert variant="destructive" className="mt-4" data-no-print="true">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>{t.insights.summary.strategize.error}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {!hasAiInsights && !isLoading && (
                        <div className="text-center" data-no-print="true">
                            <h3 className="text-lg font-semibold mb-2">{t.insights.summary.strategize.title}</h3>
                            <p className="text-muted-foreground mb-4">{t.insights.summary.strategize.description}</p>
                            <Button onClick={handleStrategize} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {t.insights.summary.strategize.button}
                            </Button>
                        </div>
                    )}
                    
                    {isLoading && (
                       <div className="text-center" data-no-print="true">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">{t.insights.summary.strategize.loaderText}</p>
                       </div>
                    )}
                    
                    {hasAiInsights && (
                         <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                 <div>
                                     <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> {t.insights.summary.strategize.reportTitle}</CardTitle>
                                    <CardDescription>
                                      {t.insights.summary.strategize.reportDescription}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleStrategize} disabled={isLoading} data-no-print="true">
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
                </div>
            </CardContent>
        </Card>
    );
};
