
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { calculateFinancials } from '@/lib/engine/financial-engine';
import { EngineInputSchema } from '@/lib/types';
import { ReportDocument } from '@/lib/pdf/ReportDocument';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = EngineInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.flatten() }, { status: 400 });
    }

    const inputs = validation.data;
    
    // Recalculate to ensure fresh data
    const data = calculateFinancials(inputs);

    const stream = await renderToStream(<ReportDocument inputs={inputs} data={data} />);

    const date = new Date().toISOString().split('T')[0];
    const filename = `forecast-report-${date}.pdf`;

    return new NextResponse(stream as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate report', details: errorMessage }, { status: 500 });
  }
}
