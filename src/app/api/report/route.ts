
import { NextRequest, NextResponse } from 'next/server';
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';
import { Readable } from 'stream';

// Placeholder: In a real scenario, this would be imported
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}


export async function POST(req: NextRequest) {
  // TODO: Add rate limiting
  
  try {
    const body = await req.json();

    // 1. Validate inputs & data
    const inputsResult = EngineInputSchema.safeParse(body.inputs);
    const dataResult = EngineOutputSchema.safeParse(body.data);

    if (!inputsResult.success || !dataResult.success) {
      console.error("PDF Payload Validation Error:", {
        inputs: !inputsResult.success ? inputsResult.error.flatten() : 'OK',
        data: !dataResult.success ? dataResult.error.flatten() : 'OK'
      });
      return NextResponse.json({ error: 'Invalid payload provided.' }, { status: 400 });
    }

    // 2. Dynamically import the server-side PDF builder
    const { buildPdfStream } = await import('@/lib/pdf/buildPdfStream');

    // 3. Generate the PDF stream
    const pdfStream = await buildPdfStream({
      inputs: inputsResult.data,
      data: dataResult.data,
    });

    // 4. Buffer the stream to avoid partial responses
    const pdfBuffer = await streamToBuffer(pdfStream);

    // 5. Create the response
    const today = new Date().toISOString().split('T')[0];
    const filename = `forecast-${today}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { error: 'PDF generation failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
