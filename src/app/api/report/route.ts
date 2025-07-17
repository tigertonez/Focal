import { NextRequest, NextResponse } from 'next/server';
import { buildPdfBuffer } from '@/lib/pdf/buildPdfBuffer.server';

export async function POST(_: NextRequest) {
  try {
    const buf = await buildPdfBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="stub.pdf"',
      },
    });
  } catch (e) {
    console.error('PDF-FAIL', e);
    return NextResponse.json({ error: 'Failed to generate PDF.' }, { status: 500 });
  }
}
