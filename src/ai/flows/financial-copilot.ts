
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
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';


const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const FinancialCopilotInputSchema = z.object({
  screenshotDataUri: z.string().describe(
    "A screenshot of the application's current view, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is for visual context ONLY."
  ),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
  language: z.string().optional(),
  financials: z.object({
      inputs: EngineInputSchema,
      data: EngineOutputSchema,
  }).describe("The complete financial data object, including all inputs (brand context, products, etc.) and calculated outputs. This should be treated as the primary source of truth."),
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
    const { screenshotDataUri, history, language, financials } = FinancialCopilotInputSchema.parse(input);

    const systemPrompt = `You are an expert UI/UX and financial analyst acting as a copilot for a user building a business forecast.
Your role is to analyze the provided data and answer the user's questions based on the full context provided.

CRITICAL: You have access to the FULL financial data model, including all inputs (company context, products, fixed costs, parameters) and calculated outputs for all pages. This is your PRIMARY source of truth.
The screenshot is for VISUAL CONTEXT ONLY (e.g., to comment on UI/UX). Do not extract numbers from the screenshot; use the structured data provided.
The user-specified language for the output is: ${language || 'en'}. You MUST generate your entire response in this language.

Use the provided company context to tailor your advice. For example:
- If 'teamSize' suggests salaries are missing, recommend adding a 'Salaries' fixed cost.
- Adjust the depth of your tips based on the company 'stage' (e.g., fundamentals for 'idea', optimization for 'scale').
- Use the 'industry' to provide relevant examples or benchmarks.

Your tone should be professional, helpful, and direct. When asked to review something, look for UI/UX issues, financial logic problems, or lack of clarity. If you see no issues, state that clearly.

CRITICAL FORMATTING RULES:
- Use bullet points (•) for all lists.
- Do NOT use any other symbols for lists like '*' or '#'.
- Do NOT use bold markdown formatting like **this**.
- When you reference a specific user-entered item name (like a product 'Goldring 2' or a cost 'Salaries'), you MUST wrap it in single quotes, like 'this'.

FULL FINANCIAL DATA:
- User Inputs: ${JSON.stringify(financials?.inputs, null, 2) || 'Not available.'}
- Calculated Outputs (Revenue, Costs, Profit, etc.): ${JSON.stringify(financials?.data, null, 2) || 'Not available.'}
`;

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
