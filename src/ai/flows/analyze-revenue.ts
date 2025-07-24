'use server';

/**
 * @fileOverview A Genkit flow for analyzing revenue data and generating insights.
 *
 * - analyzeRevenue - A function that takes revenue summary data and returns insights.
 * - AnalyzeRevenueInput - The input type for the analyzeRevenue function.
 * - AnalyzeRevenueOutput - The return type for the analyzeRevenue function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { RevenueSummarySchema } from '@/lib/types';

export const AnalyzeRevenueInputSchema = z.object({
  revenueSummary: RevenueSummarySchema,
  currency: z.string(),
});
export type AnalyzeRevenueInput = z.infer<typeof AnalyzeRevenueInputSchema>;

export const AnalyzeRevenueOutputSchema = z.object({
  insights: z.array(z.string()).describe("A list of 2-3 key insights derived from the revenue summary."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the revenue analysis."),
});
export type AnalyzeRevenueOutput = z.infer<typeof AnalyzeRevenueOutputSchema>;


export async function analyzeRevenue(input: AnalyzeRevenueInput): Promise<AnalyzeRevenueOutput> {
  return analyzeRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'revenueInsightPrompt',
  input: { schema: AnalyzeRevenueInputSchema },
  output: { schema: AnalyzeRevenueOutputSchema },
  prompt: `You are a business strategist specializing in revenue growth for early-stage companies.
The currency is {{{currency}}}.

Analyze the following revenue summary:
{{{json revenueSummary}}}

Based on the analysis, generate the following:
1.  **Insights**: Provide a bulleted list of 2-3 key insights. Focus on revenue concentration (e.g., dependency on one product), the relationship between units sold and revenue per unit, and overall sales performance.
2.  **Recommendations**: Provide a bulleted list of 1-3 actionable recommendations to improve revenue. For example, suggest pricing strategies, diversification opportunities, or ways to improve sell-through rate.
`,
});

const analyzeRevenueFlow = ai.defineFlow(
  {
    name: 'analyzeRevenueFlow',
    inputSchema: AnalyzeRevenueInputSchema,
    outputSchema: AnalyzeRevenueOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid revenue analysis.");
    }
    return output;
  }
);
