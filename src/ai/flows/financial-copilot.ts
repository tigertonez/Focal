
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
  prompt: `You are a helpful financial forecasting assistant. The user has provided a screenshot of the application and has a question.

Your task is to analyze the screenshot and the user's question to provide a helpful and accurate answer.
You can identify potential errors in calculation, suggest improvements, or explain what the data represents.

Analyze the provided screenshot and answer the user's question.

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
    return output!;
  }
);
