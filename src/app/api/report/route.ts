
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { buildPdfStream } from '@/lib/pdf/buildPdfStream';
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';
import { checkRateLimit } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // TODO: Implement full rate limiting logic
  const ip = req.ip ?? '127.0.0.1';
  if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const body = await req.json();

    // 1. Validate request payload against Zod schemas
    const parsedInputs = EngineInputSchema.safeParse(body.inputs);
    const parsedData = EngineOutputSchema.safeParse(body.data);

    if (!parsedInputs.success || !parsedData.success) {
      return NextResponse.json({ 
        error: 'Invalid data provided for PDF generation.',
        details: {
            inputs: !parsedInputs.success ? parsedInputs.error.flatten() : undefined,
            data: !parsedData.success ? parsedData.error.flatten() : undefined,
        }
      }, { status: 400 });
    }

    // 2. Generate the PDF stream (logic is in the .tsx helper)
    const stream = await buildPdfStream({
      inputs: parsedInputs.data,
      data: parsedData.data,
    });

    // 3. Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream as Readable) {
        chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    
    // 4. Send the response
    const filename = `forecast-${new Date().toISOString().split('T')[0]}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error('PDF route error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF.', details: err.message },
      { status: 500 }
    );
  }
}
