
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
  model: 'googleai/gemini-1.5-flash-latest',
   config: {
    maxOutputTokens: 1024,
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
  prompt: `You are an expert financial strategist and business consultant. Your tone is professional, insightful, and clear.
You are advising a business owner on their financial forecast.
The user-specified language for the output is: {{{language}}}. You MUST generate your entire response in this language.

Analyze the following Business Health Score and financial summaries, using the Company Context to tailor your advice.
- Company Context: {{{json companyContext}}}
- Business Health Score: {{{json businessHealth}}}
- Revenue Summary: {{{json revenueSummary}}}
- Cost Summary: {{{json costSummary}}}
- Profit Summary: {{{json profitSummary}}}
- All Products: {{{json products}}}

Your output MUST be ONLY a JSON object with 4 keys: "summary", "strengths", "opportunities", and "risks".

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all list items in "strengths", "opportunities", and "risks".
- When you output a specific calculated KPI value (like a monetary amount or a percentage), you MUST make it bold using Markdown's double asterisks, like **this**. Do NOT bold any other text, especially not descriptive sentences, labels, or parts of sentences.
- When you reference a specific product or fixed cost name (e.g., 'Goldring 2' or 'Steine'), wrap it in single quotes, like 'this', so it can be color-coded. Do NOT bold these names.
- Each bullet point should be a concise, single sentence that explains the 'why' behind the number.

Here is the structure you MUST follow:

1.  **summary**: Write a one-sentence summary that captures the essence of the overall health score, mentioning the company stage if available. (e.g., "For a business at the 'launch' stage, the plan shows strong profitability potential with a score of **78/100**, but is constrained by a tight cash flow.")

2.  **strengths**: Identify the 2-3 KPIs with the highest scores from the 'businessHealth.kpis' array. For each, describe what it means in a bullet point, providing context based on the industry or business model.
    Example: "• The high 'Net Margin' score of **85/100** indicates strong pricing and cost control, a key strength for long-term profitability in the competitive 'fashion' industry."

3.  **opportunities**: Identify the 2-3 KPIs with the lowest scores from the 'businessHealth.kpis' array. For each, suggest a specific, actionable strategy to improve it in a bullet point. Be specific and reference the company context.
    Example: "• Address the low 'Cash Runway' score of **25/100** by exploring options to increase initial funding or, for a 'preorder' business, increasing the deposit percentage on products like 'Goldring'."

4.  **risks**: Based on the health score and financial data, identify the top 2 most significant risks this business plan faces in a bulleted list. Explain the implication.
    Example: "• A high dependency on the 'Goldring' product line, which accounts for **70%** of revenue, presents a concentration risk if market demand shifts."
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
    
    const cleanList = (list: string[]) => list.map(item => item.startsWith('• ') ? item.substring(2) : item);
    output.strengths = cleanList(output.strengths);
    output.opportunities = cleanList(output.opportunities);
    output.risks = cleanList(output.risks);

    return output;
  }
);
