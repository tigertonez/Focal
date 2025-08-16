
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PageSizes } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostBody = {
  mode?: 'probe' | 'pdf' | 'blank';
  imageBase64?: string;
  format?: 'png' | 'jpg' | 'jpeg';
  width?: number;
  height?: number;
  page?: 'auto' | 'A4' | 'Letter';
  fit?: 'auto' | 'contain' | 'cover';
  margin?: number;
  title?: string;
};

// Helper to safely construct a JSON response
const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export async function GET() {
  return json({ ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' }, 405);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    const {
      mode = 'pdf',
      imageBase64 = '',
      format = 'png',
      width: imgW = 0,
      height: imgH = 0,
      page: pageSize = 'auto',
      fit = 'auto',
      margin = 24,
      title = 'ForecastReport',
    } = body;
    
    const wantsJson = (req.headers.get('accept') || '').includes('application/json') || mode === 'probe';

    // --- Diagnostic "blank" probe ---
    if (mode === 'blank') {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([200, 100]).drawText('Blank PDF OK', { x: 20, y: 50 });
      const pdfBytes = await pdfDoc.save();
      if (wantsJson) return json({ ok: true, phase: 'POST_OK_BLANK', pdfBytes: pdfBytes.length });
      return new NextResponse(Buffer.from(pdfBytes), { headers: { 'Content-Type': 'application/pdf' } });
    }

    // --- Validation for image-based PDF ---
    if (!imageBase64) return json({ ok: false, code: 'BAD_INPUT', message: 'imageBase64 is required.' }, 400);

    const fmtIn = format.toLowerCase();
    const fmt = fmtIn === 'jpeg' ? 'jpg' : fmtIn;
    if (fmt !== 'png' && fmt !== 'jpg') return json({ ok: false, code: 'BAD_FORMAT', message: `Unsupported format: ${fmt}` }, 400);

    const bytes = Buffer.from(imageBase64, 'base64');
    if (bytes.length === 0) return json({ ok: false, code: 'BAD_INPUT', message: 'Decoded image buffer is empty.' }, 400);

    // --- PDF Creation ---
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(title, { showInWindowTitleBar: true });
    
    const img = await (fmt === 'png' ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes));

    let page;
    let pageWidth, pageHeight;
    const pageMargin = Math.max(0, margin);

    if (pageSize === 'A4' || pageSize === 'Letter') {
      const dims = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
      pageWidth = dims[0];
      pageHeight = dims[1];
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      const frameW = pageWidth - pageMargin * 2;
      const frameH = pageHeight - pageMargin * 2;
      const aspectImg = img.width / img.height;
      const aspectFrame = frameW / frameH;
      
      let drawW, drawH;
      let effectiveFit = fit;
      if (fit === 'auto') {
        effectiveFit = (img.width > frameW || img.height > frameH) ? 'contain' : 'cover';
      }

      if (effectiveFit === 'cover') { // Fit to fill frame
        drawW = frameW;
        drawH = frameW / aspectImg;
        if (drawH < frameH) {
            drawH = frameH;
            drawW = frameH * aspectImg;
        }
      } else { // 'contain'
        drawH = frameH;
        drawW = frameH * aspectImg;
        if (drawW > frameW) {
            drawW = frameW;
            drawH = frameW / aspectImg;
        }
      }
      
      page.drawImage(img, {
        x: (pageWidth - drawW) / 2,
        y: (pageHeight - drawH) / 2,
        width: drawW,
        height: drawH,
      });

    } else { // 'auto' page size
      pageWidth = img.width + pageMargin * 2;
      pageHeight = img.height + pageMargin * 2;
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(img, { x: pageMargin, y: pageMargin });
    }

    const pdfBytes = await pdfDoc.save();

    if (wantsJson) {
      return json({ ok: true, phase: 'POST_OK', format: fmt, inputBytes: bytes.length, pdfBytes: pdfBytes.length, width: imgW, height: imgH, page: pageSize, fit, margin: pageMargin, title });
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('[PDF_API_ERROR]', err);
    return json({
        ok: false,
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'An unexpected server error occurred.',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    }, 500);
  }
}
