
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
  prompt: `You are an advanced financial analyst AI writing a growth report for an early-stage founder with limited financial background. Your tone must be clear, educational, and confidence-building. Your mission is to help them understand their numbers and know what to do next.

You will receive a JSON payload containing the user's profit forecast data.
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}
- Currency: {{{currency}}}

Infer the business type from product names (e.g., 'Goldring' -> jewelry).

Your output MUST be ONLY a JSON object with the following 5 keys: "explanation", "whatsWorking", "issues", "opportunities", "topPriorities".

When you reference a specific individual number or financial metric from the data, make it bold using Markdown's double asterisks, like **this**. Do not use quotation marks for numbers.

---
Here is the structure you MUST follow for each key:

1.  **explanation**: Start with "📖 Your Financial Story". Explain Gross, Operating, and Net Profit in simple terms. Show the user's actual values and explain what they mean for the business. Avoid dense paragraphs.

2.  **whatsWorking**: Start with "✅ What’s Working". Celebrate strengths. Link healthy metrics like gross margin to smart business decisions (e.g., good pricing for 'Goldring 2'). Use positive, encouraging language.

3.  **issues**: Start with "❌ Key Issues". Diagnose weak points in plain language. If a margin is negative, explain it simply (e.g., "For every €100 you sell, you currently lose €4.90."). Always tie issues back to the numbers that prove it.

4.  **opportunities**: Start with "📈 Opportunities". Give 2-3 data-driven, tactical suggestions based on the business type. For jewelry, this might be sourcing materials; for fashion, it could be batch production. Be specific and ethical.

5.  **topPriorities**: Start with "🧭 Top Priorities". Output exactly five, clear, numbered action points. Each point should be a descriptive sentence (1-2 lines). CRITICAL: Add two <br> tags after each priority to create visual spacing.

Example for 'topPriorities':
"🧭 Top Priorities<br><br>1. Audit and reduce your fixed costs — especially 'Steine' and monthly fees. Renegotiating just 1–2 of them could save **€300+**.<br><br>2. Lower your unit cost on 'Goldring 2' by sourcing stones with a better €/ct ratio."
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

    return output;
  }
);
