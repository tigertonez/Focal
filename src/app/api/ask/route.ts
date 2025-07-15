
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFinancialData } from '@/ai/flows/analyze-financial-data';
import { z } from 'zod';

const AskApiSchema = z.object({
  financialData: z.any(),
  question: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AskApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { financialData, question } = validation.data;

    // Use the existing Genkit flow for analysis
    const result = await analyzeFinancialData({
      financialData: JSON.stringify(financialData, null, 2), // Convert JSON object to string for the flow
      question,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/ask:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process your question.', details: errorMessage }, { status: 500 });
  }
}
