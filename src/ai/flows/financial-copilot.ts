
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
    const { screenshotDataUri, history } = FinancialCopilotInputSchema.parse(input);

    const systemPrompt = `You are a lean and fast UI/UX and logic assistant helping a developer build a financial forecasting tool. Your goal is to provide quick, scannable, and actionable advice based *only* on what you see in the screenshot and the conversation history.

IMPORTANT:
- Your response must be concise. Use plain text, bullet points, or numbered lists. Do NOT use markdown.
- Do NOT speculate or infer information that isn't present in the screenshot. Base your answer strictly on the visual evidence.
- If you don't see any issues or cannot answer the question from the image, say so directly. For example: "Based on the screenshot, I don't see any immediate issues."
- Remember the previous conversation to provide context-aware suggestions.

When the developer asks for help (e.g., "find issues", "review this"), analyze the screenshot for:

1.  **Logical Gaps**: Does the data make sense from a developer's perspective? Is required data missing? Are there logical conflicts?
2.  **UI/UX Friction**: Is the interface confusing? Are labels unclear? Suggest simpler layouts or clearer descriptions.
3.  **Clarity and Simplicity**: Is the information presented clearly?

Always be constructive and provide direct, actionable feedback for the developer.`;

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
        model: googleAI.model('gemini-1.5-flash-latest'),
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
    
    const answer = output.answer.toLowerCase();
    if (answer.includes("no issues") || answer.includes("looks good") || answer.includes("i don't see")) {
      return { answer: "I've reviewed the screen and couldn't spot any immediate issues. Everything looks to be in order based on your inputs." };
    }

    return output;
  }
);
