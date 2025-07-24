
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
import { Message, Part } from 'genkit/content';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const FinancialCopilotInputSchema = z.object({
  screenshotDataUri: z.string().describe(
    "A screenshot of the application's current view, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
  language: z.string().optional(),
});
export type FinancialCopilotInput = z.infer<typeof FinancialCopilotInputSchema>;

const FinancialCopilotOutputSchema = z.object({
  answer: z.string().describe('The copilot\'s answer to the user\'s question.'),
});
export type FinancialCopilotOutput = z.infer<typeof FinancialCopilotOutputSchema>;

export async function financialCopilot(input: FinancialCopilotInput): Promise<FinancialCopilotOutput> {
  return financialCopilotFlow(input);
}

const financialCopilotFlow = ai.defineFlow(
  {
    name: 'financialCopilotFlow',
    inputSchema: FinancialCopilotInputSchema,
    outputSchema: FinancialCopilotOutputSchema,
  },
  async (input) => {
    // Correctly parse the input to ensure type safety
    const { screenshotDataUri, history, language } = FinancialCopilotInputSchema.parse(input);

    const systemPrompt = `You are an expert UI/UX and financial analyst acting as a copilot for a user building a business forecast.
Your role is to analyze the provided screenshot and answer the user's questions.
The user-specified language for the output is: ${language || 'en'}. You MUST generate your entire response in this language.

When the user asks for a review or to find issues, analyze the screenshot for:
1.  **UI/UX Issues**: Point out confusing layouts, unclear labels, or inconsistent design.
2.  **Financial Logic**: Identify potential mathematical errors, logical inconsistencies (e.g., costs exceeding revenue without explanation), or missing data points that a financial analyst would question.
3.  **Clarity**: Assess if the information is presented clearly and is easy to understand.

CRITICAL FORMATTING RULES:
- When you reference a specific user-entered item name (like a product 'Goldring 2' or a cost 'Salaries'), you MUST wrap it in single quotes, like 'this'.
- Use bullet points (•) for all lists. Do NOT use any other symbols like '*' or '#'.

Your tone is professional, helpful, and direct. Base your answers *only* on what is visible in the screenshot and the conversation history. Do not speculate. If you see no issues, state that clearly.`;

    // Map Zod history to Genkit's Message[] type
    const genkitHistory: Message[] = history?.map(h => ({
        role: h.role,
        content: h.content.map(c => ({ text: c.text }))
    })) || [];
    
    // The last message in the history is the current user question.
    const lastUserMessage = genkitHistory.pop();
    if (!lastUserMessage || !lastUserMessage.content[0].text) {
        throw new Error("Invalid user message in history.");
    }

    const prompt: Part[] = [
        ...lastUserMessage.content,
        { media: { url: screenshotDataUri } },
    ];
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-pro-latest',
        system: systemPrompt,
        history: genkitHistory,
        prompt: prompt,
        output: {
            schema: FinancialCopilotOutputSchema,
        },
    });

    if (!output) {
        throw new Error("The AI model did not return a valid response. Please try rephrasing your question.");
    }

    return output;
  }
);
