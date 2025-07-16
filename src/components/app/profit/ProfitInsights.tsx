
'use client';

import React, { useEffect, useState } from 'react';
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
import { analyzeProfitability } from '@/ai/flows/analyze-profitability';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeCheck, BadgeAlert, Lightbulb, Target } from 'lucide-react';

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
    <div className="text-sm text-muted-foreground pl-7">{children}</div>
  </div>
);

const ProfitInsightsLoader: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI-Powered Insights</CardTitle>
      <CardDescription>Analyzing your profitability...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
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
  const [insights, setInsights] = useState<AnalyzeProfitabilityOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getInsights = async () => {
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
    };
    getInsights();
  }, [data, currency]);

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
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || 'Could not load AI insights. Please try again later.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Insights</CardTitle>
        <CardDescription>
          Your profitability report at a glance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <InsightSection title="Key Facts" icon={<Target className="text-primary" />}>
          <ul className="list-disc list-outside space-y-1 pl-4">
            {insights.keyFacts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </InsightSection>

        <InsightSection title="Strengths" icon={<BadgeCheck className="text-green-500" />}>
          <p>{insights.strengths}</p>
        </InsightSection>

        <InsightSection title="Weaknesses" icon={<BadgeAlert className="text-amber-500" />}>
          <p>{insights.weaknesses}</p>
        </InsightSection>

        <InsightSection title="Recommendations" icon={<Lightbulb className="text-blue-500" />}>
          <p>{insights.recommendations}</p>
        </InsightSection>
      </CardContent>
    </Card>
  );
}
