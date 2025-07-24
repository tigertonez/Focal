
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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert financial advisor for first-time e-commerce entrepreneurs. Your tone is extremely encouraging, simple, and educational. Avoid jargon. Your goal is to make finance feel accessible and empowering. The currency is {{{currency}}}.

Analyze the provided financial forecast:
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

Please provide the following analysis.

- **keyFacts**: List the top 3 most critical numbers a shop owner must know from this forecast.
- **strengths**: In a bulleted list, identify the biggest strengths and positive drivers in this plan.
- **weaknesses**: In a bulleted list, pinpoint the 1-2 biggest weaknesses or areas that are holding back profit.
- **recommendations**: In a bulleted list, give 2-3 highly specific, actionable recommendations to improve profitability based directly on the numbers provided.
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

    return output;
  }
);
