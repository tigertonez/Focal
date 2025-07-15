
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
  prompt: `You are a lean and fast UI/UX and logic assistant helping a developer build a financial forecasting tool. Your goal is to provide quick, actionable advice based *only* on what you see in the screenshot.

IMPORTANT:
- Your response must be concise and in plain text. Do NOT use any markdown.
- Do NOT speculate or infer information that isn't present in the screenshot.
- If you don't see any issues or cannot answer the question from the image, say so directly. For example: "Based on the screenshot, I don't see any immediate issues."

When the developer asks for help (e.g., "find issues", "review this"), analyze the screenshot for:

1.  **Logical Gaps**: Does the data make sense from a developer's perspective? Is required data missing? Are there logical conflicts?
2.  **UI/UX Friction**: Is the interface confusing? Are labels unclear? Suggest simpler layouts or clearer descriptions.
3.  **Clarity and Simplicity**: Is the information presented clearly?

Always be constructive and provide direct, actionable feedback for the developer.

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
    
    const answer = output.answer.toLowerCase();
    if (answer.includes("no issues") || answer.includes("looks good") || answer.includes("i don't see")) {
      return { answer: "I've reviewed the screen and couldn't spot any immediate issues. Everything looks to be in order based on your inputs." };
    }

    return output;
  }
);
