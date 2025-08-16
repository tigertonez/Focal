
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PageSizes } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- Type Definitions ---
type SinglePayload = {
  images?: never;
  imageBase64: string;
  format: 'png' | 'jpg' | 'jpeg';
  width: number;
  height: number;
  page?: 'auto' | 'A4' | 'Letter';
  fit?: 'contain' | 'cover' | 'auto';
  margin?: number; // Kept for legacy single-image calls
  marginPt?: number;
  dpi?: number;
  title?: string;
};

type MultiPayload = {
  images: { imageBase64: string; wPx: number; hPx: number; name?: string }[];
  imageBase64?: never;
  page: 'A4' | 'Letter';
  dpi: number;
  marginPt: number;
  title?: string;
};

type PostBody = (SinglePayload | MultiPayload) & { mode?: 'probe' | 'pdf' | 'blank' };


// --- Helper Functions ---
const json = (data: any, status = 200) => new NextResponse(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const pxToPt = (px: number, dpi = 150) => (px * 72) / dpi;

// --- Route Handlers ---
export async function GET() {
  return json({ ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    const wantsJson = (req.headers.get('accept') || '').includes('application/json') || body.mode === 'probe';

    if (body.mode === 'blank') {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([200, 100]).drawText('Blank PDF OK', { x: 20, y: 50 });
      const pdfBytes = await pdfDoc.save();
      if (wantsJson) return json({ ok: true, phase: 'POST_OK_BLANK', pdfBytes: pdfBytes.length });
      return new NextResponse(Buffer.from(pdfBytes), { headers: { 'Content-Type': 'application/pdf' } });
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(body.title || 'ForecastReport', { showInWindowTitleBar: true });

    const isMulti = 'images' in body && Array.isArray(body.images);
    const skipped: { name?: string; reason: string }[] = [];

    if (isMulti) {
      const { images, page, dpi, marginPt } = body as MultiPayload;
      const pageSizePt = page === 'Letter' ? { w: 612, h: 792 } : { w: 595.28, h: 841.89 }; // A4 default
      
      for (const slice of images) {
        try {
          const imgBytes = Buffer.from(slice.imageBase64, 'base64');
          const img = await pdfDoc.embedPng(imgBytes);
          const pdfPage = pdfDoc.addPage([pageSizePt.w, pageSizePt.h]);

          const contentWPt = pageSizePt.w - 2 * marginPt;
          const scale = contentWPt / img.width; // Scale by width only
          const drawHeight = img.height * scale;

          pdfPage.drawImage(img, {
            x: marginPt,
            y: pageSizePt.h - marginPt - drawHeight, // Position from top
            width: contentWPt,
            height: drawHeight,
          });
        } catch (err: any) {
          skipped.push({ name: slice.name, reason: err.message || 'Embedding failed' });
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (wantsJson) {
          return json({ ok: true, phase: 'POST_OK', pages: pdfDoc.getPageCount(), slices: images.length, pdfBytes: pdfBytes.length, page, dpi, marginPt, skipped });
      }

    } else { // Single Image
      const { imageBase64, format, width, height, page = 'auto', fit = 'auto', marginPt = 24, dpi = 150 } = body as SinglePayload;
      
      if (!imageBase64) return json({ ok: false, message: 'imageBase64 missing' }, { status: 400 });

      const imgBytes = Buffer.from(imageBase64, 'base64');
      const img = format === 'png' ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

      let pageWidth: number, pageHeight: number;
      if (page === 'auto') {
          pageWidth = pxToPt(img.width, dpi);
          pageHeight = pxToPt(img.height, dpi);
      } else {
          const dims = page === 'A4' ? PageSizes.A4 : PageSizes.Letter;
          pageWidth = dims[0]; pageHeight = dims[1];
      }
      
      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

      const frameW = pageWidth - marginPt * 2;
      const frameH = pageHeight - marginPt * 2;

      let effectiveFit = fit;
      if (fit === 'auto') {
        effectiveFit = (img.width > frameW || img.height > frameH) ? 'contain' : 'cover';
      }

      const scaleContain = Math.min(frameW / img.width, frameH / img.height);
      const scaleCover = Math.max(frameW / img.width, frameH / img.height);
      const s = effectiveFit === 'cover' ? scaleCover : scaleContain;

      const drawW = img.width * s;
      const drawH = img.height * s;
      
      pdfPage.drawImage(img, {
          x: marginPt + (frameW - drawW) / 2,
          y: marginPt + (frameH - drawH) / 2,
          width: drawW,
          height: drawH,
      });

       const pdfBytes = await pdfDoc.save();
       if (wantsJson) {
           return json({ ok: true, phase: 'POST_OK', format, inputBytes: imgBytes.length, pdfBytes: pdfBytes.length, width, height, page, fit, margin: marginPt });
       }
    }
    
    // Final PDF stream for both multi and single modes
    const pdfBytes = await pdfDoc.save();
    if (pdfDoc.getPageCount() === 0) {
        return json({ ok: false, code: 'NO_PAGES_GENERATED', message: 'Could not generate any PDF pages from the provided images.' }, 500);
    }
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(body.title || 'ForecastReport')}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (err: any) {
    return json({
        ok: false,
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'An unexpected server error occurred.',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    }, 500);
  }
}
