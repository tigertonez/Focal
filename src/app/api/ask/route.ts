
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EngineInputSchema, EngineOutputSchema, MessageSchema } from '@/lib/types';


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


const ApiSchema = CopilotSchema; // Simplified to a single schema for now

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { action } = validation.data;

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

  } catch (error: any) {
    console.error('Error in /api/ask:', error);
    // Return a simple error structure that the client can easily handle.
    return NextResponse.json(
        { error: error.message || 'An unknown error occurred on the server.' }, 
        { status: 500 }
    );
  }
}
