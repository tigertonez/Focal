
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFinancialData } from '@/ai/flows/analyze-financial-data';
import { financialCopilot } from '@/ai/flows/financial-copilot';
import { z } from 'zod';

// Define schemas for different API actions
const AnalyzeDataSchema = z.object({
  action: z.literal('analyze'),
  financialData: z.any(),
  question: z.string(),
});

const CopilotSchema = z.object({
  action: z.literal('copilot'),
  question: z.string(),
  screenshotDataUri: z.string(),
});

// Union schema to validate against any of the actions
const ApiSchema = z.union([AnalyzeDataSchema, CopilotSchema]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { action } = validation.data;

    if (action === 'analyze') {
      const { financialData, question } = validation.data;
      const result = await analyzeFinancialData({
        financialData: JSON.stringify(financialData, null, 2),
        question,
      });
      return NextResponse.json(result);
    }

    if (action === 'copilot') {
        const { question, screenshotDataUri } = validation.data;
        const result = await financialCopilot({
          question: question,
          screenshotDataUri: screenshotDataUri,
        });
        return NextResponse.json(result);
    }

    // This part should not be reachable if the schema is correct
    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error) {
    console.error('Error in /api/ask:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process your question.', details: errorMessage }, { status: 500 });
  }
}
