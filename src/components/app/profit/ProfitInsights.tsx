
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
import { BadgeCheck, Lightbulb, Target, TrendingUp, Sparkles, BookOpen } from 'lucide-react';

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
      <CardTitle>AI-Powered Insights</CardTitle>
      <CardDescription>Analyzing your profitability...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
       <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full" />
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

const createMarkup = (text: string) => {
    const boldedText = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground/90">$1</strong>');
    return { __html: boldedText };
};

const renderContent = (content: string[] | string) => {
    if (!content) return <p>No insights generated.</p>;

    if (Array.isArray(content)) {
      return (
          <ul className="list-disc list-outside space-y-1.5 pl-4">
              {content.map((item, index) => <li key={index} dangerouslySetInnerHTML={createMarkup(item)} />)}
          </ul>
      );
    }
    
    return <p dangerouslySetInnerHTML={createMarkup(content)} />;
}

// Temporary type to match the new prompt structure
type NarrativeOutput = {
  bigPicture: string;
  keyNumbersExplained: {
    grossProfit: string;
    operatingProfit: string;
    netProfit: string;
  };
  strengths: string[];
  priorities: string[];
}


export function ProfitInsights({
  data,
  currency,
}: {
  data: EngineOutput;
  currency: string;
}) {
  const [insights, setInsights] = useState<NarrativeOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This is a temporary measure. The `analyzeProfitability` flow now has a different prompt
        // but to avoid breaking the UI immediately, we'll call it and transform the output.
        // A full implementation would update this component to match the new narrative structure from the AI.
        const tempFlow = ai.defineFlow(
          {
            name: 'narrativeProfitabilityFlow',
            inputSchema: AnalyzeProfitabilityInputSchema,
            outputSchema: z.object({
                bigPicture: z.string().describe("A simple, one-sentence summary of the forecast."),
                keyNumbersExplained: z.object({
                    grossProfit: z.string().describe("An explanation of Gross Profit for a beginner."),
                    operatingProfit: z.string().describe("An explanation of Operating Profit for a beginner."),
                    netProfit: z.string().describe("An explanation of Net Profit for a beginner."),
                }),
                strengths: z.array(z.string()).describe("A bulleted list of the biggest strengths and positive drivers."),
                priorities: z.array(z.string()).describe("A bulleted list of top priorities and actionable recommendations."),
            })
          },
          async (input) => {
             const prompt = ai.definePrompt({
                name: 'narrativeProfitabilityPrompt',
                input: { schema: AnalyzeProfitabilityInputSchema },
                output: { schema: z.object({
                    bigPicture: z.string().describe("A simple, one-sentence summary of the forecast."),
                    keyNumbersExplained: z.object({
                        grossProfit: z.string().describe("An explanation of Gross Profit for a beginner."),
                        operatingProfit: z.string().describe("An explanation of Operating Profit for a beginner."),
                        netProfit: z.string().describe("An explanation of Net Profit for a beginner."),
                    }),
                    strengths: z.array(z.string()).describe("A bulleted list of the biggest strengths and positive drivers."),
                    priorities: z.array(z.string()).describe("A bulleted list of top priorities and actionable recommendations."),
                }) },
                model: 'googleai/gemini-1.5-flash-latest',
                prompt: `You are an expert financial advisor for first-time e-commerce entrepreneurs. Your tone is extremely encouraging, simple, and educational. Avoid jargon. Your goal is to make finance feel accessible and empowering. The currency is {{{currency}}}.

Analyze the provided financial forecast:
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

Provide the following analysis.

- **The Big Picture**: A simple, one-sentence summary of the forecast. For example: "This plan shows you're set to make a solid profit, but you'll need to watch your initial costs closely."
- **Your Key Numbers, Explained (Like You're Five)**: 
    - For **Gross Profit**, explain what the Total Gross Profit of **{{{profitSummary.totalGrossProfit}}}** means. Describe it as "the money you make from selling your products *before* paying for company-wide bills." Explain how it's calculated in simple terms (e.g., "We get this by taking your total sales and subtracting the direct costs of making your products.").
    - For **Operating Profit**, explain the Total Operating Profit of **{{{profitSummary.totalOperatingProfit}}}**. Describe it as "what's left *after* you pay for your regular business expenses like salaries or marketing."
    - For **Net Profit**, explain the Total Net Profit of **{{{profitSummary.totalNetProfit}}}**. Describe this as "the final amount of money you actually get to keep after *all* bills, including taxes, are paid. This is your 'bottom line'."
- **What's Going Well (Your Strengths!)**: In a bulleted list, identify the 1-2 biggest strengths and positive drivers in this plan. Be specific and tie it back to the numbers. For example: "Your 'Pro Widget' is a cash cow, bringing in a huge chunk of your revenue." or "You have very low production costs, which means you keep more profit from every sale."
- **Top Priorities (Where to Focus Next)**: In a bulleted list, pinpoint the 1-2 biggest weaknesses or areas that are holding back profit. Frame these as opportunities. For example: "Opportunity: The 'Super Service' is expensive to deliver. Can we find a way to make it more efficient?" or "Heads-up: Your marketing budget is high compared to your sales. Let's make sure every dollar is working hard."
`
              });
              const { output } = await prompt(input);
              if (!output) throw new Error("No output from AI");
              return output;
          }
        );

        const result = await tempFlow({
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
        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Your Growth Report</CardTitle>
        <CardDescription>
          An AI-powered analysis of your plan, explained in simple terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <InsightSection title="The Big Picture" icon={<Target className="text-primary" />}>
          {renderContent(insights.bigPicture)}
        </InsightSection>
        
        <InsightSection title="Your Key Numbers, Explained" icon={<BookOpen className="text-primary" />}>
            <div className="space-y-3">
              {renderContent(insights.keyNumbersExplained.grossProfit)}
              {renderContent(insights.keyNumbersExplained.operatingProfit)}
              {renderContent(insights.keyNumbersExplained.netProfit)}
            </div>
        </InsightSection>

        <InsightSection title="What's Going Well (Your Strengths!)" icon={<BadgeCheck className="text-green-500" />}>
          {renderContent(insights.strengths)}
        </InsightSection>

        <InsightSection title="Top Priorities (Where to Focus Next)" icon={<Lightbulb className="text-amber-500" />}>
          {renderContent(insights.priorities)}
        </InsightSection>
      </CardContent>
    </Card>
  );
}
