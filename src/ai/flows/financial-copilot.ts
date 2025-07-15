
'use server';

/**
 * @fileOverview A financial copilot that uses vision to analyze the application state.
 *
 * - financialCopilot - A function that takes a screenshot and a question to provide assistance.
 * - FinancialCopilotInput - The input type for the financialCopilot function.
 * - FinancialCopilotOutput - The return type for the financialCopilot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

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
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are a lean and fast UI/UX and logic assistant helping a developer build a financial forecasting tool. Your goal is to provide quick, actionable advice.

IMPORTANT: Your response must be concise and in plain text. Do NOT use any markdown. Use simple paragraphs.

When the developer asks for help (e.g., "find issues", "review this"), analyze the screenshot for:

1.  **Logical Gaps**: Does the data make sense from a developer's perspective? Is required data missing? Are there logical conflicts in the settings (e.g., pre-order mode is on, but costs are misaligned)?

2.  **UI/UX Friction**: Is the interface confusing? Are labels unclear? Suggest simpler layouts, better component choices, or clearer descriptions that would improve the developer and end-user experience.

3.  **Clarity and Simplicity**: Is the information presented clearly? Could a chart be simplified? Could a label be more direct?

Always be constructive and provide direct, actionable feedback for the developer building the app.

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
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid response. Please try rephrasing your question.");
    }
    return output;
  }
);
