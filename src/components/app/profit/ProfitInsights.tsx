
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  type Product,
  type FixedCostItem,
} from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, TrendingDown, TrendingUp, Sparkles, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { analyzeProfitability } from '@/ai/flows/analyze-profitability';
import { getProductColor } from '@/lib/utils';
import { useForecast } from '@/context/ForecastContext';

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

export function ProfitInsights({
  data,
  currency,
}: {
  data: EngineOutput;
  currency: string;
}) {
  const { inputs } = useForecast();
  const [insights, setInsights] = useState<AnalyzeProfitabilityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null); // Clear previous insights
    try {
      const result = await analyzeProfitability({
          revenueSummary: data.revenueSummary,
          costSummary: data.costSummary,
          profitSummary: data.profitSummary,
          currency,
      });
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
  
  const createMarkup = useCallback((text: string | undefined): { __html: string } => {
    if (!text) return { __html: '' };

    let processedText = text
      // Bolding with **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground/90 font-semibold">$1</strong>')
      // Styling for 'item names'
      .replace(/'([^']*)'/g, (match, itemName) => {
        const color = itemColorMap.get(itemName) || 'hsl(var(--muted-foreground))';
        return `<span class="font-semibold" style="text-shadow: 0 0 1px ${color}, 0 0 3px ${color}; color: hsl(var(--foreground));">${itemName}</span>`;
      });
      
    return { __html: processedText };
  }, [itemColorMap]);

  const renderContent = (content: string | undefined) => {
    if (!content) return <p>No insights generated.</p>;
    
    // Check if it's the Top Priorities list
    if (content.startsWith('🧭 Top Priorities')) {
      const listContent = content.replace('🧭 Top Priorities', '').replace(/<br>/g, '').trim();
      const items = listContent.split(/\s*\d+\.\s*/).filter(item => item.trim());
      
      return (
        <ol className="list-none space-y-4">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <div className="flex-shrink-0 text-primary font-semibold">{index + 1}.</div>
              <div className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(item)} />
            </li>
          ))}
        </ol>
      );
    }
    
    // For all other sections
    const paragraphs = content.split('\n').filter(p => p.trim());
    return (
        <div className="space-y-2">
            {paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(p)} />
            ))}
        </div>
    );
  }

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
                 <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Your Growth Report</CardTitle>
                <CardDescription>
                  An AI-powered analysis of your profit forecast.
                </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={getInsights} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
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
          {renderContent(insights.topPriorities)}
        </InsightSection>
      </CardContent>
    </Card>
  );
}
