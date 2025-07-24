
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type EngineOutput,
  type AnalyzeProfitabilityOutput,
} from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, TrendingDown, TrendingUp, Sparkles, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const InsightSection: React.FC<InsightSectionProps> = ({
  title,
  icon,
  children,
}) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h3>
    <div className="text-sm text-muted-foreground pl-7 space-y-2">{children}</div>
  </div>
);

const ProfitInsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Your Growth Report</CardTitle>
      <CardDescription>An AI-powered analysis of your profit forecast is loading...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

const createMarkup = (text: string | undefined) => {
    if (!text) return { __html: '' };
    const boldedText = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground/90 font-semibold">$1</strong>');
    return { __html: boldedText };
};

const renderContent = (content: string | undefined, isPriorityList: boolean = false) => {
    if (!content) return <p>No insights generated.</p>;
    
    // Check if it's a numbered list for Top Priorities
    if (isPriorityList && content.match(/^\s*\d+\.\s*/m)) {
      const items = content.split(/\n\s*\d+\.\s*/).filter(item => item.trim() !== '');
      return (
        <ol className="list-decimal list-outside space-y-4 pl-4">
          {items.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={createMarkup(item.trim())} />
          ))}
        </ol>
      );
    }
    
    return <p className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(content)} />;
}

export function ProfitInsights({
  data,
  currency,
}: {
  data: EngineOutput;
  currency: string;
}) {
  const [insights, setInsights] = useState<AnalyzeProfitabilityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null); // Clear previous insights
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-profitability',
          revenueSummary: data.revenueSummary,
          costSummary: data.costSummary,
          profitSummary: data.profitSummary,
          currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to analyze profitability.');
      }
      
      const result = await response.json();
      setInsights(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate insights.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [data, currency]);

  useEffect(() => {
    getInsights();
  }, [getInsights]);

  if (isLoading) {
    return <ProfitInsightsLoader />;
  }

  if (error || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error Generating Insights</AlertTitle>
            <AlertDescription>
              <p>{error || 'Could not load AI insights. Please try again.'}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={getInsights}>
                 <RefreshCcw className="mr-2" />
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
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Your Growth Report</CardTitle>
                <CardDescription>
                  An AI-powered analysis of your profit forecast.
                </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={getInsights} disabled={isLoading}>
                <RefreshCcw className="mr-2" />
                Regenerate
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <InsightSection title="Your Financial Story" icon={<Lightbulb className="text-amber-500" />}>
          {renderContent(insights.explanation)}
        </InsightSection>

        <InsightSection title="What's Working" icon={<CheckCircle className="text-green-500" />}>
          {renderContent(insights.whatsWorking)}
        </InsightSection>
        
        <InsightSection title="Key Issues" icon={<TrendingDown className="text-red-500" />}>
          {renderContent(insights.issues)}
        </InsightSection>

        <InsightSection title="Opportunities" icon={<TrendingUp className="text-blue-500" />}>
          {renderContent(insights.opportunities)}
        </InsightSection>

        <InsightSection title="Top Priorities" icon={<ListOrdered className="text-primary" />}>
          {renderContent(insights.topPriorities, true)}
        </InsightSection>
      </CardContent>
    </Card>
  );
}
