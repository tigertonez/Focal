
'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lightbulb, TrendingDown, TrendingUp, Sparkles, ListOrdered, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Generating your growth report...</p>
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>')
      .replace(/'([^']*)'/g, (match, itemName) => {
        const color = itemColorMap.get(itemName) || 'hsl(var(--foreground))';
        return `<span class="font-semibold" style="color: ${color};">${itemName}</span>`;
      });
      
    return { __html: processedText };
  }, [itemColorMap]);

  const renderContent = (content: string | undefined) => {
    if (!content) return <p>No insights generated.</p>;
    
    if (content.startsWith('🧭 Top Priorities')) {
      const listContent = content.replace('🧭 Top Priorities', '').trim();
       const items = listContent.split('<br><br>').filter(item => item.trim());
      
      return (
        <ol className="list-none space-y-4">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <div className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(item)} />
            </li>
          ))}
        </ol>
      );
    }
    
    if (content.includes('•')) {
      return (
        <ul className="list-none space-y-3">
          {content.split('•').filter(p => p.trim()).map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <p className="leading-relaxed flex-1" dangerouslySetInnerHTML={createMarkup(p)} />
            </li>
          ))}
        </ul>
      );
    }
    
    const paragraphs = content.split('\n').filter(p => p.trim());
    return (
        <div className="space-y-2">
            {paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={createMarkup(p)} />
            ))}
        </div>
    );
  }

  if (!insights && !isLoading && !error) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Your Growth Report</CardTitle>
                <CardDescription>Get an AI-powered analysis of your profit forecast.</CardDescription>
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
