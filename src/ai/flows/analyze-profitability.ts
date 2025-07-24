
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
import { getProductColor } from '@/lib/utils';


export async function analyzeProfitability(
  input: AnalyzeProfitabilityInput
): Promise<AnalyzeProfitabilityOutput> {
  return analyzeProfitabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitabilityInsightPrompt',
  input: { schema: AnalyzeProfitabilityInputSchema },
  output: { schema: AnalyzeProfitabilityOutputSchema },
  model: 'googleai/gemini-1.5-pro-latest',
  config: {
    maxOutputTokens: 512,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an advanced financial analyst AI writing a growth report for an early-stage founder with limited financial background. Your tone must be clear, educational, and confidence-building. Your mission is to help them understand their numbers and know what to do next.

You will receive a JSON payload containing the user's profit forecast data.
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}
- Currency: {{{currency}}}

Infer the business type from product names (e.g., 'Goldring' -> jewelry).

Your output MUST be ONLY a JSON object with the following 5 keys: "explanation", "whatsWorking", "issues", "opportunities", "topPriorities".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list-based sections ('whatsWorking', 'issues', 'opportunities', 'explanation').
- Do NOT use numbered lists, except for 'topPriorities'.
- When you output a specific calculated KPI value (like a monetary amount or a percentage), you MUST make it bold using Markdown's double asterisks, like **this**.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this'.
- Do NOT use asterisks (*) for any other reason.

---
Here is the structure you MUST follow for each key:

1.  **explanation**: Explain Gross, Operating, and Net Profit. For each, use a bullet point to define it, show the user's value (which MUST be bolded), and explain what it means. Use short paragraphs per bullet.

2.  **whatsWorking**: Celebrate strengths in bullet points. Link healthy metrics like gross margin to smart business decisions (e.g., good pricing for 'Goldring 2'). Use positive, encouraging language. CRITICAL: If there are no clear strengths, you MUST output the single sentence "The current plan shows areas for improvement across the board."

3.  **issues**: Diagnose weak points in plain language using bullet points. If a margin is negative, explain it simply (e.g., "For every €100 you sell, you currently lose €4.90."). Always tie issues back to the numbers that prove it.

4.  **opportunities**: Give 2-3 data-driven, tactical suggestions as bullet points based on the business type. For jewelry, this might be sourcing materials; for fashion, it could be batch production. Be specific and ethical.

5.  **topPriorities**: Output exactly five, clear, numbered action points. Each point should be a descriptive sentence (1-2 lines). CRITICAL: Add two <br> tags after each priority to create visual spacing. Start with "🧭 Top Priorities".
---
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
    
    const cleanString = (str: string | undefined) => {
      if (!str) return '';
      return str.replace(/^(.*?:\s*)/, '').trim();
    }
    
    if (!output.whatsWorking || output.whatsWorking.trim() === '') {
        output.whatsWorking = "The current plan shows areas for improvement across the board.";
    }
    
    output.explanation = cleanString(output.explanation);
    output.whatsWorking = cleanString(output.whatsWorking);
    output.issues = cleanString(output.issues);
    output.opportunities = cleanString(output.opportunities);

    return output;
  }
);
