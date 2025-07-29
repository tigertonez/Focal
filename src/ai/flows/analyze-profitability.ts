
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
  model: 'googleai/gemini-1.5-pro-latest',
  config: {
    maxOutputTokens: 1024,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an expert financial analyst AI writing a growth report for an early-stage founder with limited financial background. Your tone must be clear, educational, and confidence-building. Your mission is to help them understand their numbers and know what to do next.
The user-specified language for the output is: {{{language}}}. You MUST generate your entire response in this language.

You will receive a JSON payload containing the user's forecast data. Use the company context to tailor your advice.
- Company Context: {{{json companyContext}}}
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}
- Currency: {{{currency}}}

Infer the business type from product names and the 'industry' field.

Your output MUST be ONLY a JSON object with the following 5 keys: "explanation", "whatsWorking", "issues", "opportunities", "topPriorities".

CRITICAL FORMATTING RULES:
- When you output a specific calculated KPI value (like a monetary amount or a percentage), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold any other text, especially not descriptive sentences, labels, or parts of sentences.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), you MUST wrap it in single quotes, like 'this'. Do NOT bold these names.
- Use bullet points (•) for all list-based sections ('whatsWorking', 'issues', 'opportunities', 'explanation').
- Do NOT use numbered lists, except for 'topPriorities'.

---
Here is the structure you MUST follow for each key:

1.  **explanation**: Explain Gross, Operating, and Net Profit. For each, use a bullet point to define it, show the user's value (which MUST be bolded), and explain what it means for their business in simple terms.

2.  **whatsWorking**: Find at least one positive aspect of the financial plan, even if the overall picture is negative. This could be a healthy gross margin on a specific product, or the fact that revenue is being generated. If there are no clear strengths, you MUST output the single sentence "The current plan shows areas for improvement across the board."

3.  **issues**: Diagnose 1-2 key weak points in plain language using bullet points. Go beyond the numbers on the screen. For example, if operating profit is negative, calculate the operating loss per €100 of revenue to make it more tangible. Always tie issues back to the specific numbers that prove it.

4.  **opportunities**: Give 2-3 data-driven, tactical suggestions as bullet points based on the business type and company context (e.g., suggest exploring different 'production' models if cash flow is tight). These should be concrete actions like "Explore cost-saving opportunities for materials like 'Steine'..." or "Consider a price adjustment for the 'Goldring' product line...".

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
      return str.trim();
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
