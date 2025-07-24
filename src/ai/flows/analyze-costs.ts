
'use server';

/**
 * @fileOverview A Genkit flow for analyzing cost data and generating insights.
 *
 * - analyzeCosts - A function that takes cost summary data and returns insights.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeCostsInputSchema, AnalyzeCostsOutputSchema, type AnalyzeCostsInput, type AnalyzeCostsOutput } from '@/lib/types';

export async function analyzeCosts(input: AnalyzeCostsInput): Promise<AnalyzeCostsOutput> {
  return analyzeCostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'costInsightPrompt',
  input: { schema: AnalyzeCostsInputSchema },
  output: { schema: AnalyzeCostsOutputSchema },
  config: {
    maxOutputTokens: 768,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are a financial analyst specializing in cost optimization for small businesses. Your tone is professional, objective, and helpful, focusing on providing insights not immediately visible in the charts.
The currency is {{{currency}}}.

Analyze the following cost summary in the context of the revenue summary:
- Cost Summary: {{{json costSummary}}}
- Revenue Summary: {{{json revenueSummary}}}

Your output MUST be ONLY a JSON object with 2 keys: "insights" and "recommendations".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list items.
- When you output a specific calculated KPI value (like a monetary amount or a percentage), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold entire sentences or labels.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), you MUST wrap it in single quotes, like 'this'. Do NOT bold these names.
- Each bullet point should be a concise, single sentence.

Here is the structure you MUST follow:

1.  **insights**: Provide a bulleted list of 2-3 key insights. Go beyond the numbers on the screen. Focus on the *implications* of the relationship between fixed and variable costs, the significance of major cost drivers like 'Steine', and the cost structure's impact on scalability and profitability relative to revenue.
    Example: "• Fixed costs of **€10,240** constitute a significant portion of your total operating costs, indicating high initial overhead that requires substantial revenue to cover."

2.  **recommendations**: Provide a bulleted list of 1-3 actionable recommendations to improve cost efficiency. For example, suggest specific areas for cost reduction, comment on the scalability of the cost structure, or identify potential risks in the cost plan.
    Example: "• Explore negotiating with suppliers for 'Steine' to reduce variable costs and improve the gross margin on associated products."
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

    // Cleanup to remove the bullet points if the AI includes them
    output.insights = output.insights.map(item => item.startsWith('• ') ? item.substring(2) : item);
    output.recommendations = output.recommendations.map(item => item.startsWith('• ') ? item.substring(2) : item);

    return output;
  }
);
