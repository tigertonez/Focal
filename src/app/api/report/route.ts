import { NextRequest, NextResponse } from 'next/server';
import { buildPdfBuffer } from '@/lib/pdf/buildPdfBuffer';

export async function POST(_req: NextRequest) {
  try {
    const buffer = await buildPdfBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="stub.pdf"',
      },
    });
  } catch (err) {
    console.error('PDF stub error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF stub.' },
      { status: 500 }
    );
  }
}
