'use server';

/**
 * @fileOverview A Genkit flow for analyzing cash flow data and generating insights.
 *
 * - analyzeCashFlow - A function that takes cash flow data and returns insights and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AnalyzeCashFlowInputSchema, AnalyzeCashFlowOutputSchema, type AnalyzeCashFlowInput, type AnalyzeCashFlowOutput } from '@/lib/types';


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

CRITICAL FORMATTING RULE: When you output a specific calculated KPI value (like a monetary amount or a number of months), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold any other text.

Based on the summary, generate the following:
1.  **Insights**: Create a list of key metrics. The label should be the metric name (e.g., "Peak Funding Need") and the value should be the formatted, bolded KPI value (e.g., "**€15,234**" or "**4 Months**" or "**Infinite**"). Include:
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
