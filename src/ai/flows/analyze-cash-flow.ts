
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
  config: {
    maxOutputTokens: 512,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an expert financial analyst providing advice to a business owner. Your tone is professional, clear, and direct.
The currency is {{{currency}}}.

Analyze the following cash flow summary:
{{{json cashFlowSummary}}}

Your output MUST be ONLY a JSON object with 2 keys: "insights" and "recommendations".

CRITICAL FORMATTING RULES:
- When you output a specific calculated KPI value (like a monetary amount or a number of months), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold any other text.
- Use bullet points (•) for all 'recommendations'. Do NOT use bolding in recommendations. Each recommendation should be a concise, single sentence.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this'.

Here is the structure you MUST follow:

1.  **insights**: Provide a list of key metrics as an array of objects, each with a "label" and "value".
    - For the "label", use the metric name (e.g., "Peak Funding Need").
    - For the "value", provide the formatted, bolded KPI (e.g., "**€15,234**" or "**4 Months**"). Follow the KPI value with a one-sentence interpretation, explaining what it means for the business.

2.  **recommendations**: Provide a bulleted list of 1-3 highly specific, actionable recommendations. Frame them as clear directives. Go beyond the obvious; suggest specific strategies.
    Example: "• The high funding requirement suggests a need to either raise deposits for products like 'Goldring 1' or delay production to manage cash flow."
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
    
    // Cleanup to remove the bullet points if the AI includes them by mistake
    output.recommendations = output.recommendations.map(item => item.startsWith('• ') ? item.substring(2) : item);

    return output;
  }
);
