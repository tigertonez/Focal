
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ShieldAlert, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForecast } from '@/context/ForecastContext';
import { analyzeCashFlow, type AnalyzeCashFlowOutput } from '@/ai/flows/analyze-cash-flow';
import type { CashFlowSummary } from '@/lib/types';
import { KpiCard } from '../KpiCard';

const InsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cash Flow Health</CardTitle>
      <CardDescription>AI-powered analysis of your cash flow is loading...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function CashFlowInsights() {
  const { inputs, financials } = useForecast();
  const [insights, setInsights] = useState<AnalyzeCashFlowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    getInsights();
  }, [getInsights]);
  
  const createMarkup = (text: string): { __html: string } => {
    if (!text) return { __html: '' };
    return { __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>') };
  };

  if (isLoading) {
    return <InsightsLoader />;
  }

  if (error || !insights) {
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
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
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
           <div className="space-y-3">
             <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500" />
                Recommendations
            </h3>
              <ul className="text-sm text-muted-foreground pl-7 space-y-2 list-disc list-inside">
                 {insights.recommendations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  </change>
  <change>
    <file>src/components/app/costs/CostsInsights.tsx</file>
    <content><![CDATA[
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ShieldAlert, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeCosts, type AnalyzeCostsOutput } from '@/ai/flows/analyze-costs';
import type { CostSummary, RevenueSummary } from '@/lib/types';

const InsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cost Analysis</CardTitle>
      <CardDescription>AI-powered analysis of your costs is loading...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface CostsInsightsProps {
    costSummary: CostSummary;
    revenueSummary: RevenueSummary;
    currency: string;
}

export function CostsInsights({ costSummary, revenueSummary, currency }: CostsInsightsProps) {
  const [insights, setInsights] = useState<AnalyzeCostsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeCosts({ costSummary, revenueSummary, currency });
      setInsights(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights.');
    } finally {
      setIsLoading(false);
    }
  }, [costSummary, revenueSummary, currency]);

  useEffect(() => {
    getInsights();
  }, [getInsights]);

  if (isLoading) {
    return <InsightsLoader />;
  }

  if (error || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Cost Analysis</CardTitle>
              <CardDescription>
                AI-powered analysis of your cost structure.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={getInsights} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Regenerate
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Key Insights
            </h3>
            <ul className="text-sm text-muted-foreground pl-7 space-y-2 list-disc list-inside">
                {insights.insights.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
           <div className="space-y-3">
             <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500" />
                Recommendations
            </h3>
              <ul className="text-sm text-muted-foreground pl-7 space-y-2 list-disc list-inside">
                 {insights.recommendations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
