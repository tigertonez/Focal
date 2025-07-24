
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ShieldAlert, RefreshCcw, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForecast } from '@/context/ForecastContext';
import { analyzeCashFlow, type AnalyzeCashFlowOutput } from '@/ai/flows/analyze-cash-flow';
import { getProductColor } from '@/lib/utils';

const InsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cash Flow Health</CardTitle>
      <CardDescription>AI-powered analysis of your cash flow is loading...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Generating your cash flow analysis...</p>
      </div>
    </CardContent>
  </Card>
);

export function CashFlowInsights() {
  const { inputs, financials } = useForecast();
  const [insights, setInsights] = useState<AnalyzeCashFlowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cashFlowSummary = financials?.data?.cashFlowSummary;
  const currency = inputs.parameters.currency;

  const getInsights = useCallback(async () => {
    if (!cashFlowSummary) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeCashFlow({ cashFlowSummary, currency });
      setInsights(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights.');
    } finally {
      setIsLoading(false);
    }
  }, [cashFlowSummary, currency]);
  
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
      .replace(/'([^']*)'/g, (match, itemName) => {
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

  if (isLoading) {
    return <InsightsLoader />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error Generating Insights</AlertTitle>
            <AlertDescription>
              <p>{error || 'Could not load AI insights.'}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={getInsights}>
                 <RefreshCcw className="mr-2 h-4 w-4" />
                 Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cash Flow Health</CardTitle>
                <CardDescription>Get AI-powered analysis and recommendations for your cash flow.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={getInsights} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Analysis
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
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cash Flow Health</CardTitle>
              <CardDescription>
                AI-powered analysis of your cash flow.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={getInsights} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Regenerate
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Key Metrics
            </h3>
            <div className="pl-7 space-y-2">
              {insights.insights.map((item, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex justify-between items-center">
                      <span>{item.label}</span>
                      <span className="font-bold text-foreground" dangerouslySetInnerHTML={createMarkup(item.value)} />
                  </div>
              ))}
            </div>
        </div>
        <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Recommendations
            </h3>
            <div className="pl-7">{renderList(insights.recommendations)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
