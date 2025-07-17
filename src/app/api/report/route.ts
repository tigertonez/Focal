
import { NextRequest, NextResponse } from 'next/server';
import { buildPdfStream } from '@/lib/pdf/buildPdfStream';
import { Readable } from 'stream';

// Helper function to convert a Readable stream to a Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    const stream = await buildPdfStream();
    const buffer = await streamToBuffer(stream);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="stub.pdf"',
      },
    });
  } catch (err: any) {
    console.error('PDF stub error', err);
    return NextResponse.json({ error: 'Failed to generate PDF stub.' }, { status: 500 });
  }
}
