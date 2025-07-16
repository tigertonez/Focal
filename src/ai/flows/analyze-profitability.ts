
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
  prompt: `You are an expert e-commerce growth consultant. Your tone is direct, data-driven, and focused on actionable advice for a shop owner. The currency is {{{currency}}}.

Analyze the following financial forecast:
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

Provide the following analysis in concise, scannable bullet points.

- **Key Facts**: List the top 3 most critical numbers a shop owner must know from this forecast.
- **What's Working**: Identify the biggest strengths and positive drivers in this plan.
- **Opportunities for Growth**: Pinpoint the 1-2 biggest weaknesses or areas that are holding back profit.
- **Top Priorities**: Give 2-3 highly specific, actionable recommendations to improve profitability based directly on the numbers provided.
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
    
    if (!output) {
      throw new Error("The AI model did not return a valid response.");
    }
    
    // Ensure the output is in the expected format (lists or simple strings)
    // This is a simplified transformation for demonstration
    const formattedOutput: AnalyzeProfitabilityOutput = {
      keyFacts: Array.isArray(output.keyFacts) ? output.keyFacts : [output.keyFacts],
      strengths: output.strengths,
      weaknesses: output.weaknesses,
      recommendations: output.recommendations,
    };

    return formattedOutput;
  }
);
