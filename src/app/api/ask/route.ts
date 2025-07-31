
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EngineInputSchema, EngineOutputSchema, MessageSchema } from '@/lib/types';


const AnalyzeDataSchema = z.object({
  action: z.literal('analyze'),
  financialData: z.any(),
  question: z.string(),
});

const CopilotSchema = z.object({
  action: z.literal('copilot'),
  history: z.array(MessageSchema),
  screenshotDataUri: z.string(),
  language: z.string().optional(),
  financials: z.object({
      inputs: EngineInputSchema,
      data: EngineOutputSchema,
  }),
});


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
      // Dynamically import the flow to avoid issues on server start
      const { analyzeFinancialData } = await import('@/ai/flows/analyze-financial-data');
      const result = await analyzeFinancialData({
        financialData: JSON.stringify(financialData, null, 2),
        question,
      });
      return NextResponse.json(result);
    }

    if (action === 'copilot') {
        const { history, screenshotDataUri, language, financials } = validation.data;
        // Dynamically import the flow to avoid issues on server start
        const { financialCopilot } = await import('@/ai/flows/financial-copilot');
        const result = await financialCopilot({
          history: history,
          screenshotDataUri: screenshotDataUri,
          language: language,
          financials: financials,
        });
        return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error) {
    console.error('Error in /api/ask:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process your request.', details: errorMessage }, { status: 500 });
  }
}
