
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeCosts, type AnalyzeCostsOutput } from '@/ai/flows/analyze-costs';
import type { CostSummary, RevenueSummary } from '@/lib/types';
import { useForecast } from '@/context/ForecastContext';
import { getProductColor } from '@/lib/utils';

const InsightSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h3>
    <div className="text-sm text-muted-foreground pl-7 space-y-2">{children}</div>
  </div>
);

const InsightsLoader: React.FC<{ t: any }> = ({ t }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> {t.insights.costs.title}</CardTitle>
      <CardDescription>{t.insights.loaderDescription}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t.insights.loaderText}</p>
      </div>
    </CardContent>
  </Card>
);

interface CostsInsightsProps {
    costSummary: CostSummary;
    revenueSummary: RevenueSummary;
    currency: string;
    isPrint?: boolean;
}

export function CostsInsights({ costSummary, revenueSummary, currency, isPrint = false }: CostsInsightsProps) {
  const { inputs, t, locale, ensureForecastReady } = useForecast();
  const [insights, setInsights] = useState<AnalyzeCostsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInsights = insights && (insights.insights.length > 0 || insights.recommendations.length > 0);

  const getInsights = useCallback(async () => {
    if (isPrint) return; // Don't run AI for print
    setIsLoading(true);
    setError(null);
    try {
      await ensureForecastReady();
      const result = await analyzeCosts({ 
        costSummary, 
        revenueSummary, 
        currency, 
        language: locale, 
        companyContext: inputs.company 
      });
      setInsights(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights.');
    } finally {
      setIsLoading(false);
    }
  }, [isPrint, costSummary, revenueSummary, currency, locale, inputs.company, ensureForecastReady]);

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

  const createMarkup = (text: string): { __html: string } => {
    if (!text) return { __html: '' };
    let processedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground/90">$1</strong>')
      .replace(/'([^']*)'/g, (_, itemName) => {
        const color = itemColorMap.get(itemName) || 'hsl(var(--foreground))';
        return `<span class="font-semibold" style="color: ${color};">${itemName}</span>`;
      });
    return { __html: processedText };
  };

  const renderList = (items: string[]) => (
    <ul className="list-none space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <p className="leading-relaxed flex-1" dangerouslySetInnerHTML={createMarkup(item)} />
          </li>
        ))}
    </ul>
  );
  
  if (isPrint && (!insights || !hasInsights)) {
    return null;
  }

  if (isLoading) {
    return <InsightsLoader t={t} />;
  }

  if (error) {
    return (
      <Card data-no-print={isPrint}>
        <CardHeader>
          <CardTitle>{t.insights.costs.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{t.insights.errorTitle}</AlertTitle>
            <AlertDescription>
              <p>{error || t.insights.errorDescription}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={getInsights}>
                 <RefreshCcw className="mr-2 h-4 w-4" />
                 {t.insights.retry}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!hasInsights) {
     return (
        <Card data-no-print="true">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> {t.insights.costs.title}</CardTitle>
                <CardDescription>{t.insights.costs.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={getInsights} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t.insights.generateAnalysis}
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> {t.insights.costs.title}</CardTitle>
              <CardDescription>
                {t.insights.costs.description}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={getInsights} disabled={isLoading} data-no-print="true">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t.insights.regenerate}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <InsightSection title={t.insights.costs.insights} icon={<Lightbulb className="text-amber-500" />}>
          {renderList(insights!.insights)}
        </InsightSection>
        <InsightSection title={t.insights.costs.recommendations} icon={<TrendingUp className="text-blue-500" />}>
          {renderList(insights!.recommendations)}
        </InsightSection>
      </CardContent>
    </Card>
  );
}
