
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
    const reportPayload = await req.json();

    if (!reportPayload) {
      return NextResponse.json({ error: 'No valid forecast found. Please run a new report.' }, { status: 400 });
    }

    const validation = ReportPayloadSchema.safeParse(reportPayload);

    if (!validation.success) {
      console.error('PDF-VALIDATION-FAIL', validation.error.flatten());
      return NextResponse.json({ error: 'Invalid data provided for report.', details: validation.error.flatten() }, { status: 422 });
    }
    
    const { inputs, data } = validation.data;

    if (!data.costSummary || !data.profitSummary) {
      return NextResponse.json({ error: 'Missing cost/profit data. Please re-run the forecast.' }, { status: 422 });
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
