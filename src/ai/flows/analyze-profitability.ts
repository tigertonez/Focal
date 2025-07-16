'use server';
/**
 * @fileOverview A Genkit flow to analyze profitability data and generate insights.
 *
 * - analyzeProfitability - A function that takes financial summaries and returns strategic insights.
 * - AnalyzeProfitabilityInput - The input type for the analyzeProfitability function.
 * - AnalyzeProfitabilityOutput - The return type for the analyzeProfitability function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  RevenueSummarySchema,
  CostSummarySchema,
  ProfitSummarySchema,
} from '@/lib/types';

export const AnalyzeProfitabilityInputSchema = z.object({
  revenueSummary: RevenueSummarySchema,
  costSummary: CostSummarySchema,
  profitSummary: ProfitSummarySchema,
  currency: z.string(),
});
export type AnalyzeProfitabilityInput = z.infer<
  typeof AnalyzeProfitabilityInputSchema
>;

export const AnalyzeProfitabilityOutputSchema = z.object({
  keyFacts: z
    .array(z.string())
    .describe('A list of the top 3 most important facts from the data.'),
  strengths: z
    .string()
    .describe('A brief paragraph on the key strengths found in the data.'),
  weaknesses: z
    .string()
    .describe('A brief paragraph on the key weaknesses or risks found.'),
  recommendations: z
    .string()
    .describe(
      'A brief paragraph with actionable strategic recommendations to improve profitability.'
    ),
});
export type AnalyzeProfitabilityOutput = z.infer<
  typeof AnalyzeProfitabilityOutputSchema
>;

export async function analyzeProfitability(
  input: AnalyzeProfitabilityInput
): Promise<AnalyzeProfitabilityOutput> {
  return analyzeProfitabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitabilityInsightPrompt',
  input: { schema: AnalyzeProfitabilityInputSchema },
  output: { schema: AnalyzeProfitabilityOutputSchema },
  prompt: `You are an expert financial analyst providing insights for a startup founder. Your tone is concise, encouraging, and clear. The currency is {{{currency}}}.

Analyze the following financial data:
Revenue Summary:
\`\`\`json
{{{json revenueSummary}}}
\`\`\`

Cost Summary:
\`\`\`json
{{{json costSummary}}}
\`\`\`

Profit Summary:
\`\`\`json
{{{json profitSummary}}}
\`\`\`

Based on this data, provide the following insights:
1.  **Key Facts**: Generate a list of the top 3 most important, attention-grabbing facts. These should be single, impactful sentences.
2.  **Strengths**: Write a brief paragraph (2-3 sentences) highlighting the strongest aspects of the financial forecast.
3.  **Weaknesses**: Write a brief paragraph (2-3 sentences) identifying the primary risks or areas for improvement.
4.  **Recommendations**: Write a brief paragraph (2-3 sentences) offering actionable strategic advice to improve profitability.
`,
});

const analyzeProfitabilityFlow = ai.defineFlow(
  {
    name: 'analyzeProfitabilityFlow',
    inputSchema: AnalyzeProfitabilityInputSchema,
    outputSchema: AnalyzeProfitabilityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
