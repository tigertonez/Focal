'use server';

/**
 * @fileOverview A Genkit flow for analyzing cash flow data and generating insights.
 *
 * - analyzeCashFlow - A function that takes cash flow data and returns insights and recommendations.
 * - AnalyzeCashFlowInput - The input type for the analyzeCashFlow function.
 * - AnalyzeCashFlowOutput - The return type for the analyzeCashFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CashFlowSummarySchema } from '@/lib/types';

export const AnalyzeCashFlowInputSchema = z.object({
  cashFlowSummary: CashFlowSummarySchema,
  currency: z.string(),
});
export type AnalyzeCashFlowInput = z.infer<typeof AnalyzeCashFlowInputSchema>;

export const AnalyzeCashFlowOutputSchema = z.object({
  insights: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).describe("A list of key insight metrics derived from the summary."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the cash flow analysis."),
});
export type AnalyzeCashFlowOutput = z.infer<typeof AnalyzeCashFlowOutputSchema>;


export async function analyzeCashFlow(input: AnalyzeCashFlowInput): Promise<AnalyzeCashFlowOutput> {
  return analyzeCashFlowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cashFlowInsightPrompt',
  input: { schema: AnalyzeCashFlowInputSchema },
  output: { schema: AnalyzeCashFlowOutputSchema },
  prompt: `You are an expert financial analyst providing advice to a business owner.
The currency is {{{currency}}}.

Analyze the following cash flow summary:
{{{json cashFlowSummary}}}

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

Based on the summary, generate the following:
1.  **Insights**: Create a list of key metrics. The label should be the metric name (e.g., "Peak Funding Need") and the value should be the formatted number (e.g., "**€15,234**" or "**4 Months**" or "**Infinite**"). Include:
    - Peak Funding Need
    - Months to Break-Even
    - Final Cash Position
    - Cash Runway (Months)
2.  **Recommendations**: Provide a short, bulleted list of 1-3 highly specific, actionable recommendations. For example:
    - "High funding requirement - consider raising deposits or delaying production."
    - "Excellent cash-flow timeline - strong business model."
    - "Positive final position - consider reinvestment."
`,
});

const analyzeCashFlowFlow = ai.defineFlow(
  {
    name: 'analyzeCashFlowFlow',
    inputSchema: AnalyzeCashFlowInputSchema,
    outputSchema: AnalyzeCashFlowOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid response.");
    }
    return output;
  }
);
