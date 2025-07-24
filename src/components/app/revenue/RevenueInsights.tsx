
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
import { analyzeRevenue, type AnalyzeRevenueOutput } from '@/ai/flows/analyze-revenue';
import type { RevenueSummary } from '@/lib/types';

const InsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Revenue Analysis</CardTitle>
      <CardDescription>AI-powered analysis of your revenue is loading...</CardDescription>
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

interface RevenueInsightsProps {
    revenueSummary: RevenueSummary;
    currency: string;
}

export function RevenueInsights({ revenueSummary, currency }: RevenueInsightsProps) {
  const [insights, setInsights] = useState<AnalyzeRevenueOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeRevenue({ revenueSummary, currency });
      setInsights(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights.');
    } finally {
      setIsLoading(false);
    }
  }, [revenueSummary, currency]);

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
          <CardTitle>Revenue Analysis</CardTitle>
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
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Revenue Analysis</CardTitle>
              <CardDescription>
                AI-powered analysis of your revenue forecast.
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
