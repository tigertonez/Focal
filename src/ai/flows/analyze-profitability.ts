
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
  prompt: `You are an expert financial advisor and business coach, mentoring a first-time entrepreneur. Your tone is super encouraging, simple, and educational. Your goal is to make finance feel accessible and empowering, as if you're explaining it to a 12-year-old. Use simple analogies. The currency is {{{currency}}}.

Analyze the provided financial forecast:
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

Please provide the following analysis as a narrative report.

- **keyFacts**: This should be a single, encouraging sentence summarizing the overall health of the forecast. For example, "This is a great starting point! Your plan shows you're on the path to building a profitable business."

- **strengths**: Explain the user's financial metrics like they are 12. For each key metric (Gross Profit, Operating Profit, Net Profit), do the following:
    1.  **What it is**: Explain the concept in very simple terms. (e.g., "Think of Gross Profit as the money you make from just selling your rings, before paying for fixed costs like your salary.").
    2.  **How we got here**: Show the simple math using their numbers. (e.g., "We took your Total Revenue of **X** and subtracted the **Y** it cost to make the items you sold.").
    3.  **What this means for you**: Explain the real-world implication. (e.g., "A positive Gross Profit of **Z** means your business model is sound at its core—you're selling your products for more than they cost to make!").
    Combine these three points into a single, easy-to-read paragraph for each metric.

- **weaknesses**: Reframe weaknesses as "Opportunities for Growth." Identify the 1-2 biggest areas that are holding back profit. For each, explain the "why" in simple terms and what the impact is. (e.g., "Your fixed costs for 'XYZ' seem high compared to your revenue. This means a big chunk of your gross profit is being used up before you can take any home, which is why your Net Profit is lower than you might expect.")

- **recommendations**: Give 2-3 highly specific, actionable "Next Steps." Frame them as exciting challenges. (e.g., "Challenge: Can you contact your supplier for 'ABC' and see if you can get a 10% discount on your next order? This would directly boost your profit on every single sale.").
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
