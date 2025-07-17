
import { NextRequest, NextResponse } from 'next/server';
import { buildPdfStream } from '@/lib/pdf/buildPdfStream';

export async function POST(req: NextRequest) {
  try {
    // For now, we don't need to read the body. Just generate the stub.
    const stream = await buildPdfStream();

    // The stream is directly piped to the response body.
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });
  } catch (err: any) {
    console.error('PDF stub error', err);
    return NextResponse.json({ error: 'Failed to generate PDF stub.' }, { status: 500 });
  }
}
