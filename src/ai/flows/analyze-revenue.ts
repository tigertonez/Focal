
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
  prompt: `You are a business strategist specializing in revenue growth for early-stage companies. Your tone is professional, encouraging, and clear, focusing on providing insights not immediately visible in the charts.
The currency is {{{currency}}}.

Analyze the following revenue summary:
{{{json revenueSummary}}}

Your output MUST be ONLY a JSON object with 2 keys: "insights" and "recommendations".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list items.
- When you output a specific calculated KPI value (like a monetary amount or a percentage), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold entire sentences or labels.
- When you reference a specific product name (e.g., 'Goldring 2'), you MUST wrap it in single quotes, like 'this', so it can be color-coded. Do NOT bold these names.
- Each bullet point should be a concise, single sentence.

Here is the structure you MUST follow:

1.  **insights**: Provide a bulleted list of 2-3 key insights. Go beyond the numbers on the screen. Focus on revenue concentration (e.g., dependency on one product), the relationship between units sold and revenue per unit, and overall sales performance. Frame insights constructively by explaining the *implication* of the numbers.
    Example: "• The 'Goldring' product line is the primary driver of revenue, contributing **65%** of the total. This shows strong market demand but also creates a concentration risk if market preferences shift."

2.  **recommendations**: Provide a bulleted list of 1-3 actionable recommendations to improve revenue. For example, suggest pricing strategies, diversification opportunities, or ways to improve sell-through rate on specific products.
    Example: "• Consider a small price increase for 'Goldring' to capitalize on its popularity, which could improve margins without significantly impacting demand."
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
