
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// Force Node runtime (pdf-lib uses Buffer). This is allowed because the file is not a "use server" module.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostBody = {
  mode?: 'blank' | 'image' | 'probe';
  imageBase64?: string;           // raw base64, no "data:image/...;base64," prefix
  format?: 'png' | 'jpg' | 'jpeg';
  title?: string;
};

function wantsJSON(req: NextRequest) {
  const accept = req.headers.get('accept') || '';
  const url = new URL(req.url);
  return accept.includes('application/json') || url.searchParams.get('debug') === '1';
}

export async function GET() {
  return NextResponse.json(
    { ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    // Diagnostic "blank" probe: proves pdf-lib works on the server.
    if (body.mode === 'blank') {
      const pdf = await PDFDocument.create();
      pdf.addPage([595, 842]); // A4 portrait
      const bytes = await pdf.save();
      if (wantsJSON(req)) return NextResponse.json({ ok: true, phase: 'POST_OK_BLANK', pdfBytes: bytes.length });
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="ForecastReport.pdf"',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Default: embed a screenshot image
    const base64 = (body.imageBase64 || '').trim();
    if (!base64) {
      return NextResponse.json({ ok: false, code: 'BAD_BODY', message: 'imageBase64 missing' }, { status: 400 });
    }

    const fmt = (body.format || 'png').toLowerCase();
    const imgBytes = Buffer.from(base64, 'base64');

    const pdf = await PDFDocument.create();
    const img =
      fmt === 'png' ? await pdf.embedPng(imgBytes) : await pdf.embedJpg(imgBytes);
    const { width, height } = img.size();

    // Page sized exactly to the image; ensures crisp output
    const page = pdf.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });

    const bytes = await pdf.save();

    if (wantsJSON(req)) {
      return NextResponse.json({
        ok: true,
        phase: 'POST_OK',
        format: fmt,
        inputBytes: imgBytes.length,
        pdfBytes: bytes.length,
        width,
        height,
      });
    }

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ForecastReport-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        code: 'EMBED_FAILED',
        error: { name: err?.name || 'Error', message: err?.message || String(err) },
      },
      { status: 500 }
    );
  }
}
