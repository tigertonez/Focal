'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing financial data and answering user questions about it.
 *
 * - analyzeFinancialData - A function that takes financial data and a question as input and returns an answer.
 * - AnalyzeFinancialDataInput - The input type for the analyzeFinancialData function.
 * - AnalyzeFinancialDataOutput - The return type for the analyzeFinancialData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFinancialDataInputSchema = z.object({
  financialData: z.string().describe('The financial data as a JSON string.'),
  question: z.string().describe('The question about the financial data.'),
});
export type AnalyzeFinancialDataInput = z.infer<typeof AnalyzeFinancialDataInputSchema>;

const AnalyzeFinancialDataOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the financial data.'),
});
export type AnalyzeFinancialDataOutput = z.infer<typeof AnalyzeFinancialDataOutputSchema>;

export async function analyzeFinancialData(input: AnalyzeFinancialDataInput): Promise<AnalyzeFinancialDataOutput> {
  return analyzeFinancialDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFinancialDataPrompt',
  input: {schema: AnalyzeFinancialDataInputSchema},
  output: {schema: AnalyzeFinancialDataOutputSchema},
  prompt: `You are a financial analyst. You are provided with financial data and a question.
Your task is to answer the question based on the financial data. Be concise and accurate.

Financial Data:
{{financialData}}

Question:
{{question}}

Answer:`, 
});

const analyzeFinancialDataFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialDataFlow',
    inputSchema: AnalyzeFinancialDataInputSchema,
    outputSchema: AnalyzeFinancialDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
