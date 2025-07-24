'use server';

/**
 * @fileOverview A Genkit flow for analyzing cost data and generating insights.
 *
 * - analyzeCosts - A function that takes cost summary data and returns insights.
 * - AnalyzeCostsInput - The input type for the analyzeCosts function.
 * - AnalyzeCostsOutput - The return type for the analyzeCosts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CostSummarySchema, RevenueSummarySchema } from '@/lib/types';

export const AnalyzeCostsInputSchema = z.object({
  costSummary: CostSummarySchema,
  revenueSummary: RevenueSummarySchema,
  currency: z.string(),
});
export type AnalyzeCostsInput = z.infer<typeof AnalyzeCostsInputSchema>;

export const AnalyzeCostsOutputSchema = z.object({
  insights: z.array(z.string()).describe("A list of 2-3 key insights derived from the cost summary."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the cost analysis."),
});
export type AnalyzeCostsOutput = z.infer<typeof AnalyzeCostsOutputSchema>;


export async function analyzeCosts(input: AnalyzeCostsInput): Promise<AnalyzeCostsOutput> {
  return analyzeCostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'costInsightPrompt',
  input: { schema: AnalyzeCostsInputSchema },
  output: { schema: AnalyzeCostsOutputSchema },
  prompt: `You are a financial analyst specializing in cost optimization for small businesses.
The currency is {{{currency}}}.

Analyze the following cost summary in the context of the revenue summary:
- Cost Summary: {{{json costSummary}}}
- Revenue Summary: {{{json revenueSummary}}}

Based on the analysis, generate the following:
1.  **Insights**: Provide a bulleted list of 2-3 key insights. Focus on the relationship between fixed and variable costs, the significance of major cost drivers, and the cost structure relative to revenue.
2.  **Recommendations**: Provide a bulleted list of 1-3 actionable recommendations to improve cost efficiency. For example, suggest areas for cost reduction, comment on the scalability of the cost structure, or identify potential risks in the cost plan.
`,
});

const analyzeCostsFlow = ai.defineFlow(
  {
    name: 'analyzeCostsFlow',
    inputSchema: AnalyzeCostsInputSchema,
    outputSchema: AnalyzeCostsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid cost analysis.");
    }
    return output;
  }
);
