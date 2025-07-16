'use server';

/**
 * @fileOverview A Genkit flow to provide strategic analysis of a business health score.
 *
 * - strategizeHealthScore - A function that takes health score data and financial summaries
 *   to generate strategic advice.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { BusinessHealthSchema, RevenueSummarySchema, CostSummarySchema, ProfitSummarySchema } from '@/lib/types';

export const StrategizeHealthScoreInputSchema = z.object({
  businessHealth: BusinessHealthSchema,
  revenueSummary: RevenueSummarySchema,
  costSummary: CostSummarySchema,
  profitSummary: ProfitSummarySchema,
});
export type StrategizeHealthScoreInput = z.infer<typeof StrategizeHealthScoreInputSchema>;

export const StrategizeHealthScoreOutputSchema = z.object({
  summary: z.string().describe("A concise, one-sentence summary of the business's overall financial health based on the score."),
  opportunities: z.array(z.string()).describe("A bulleted list of the top 2-3 strategic opportunities for improvement based on the lowest-scoring KPIs."),
  risks: z.array(z.string()).describe("A bulleted list of the top 2-3 risks the business faces, identified from the health score analysis."),
});
export type StrategizeHealthScoreOutput = z.infer<typeof StrategizeHealthScoreOutputSchema>;

export async function strategizeHealthScore(input: StrategizeHealthScoreInput): Promise<StrategizeHealthScoreOutput> {
  return strategizeHealthScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategizeHealthScorePrompt',
  input: { schema: StrategizeHealthScoreInputSchema },
  output: { schema: StrategizeHealthScoreOutputSchema },
  prompt: `You are an expert financial strategist and business consultant.
You are advising a business owner on their financial forecast.

Analyze the following Business Health Score and financial summaries.
- Business Health Score: {{{json businessHealth}}}
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

Your task is to provide a strategic analysis based *only* on the provided data. Do not invent numbers or scenarios.

1.  **Summary**: Write a one-sentence summary that captures the essence of the overall health score. (e.g., "The plan shows strong profitability but is constrained by a tight cash flow.")
2.  **Opportunities**: Identify the 2-3 KPIs with the lowest scores from the 'businessHealth.kpis' array. For each, suggest a specific, actionable strategy to improve it.
3.  **Risks**: Based on the health score and financial data, identify the 2-3 most significant risks this business plan faces.
`,
});

const strategizeHealthScoreFlow = ai.defineFlow(
  {
    name: 'strategizeHealthScoreFlow',
    inputSchema: StrategizeHealthScoreInputSchema,
    outputSchema: StrategizeHealthScoreOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid strategic analysis.");
    }
    return output;
  }
);
