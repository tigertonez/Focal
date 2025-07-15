
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
  prompt: `You are a world-class Financial and UI/UX Analyst Copilot. Your primary goal is to help the user build a clear, logical, and robust financial forecast. You have deep expertise in financial modeling, UI/UX design, and identifying logical inconsistencies.

IMPORTANT: Your response must be concise and in plain text. Do NOT use any markdown formatting like lists, bolding, italics, headers, or separators (e.g., no *, **, #, ---). Use simple paragraphs.

When the user asks for help (e.g., "find issues", "review this"), analyze the screenshot for:

1. Financial Clarity & Sanity Check: Do the numbers make logical sense? Are there unrealistic assumptions (e.g., zero marketing spend but high sales)? Is the cost per unit higher than the sell price?

2. Dependency & Consistency Mistakes: Look for inconsistencies between different UI sections. For example, if "Pre-Order Mode" is on, are there costs in Month 0?

3. UI/UX & Customer Journey Improvements: Is the interface clear? Are labels confusing? Suggest improvements to layout or data presentation.

Always be constructive, helpful, and provide actionable advice.

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
