
'use server';

/**
 * @fileOverview A Genkit flow to provide strategic analysis of a business health score.
 *
 * - strategizeHealthScore - A function that takes health score data and financial summaries
 *   to generate strategic advice.
 */

import { ai } from '@/ai/genkit';
import { 
    type StrategizeHealthScoreInput, 
    StrategizeHealthScoreInputSchema,
    type StrategizeHealthScoreOutput,
    StrategizeHealthScoreOutputSchema
} from '@/lib/types';


export async function strategizeHealthScore(input: StrategizeHealthScoreInput): Promise<StrategizeHealthScoreOutput> {
  return strategizeHealthScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategizeHealthScorePrompt',
  input: { schema: StrategizeHealthScoreInputSchema },
  output: { schema: StrategizeHealthScoreOutputSchema },
   config: {
    maxOutputTokens: 512,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an expert financial strategist and business consultant. Your tone is professional, insightful, and clear.
You are advising a business owner on their financial forecast.

Analyze the following Business Health Score and financial summaries.
- Business Health Score: {{{json businessHealth}}}
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}

Your output MUST be ONLY a JSON object with 4 keys: "summary", "strengths", "opportunities", and "risks".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list items in "strengths", "opportunities", and "risks".
- Do NOT use asterisks (*) or any other form of bolding.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this'.
- Each bullet point should be a concise, single sentence.

Here is the structure you MUST follow:

1.  **summary**: Write a one-sentence summary that captures the essence of the overall health score. (e.g., "The plan shows strong profitability but is constrained by a tight cash flow.")

2.  **strengths**: Identify the 2-3 KPIs with the highest scores from the 'businessHealth.kpis' array. For each, describe what it means in a bullet point.
    Example: "• The high 'Net Margin' score indicates strong pricing and cost control, which is a key strength."

3.  **opportunities**: Identify the 2-3 KPIs with the lowest scores from the 'businessHealth.kpis' array. For each, suggest a specific, actionable strategy to improve it in a bullet point.
    Example: "• Address the low 'Cash Runway' score by exploring options to increase initial funding or reduce early-stage costs."

4.  **risks**: Based on the health score and financial data, identify the top 2 most significant risks this business plan faces in a bulleted list.
    Example: "• A high dependency on the 'Goldring' product line presents a concentration risk if market demand shifts."
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
    
    // Cleanup to remove the bullet points if the AI includes them
    const cleanList = (list: string[]) => list.map(item => item.startsWith('• ') ? item.substring(2) : item);
    output.strengths = cleanList(output.strengths);
    output.opportunities = cleanList(output.opportunities);
    output.risks = cleanList(output.risks);

    return output;
  }
);
