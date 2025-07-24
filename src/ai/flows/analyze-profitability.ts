
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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an advanced financial analyst AI writing a growth report for an early-stage founder with limited financial background. Your tone must be clear, educational, and confidence-building. Your mission is to help them understand their numbers and know what to do next.

You will receive a JSON payload containing the user's profit forecast data.
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}
- Currency: {{{currency}}}

Infer the business type from product names (e.g., 'Goldring' -> jewelry).

Your output MUST be ONLY a JSON object with the following 5 keys: "explanation", "whatsWorking", "issues", "opportunities", "topPriorities".

IMPORTANT FORMATTING RULES:
- Do NOT use any Markdown formatting.
- Do NOT use asterisks (*) or bolding (**) anywhere.
- Do NOT use numbered lists, except for 'topPriorities'.
- Use bullet points (•) for all lists, except for 'topPriorities'.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this'.

---
Here is the structure you MUST follow for each key:

1.  **explanation**: Explain Gross, Operating, and Net Profit. For each, use a bullet point to define it, show the user's value, and explain what it means. Use short paragraphs per bullet. Do NOT add a section title.

2.  **whatsWorking**: Start directly with the text. Celebrate strengths in bullet points. Link healthy metrics like gross margin to smart business decisions (e.g., good pricing for 'Goldring 2'). Use positive, encouraging language. Do NOT add a section title.

3.  **issues**: Start directly with the text. Diagnose weak points in plain language using bullet points. If a margin is negative, explain it simply (e.g., "For every €100 you sell, you currently lose €4.90."). Always tie issues back to the numbers that prove it. Do NOT add a section title.

4.  **opportunities**: Start directly with the text. Give 2-3 data-driven, tactical suggestions as bullet points based on the business type. For jewelry, this might be sourcing materials; for fashion, it could be batch production. Be specific and ethical. Do NOT add a section title.

5.  **topPriorities**: Start with "🧭 Top Priorities". Output exactly five, clear, numbered action points. Each point should be a descriptive sentence (1-2 lines). CRITICAL: Add two <br> tags after each priority to create visual spacing. Do NOT add a section title at the start of the content.

Example for 'topPriorities':
"🧭 Top Priorities<br><br>1. Audit and reduce your fixed costs — especially 'Steine' and monthly fees. Renegotiating just 1–2 of them could save €300+.<br><br>2. Lower your unit cost on 'Goldring 2' by sourcing stones with a better €/ct ratio."
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

    // Clean up any accidental leading titles from the AI response
    Object.keys(output).forEach(key => {
        const k = key as keyof AnalyzeProfitabilityOutput;
        if (typeof output[k] === 'string') {
            (output[k] as string) = (output[k] as string).replace(/^\d+\.\s*.*?\n/, '').trim();
        }
    });

    return output;
  }
);
