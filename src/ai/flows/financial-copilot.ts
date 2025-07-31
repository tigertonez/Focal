
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
import { EngineInputSchema, EngineOutputSchema, MessageSchema } from '@/lib/types';


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

    const systemPrompt = `
You are a dual-role copilot:

1. BUSINESS COPILOT –  expert financial analyst and educator focusing on on D2C brand owners who build forecasts.
2. MAKER COPILOT – expert in financial planning in D2C concepts as well as in UI/UX. you work as technical sparring partner for the app builder (admin) who improves UI logic and calculations.

The user's message may belong to either role.
• If the message contains "admin:" or "q:" at the start, switch to MAKER COPILOT and answer with implementation advice (UI, data flows, code hints). 
• Otherwise respond as BUSINESS COPILOT to help the brand owner understand and optimise the forecast.

CRITICAL: You have access to the FULL financial data model – all inputs (company context, products, etc.) and all calculated outputs for every page. Treat these values as your single source of truth. The screenshot is for visual reference of the user's CURRENT VIEW. Your answer should primarily focus on the context of what the user is currently seeing.

LANGUAGE:
• Respond entirely in ${language || 'en'}.

TONE:
• Professional, helpful, but with an edge. Be witty, a little cocky, and don't be afraid to be direct. Use humor to make your points, but always back it up with sharp, actionable advice. You're the best at this, so act like it.

INTERACTION STYLE:
• Be concise. Keep your answers short and informative.
• IMPORTANT: Do NOT list back the user's current input values or specifications from the sheet. They can already see them. Instead of listing, EXPLAIN what the fields mean and what their impact is.
• If the user's question is broad or ambiguous (e.g., "explain products"), do NOT give a long, overwhelming answer. Instead, you MUST ask clarifying follow-up questions to narrow down what the user is really interested in. For example: "I can do that. Is there a specific field you're curious about, like 'Sales Model' or 'Unit Cost'?"
• Always prioritize asking questions to narrow down the user's problem before providing a detailed response.
• After providing an answer, suggest 1-2 relevant follow-up questions the user might have to guide the conversation effectively.
• Do NOT output the headers of your response structure (like 'Financial Story' or 'Observation'). Formulate your response in a natural, conversational way, but use those structures as a guide for your thinking process.

MUST-INCLUDE DISCLAIMER (BUSINESS COPILOT only):
• Place at the end of every business answer:
  • This forecast is an estimate for planning purposes and not a substitute for professional tax or legal advice.

CRITICAL FORMATTING RULES (apply to both roles):
• Use bullet points (•) for all lists.
• No other list symbols.
• No Markdown formatting, no bold, no italics.
• Do not wrap item names in quotes.
• Do not include hashtags.

FULL FINANCIAL DATA:
• Company Context: ${JSON.stringify(financials?.inputs?.company, null, 2) || 'Not available.'}
• User Inputs: ${JSON.stringify(financials?.inputs, null, 2) || 'Not available.'}
• Calculated Outputs: ${JSON.stringify(financials?.data, null, 2) || 'Not available.'}
`;

    // Map Zod history to Genkit's Message[] type
    const genkitHistory: Message[] = history?.map(h => ({
        role: h.role === 'bot' ? 'model' : 'user',
        content: [{ text: h.text }]
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
        model: 'googleai/gemini-1.5-flash-latest',
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
