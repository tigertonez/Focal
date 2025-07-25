
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFinancialData } from '@/ai/flows/analyze-financial-data';
import { financialCopilot } from '@/ai/flows/financial-copilot';
import { calculateFinancials } from '@/lib/engine/financial-engine';
import { z } from 'zod';
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';


const AnalyzeDataSchema = z.object({
  action: z.literal('analyze'),
  financialData: z.any(),
  question: z.string(),
});

const CopilotMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const CopilotSchema = z.object({
  action: z.literal('copilot'),
  history: z.array(CopilotMessageSchema),
  screenshotDataUri: z.string(),
  language: z.string().optional(),
  financials: z.object({
      inputs: EngineInputSchema,
      data: EngineOutputSchema,
  }),
});

const CalculateFinancialsSchema = z.object({
    action: z.literal('calculate-financials'),
    inputs: EngineInputSchema,
});


const ApiSchema = z.union([AnalyzeDataSchema, CopilotSchema, CalculateFinancialsSchema]);

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
        const { history, screenshotDataUri, language, financials } = validation.data;
        const result = await financialCopilot({
          history: history,
          screenshotDataUri: screenshotDataUri,
          language: language,
          financials: financials,
        });
        return NextResponse.json(result);
    }
    
    if (action === 'calculate-financials') {
        const { inputs } = validation.data;
        // The financial engine handles all calculations internally.
        // No pre-processing is needed here.
        const result = calculateFinancials(inputs);
        // Return the full result payload to the client
        return NextResponse.json({ data: result, inputs });
    }


    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error) {
    console.error('Error in /api/ask:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process your request.', details: errorMessage }, { status: 500 });
  }
}
