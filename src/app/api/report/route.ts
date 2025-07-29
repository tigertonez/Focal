
import { NextRequest, NextResponse } from 'next/server';
import { buildPdfBuffer } from '@/lib/pdf/buildPdfBuffer.server';
import { z } from 'zod';

const ReportPayloadSchema = z.object({
  imageDataUri: z.string().startsWith('data:image/'),
});

export async function POST(req: NextRequest) {
  try {
    const reportPayload = await req.json();

    const validation = ReportPayloadSchema.safeParse(reportPayload);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data provided for report.', details: validation.error.flatten() }, { status: 422 });
    }
    
    const { imageDataUri } = validation.data;

    const buf = await buildPdfBuffer({ imageDataUri });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ForecastReport-${Date.now()}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error('PDF-FAIL', e);
    return NextResponse.json({ error: 'Failed to generate PDF.', details: e.message, stack: e.stack }, { status: 500 });
  }
}
