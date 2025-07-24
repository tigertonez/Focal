
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

CRITICAL FORMATTING RULE (for 'insights' only):
When you output a specific calculated KPI value (like a monetary amount or a number of months), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold any other text.

Here is the structure you MUST follow:

1.  **insights**: Create a list of key metrics. The label should be the metric name (e.g., "Peak Funding Need") and the value should be the formatted, bolded KPI value (e.g., "**€15,234**" or "**4 Months**" or "**Infinite**"). Include:
    - Peak Funding Need
    - Months to Break-Even
    - Final Cash Position
    - Cash Runway (Months)

2.  **recommendations**: Provide a bulleted list of 1-3 highly specific, actionable recommendations. Frame them as clear directives. Do NOT use bolding or asterisks. Each recommendation should be a concise, single sentence.
    Example: "• The high funding requirement suggests a need to either raise deposits or delay production to manage cash flow."
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
    
    // Cleanup to remove the bullet points if the AI includes them
    output.recommendations = output.recommendations.map(item => item.startsWith('• ') ? item.substring(2) : item);

    return output;
  }
);
