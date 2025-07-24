
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

Please provide the following analysis in a narrative, easy-to-read format.

### The Big Picture
- Start with a simple, one-sentence summary of the forecast. For example: "This plan shows you're set to make a solid profit, but you'll need to watch your initial costs closely."

### Your Key Numbers, Explained (Like You're Five)
- **Gross Profit**: Explain what the **Total Gross Profit** of **{{{profitSummary.totalGrossProfit}}}** means. Describe it as "the money you make from selling your products *before* paying for company-wide bills." Explain how it's calculated in simple terms (e.g., "We get this by taking your total sales and subtracting the direct costs of making your products.").
- **Operating Profit**: Explain the **Total Operating Profit** of **{{{profitSummary.totalOperatingProfit}}}**. Describe it as "what's left *after* you pay for your regular business expenses like salaries or marketing."
- **Net Profit**: Explain the **Total Net Profit** of **{{{profitSummary.totalNetProfit}}}**. Describe this as "the final amount of money you actually get to keep after *all* bills, including taxes, are paid. This is your 'bottom line'."

### What's Going Well (Your Strengths!)
- In a bulleted list, identify the 1-2 biggest strengths and positive drivers in this plan. Be specific and tie it back to the numbers. For example: "Your 'Pro Widget' is a cash cow, bringing in a huge chunk of your revenue." or "You have very low production costs, which means you keep more profit from every sale."

### Top Priorities (Where to Focus Next)
- In a bulleted list, pinpoint the 1-2 biggest weaknesses or areas that are holding back profit. Frame these as opportunities. For example: "Opportunity: The 'Super Service' is expensive to deliver. Can we find a way to make it more efficient?" or "Heads-up: Your marketing budget is high compared to your sales. Let's make sure every dollar is working hard."
- Provide 1-2 highly specific, actionable recommendations. For example: "Focus on selling more of your 'Pro Widget' since its profit margin is so high." or "Consider a small price increase on the 'Basic Widget' to boost its profitability."
`,
});

const analyzeProfitabilityFlow = ai.defineFlow(
  {
    name: 'analyzeProfitabilityFlow',
    inputSchema: AnalyzeProfitabilityInputSchema,
    outputSchema: z.object({ // The output schema now needs to be manually defined to match the new narrative prompt structure.
        bigPicture: z.string().describe("A simple, one-sentence summary of the forecast."),
        keyNumbersExplained: z.object({
            grossProfit: z.string().describe("An explanation of Gross Profit for a beginner."),
            operatingProfit: z.string().describe("An explanation of Operating Profit for a beginner."),
            netProfit: z.string().describe("An explanation of Net Profit for a beginner."),
        }),
        strengths: z.array(z.string()).describe("A bulleted list of the biggest strengths and positive drivers."),
        priorities: z.array(z.string()).describe("A bulleted list of top priorities and actionable recommendations."),
    }),
  },
  async (input) => {
    // This is a temporary workaround to match the old output schema with the new prompt.
    // In a real scenario, you would update the calling component to handle the new narrative structure.
    const tempPrompt = ai.definePrompt({
        name: 'tempProfitabilityInsightPrompt',
        input: { schema: AnalyzeProfitabilityInputSchema },
        output: { schema: AnalyzeProfitabilityOutputSchema }, // Use the original schema for the output mapping
        prompt: `You are an expert e-commerce growth consultant. Your tone is direct, data-driven, and focused on actionable advice for a shop owner. The currency is {{{currency}}}.

Analyze the following financial forecast:
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

Provide the following analysis. For any sections that are lists, provide them as a JSON array of strings.

- **Key Facts**: List the top 3 most critical numbers a shop owner must know from this forecast.
- **What's Working**: In a bulleted list, identify the biggest strengths and positive drivers in this plan.
- **Opportunities for Growth**: In a bulleted list, pinpoint the 1-2 biggest weaknesses or areas that are holding back profit.
- **Top Priorities**: In a bulleted list, give 2-3 highly specific, actionable recommendations to improve profitability based directly on the numbers provided.
`,
    });

    const { output } = await tempPrompt(input);
    
    if (!output) {
      throw new Error("The AI model did not return a valid response.");
    }

    return output;
  }
);
