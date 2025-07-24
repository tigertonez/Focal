
'use server';

/**
 * @fileOverview A Genkit flow for analyzing revenue data and generating insights.
 *
 * - analyzeRevenue - A function that takes revenue summary data and returns insights.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeRevenueInputSchema, AnalyzeRevenueOutputSchema, type AnalyzeRevenueInput, type AnalyzeRevenueOutput } from '@/lib/types';


export async function analyzeRevenue(input: AnalyzeRevenueInput): Promise<AnalyzeRevenueOutput> {
  return analyzeRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'revenueInsightPrompt',
  input: { schema: AnalyzeRevenueInputSchema },
  output: { schema: AnalyzeRevenueOutputSchema },
  config: {
    maxOutputTokens: 512,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are a business strategist specializing in revenue growth for early-stage companies. Your tone is professional, encouraging, and clear.
The currency is {{{currency}}}.

Analyze the following revenue summary:
{{{json revenueSummary}}}

Your output MUST be ONLY a JSON object with 2 keys: "insights" and "recommendations".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list items.
- Do NOT use asterisks (*) or any other form of bolding.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this'.
- Each bullet point should be a concise, single sentence.

Here is the structure you MUST follow:

1.  **insights**: Provide a bulleted list of 2-3 key insights. Focus on revenue concentration (e.g., dependency on one product), the relationship between units sold and revenue per unit, and overall sales performance. Frame insights constructively.
    Example: "• The 'Goldring' product line is the primary driver of revenue, showing strong market demand."

2.  **recommendations**: Provide a bulleted list of 1-3 actionable recommendations to improve revenue. For example, suggest pricing strategies, diversification opportunities, or ways to improve sell-through rate.
    Example: "• Consider a small price increase for 'Goldring' to capitalize on its popularity and improve margins."
`,
});

const analyzeRevenueFlow = ai.defineFlow(
  {
    name: 'analyzeRevenueFlow',
    inputSchema: AnalyzeRevenueInputSchema,
    outputSchema: AnalyzeRevenueOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid revenue analysis.");
    }
    
    // Cleanup to remove the bullet points if the AI includes them
    output.insights = output.insights.map(item => item.startsWith('• ') ? item.substring(2) : item);
    output.recommendations = output.recommendations.map(item => item.startsWith('• ') ? item.substring(2) : item);

    return output;
  }
);
