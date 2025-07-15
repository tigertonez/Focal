
'use server';

/**
 * @fileOverview A financial copilot that uses vision to analyze the application state.
 *
 * - financialCopilot - A function that takes a screenshot and a question to provide assistance.
 * - FinancialCopilotInput - The input type for the financialCopilot function.
 * - FinancialCopilotOutput - The return type for the financialCopilot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialCopilotInputSchema = z.object({
  screenshotDataUri: z.string().describe(
    "A screenshot of the application's current view, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  question: z.string().describe('The user\'s question about the financial data or application state shown in the screenshot.'),
});
export type FinancialCopilotInput = z.infer<typeof FinancialCopilotInputSchema>;

const FinancialCopilotOutputSchema = z.object({
  answer: z.string().describe('The copilot\'s answer to the user\'s question.'),
});
export type FinancialCopilotOutput = z.infer<typeof FinancialCopilotOutputSchema>;

export async function financialCopilot(input: FinancialCopilotInput): Promise<FinancialCopilotOutput> {
  return financialCopilotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialCopilotPrompt',
  input: { schema: FinancialCopilotInputSchema },
  output: { schema: FinancialCopilotOutputSchema },
  prompt: `You are a world-class Financial and UI/UX Analyst Copilot.

Your primary goal is to help the user build a clear, logical, and robust financial forecast by analyzing the provided application screenshot and their question. You have deep expertise in financial modeling, UI/UX design, and identifying logical inconsistencies.

When the user asks for help, especially a general question like "find issues" or "review this", analyze the screenshot through the following lenses:

1.  **Financial Clarity & Sanity Check**:
    *   Do the numbers make logical sense together? (e.g., Is marketing spend zero but sales are high? Is the cost per unit higher than the sell price?)
    *   Are there any obvious calculation errors or numbers that seem out of place?
    *   Point out any assumptions that seem unrealistic or risky.

2.  **Dependency & Consistency Mistakes**:
    *   Look for inconsistencies between different sections of the UI.
    *   Identify if a change in one area should have impacted another but didn't (e.g., if "Pre-Order Mode" is on, are there costs in Month 0?).

3.  **UI/UX & Customer Journey Improvements**:
    *   Is the interface clear and intuitive? Are any labels or descriptions confusing?
    *   Suggest improvements to the layout or presentation of data that would make it easier for the user to understand their forecast.
    *   Identify any points of friction in the user's workflow.

Always be constructive, helpful, and clear in your analysis. Provide actionable advice.

Analyze the provided screenshot and answer the user's question based on this expert persona.

User Question: {{{question}}}
Screenshot: {{media url=screenshotDataUri}}`,
});

const financialCopilotFlow = ai.defineFlow(
  {
    name: 'financialCopilotFlow',
    inputSchema: FinancialCopilotInputSchema,
    outputSchema: FinancialCopilotOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid response. Please try rephrasing your question.");
    }
    return output;
  }
);
