'use server';
/**
 * @fileOverview A Genkit flow to analyze profitability data and generate insights.
 *
 * - analyzeProfitability - A function that takes financial summaries and returns strategic insights.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeProfitabilityInputSchema,
  type AnalyzeProfitabilityInput,
  AnalyzeProfitabilityOutputSchema,
  type AnalyzeProfitabilityOutput,
} from '@/lib/types';

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
