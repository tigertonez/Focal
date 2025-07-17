
import { NextRequest, NextResponse } from 'next/server';
import { buildPdfBuffer } from '@/lib/pdf/buildPdfBuffer.server';
import { z } from 'zod';
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';

const ReportPayloadSchema = z.object({
  inputs: EngineInputSchema,
  data: EngineOutputSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ReportPayloadSchema.safeParse(body);

    if (!validation.success) {
      console.error('PDF-VALIDATION-FAIL', validation.error.flatten());
      return NextResponse.json({ error: 'Invalid data provided for report.', details: validation.error.flatten() }, { status: 422 });
    }
    
    const { inputs, data } = validation.data;

    // Additional check for essential summary objects
    if (!data.costSummary || !data.profitSummary) {
      return NextResponse.json({ error: 'Missing cost/profit data' }, { status: 422 });
    }

    const buf = await buildPdfBuffer({ inputs, data });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ForecastReport.pdf"',
      },
    });
  } catch (e: any) {
    console.error('PDF-FAIL', e);
    console.error('STACK', e.stack);
    return NextResponse.json({ error: 'Failed to generate PDF.', stack: e.stack }, { status: 500 });
  }
}
