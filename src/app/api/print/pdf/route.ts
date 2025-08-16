
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PageSizes } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- Type Definitions ---
type ImagePart = {
  imageBase64: string;
  format: 'png' | 'jpg' | 'jpeg';
  width: number;
  height: number;
  name?: string;
};

type SinglePayload = {
  images?: never; // Ensure 'images' is not present
  imageBase64: string;
} & Omit<ImagePart, 'imageBase64'>;

type MultiPayload = {
  images: ImagePart[];
  imageBase64?: never; // Ensure 'imageBase64' is not present
};

type SharedPayload = {
  page?: 'auto' | 'A4' | 'Letter';
  fit?: 'contain' | 'cover' | 'auto';
  margin?: number;
  title?: string;
  mode?: 'probe' | 'pdf' | 'blank';
};

type PostBody = (SinglePayload | MultiPayload) & SharedPayload;


// --- Helper Functions ---
const json = (data: any, status = 200) => new NextResponse(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

// --- Route Handlers ---
export async function GET() {
  return json({ ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' }, 405);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    const wantsJson = (req.headers.get('accept') || '').includes('application/json') || body.mode === 'probe';

    // Diagnostic "blank" probe
    if (body.mode === 'blank') {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([200, 100]).drawText('Blank PDF OK', { x: 20, y: 50 });
      const pdfBytes = await pdfDoc.save();
      if (wantsJson) return json({ ok: true, phase: 'POST_OK_BLANK', pdfBytes: pdfBytes.length });
      return new NextResponse(Buffer.from(pdfBytes), { headers: { 'Content-Type': 'application/pdf' } });
    }

    const isMulti = Array.isArray(body.images);
    const imagesToProcess: ImagePart[] = isMulti ? body.images : [body as SinglePayload];
    const skipped: { name?: string; reason: string }[] = [];

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(body.title || 'ForecastReport', { showInWindowTitleBar: true });

    for (const imagePart of imagesToProcess) {
      if (!imagePart.imageBase64 || imagePart.imageBase64.length < 10) {
        skipped.push({ name: imagePart.name, reason: 'Missing or empty imageBase64' });
        continue;
      }
      try {
        const imgBytes = Buffer.from(imagePart.imageBase64, 'base64');
        const img = imagePart.format === 'png'
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const pagePrefs = {
          page: body.page || 'auto',
          fit: body.fit || 'auto',
          margin: body.margin ?? 24,
        };
        
        let pageWidth: number, pageHeight: number;
        if (pagePrefs.page === 'A4' || pagePrefs.page === 'Letter') {
            const dims = pagePrefs.page === 'A4' ? PageSizes.A4 : PageSizes.Letter;
            pageWidth = dims[0];
            pageHeight = dims[1];
        } else { // 'auto'
            pageWidth = img.width + pagePrefs.margin * 2;
            pageHeight = img.height + pagePrefs.margin * 2;
        }
        
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const frameW = pageWidth - pagePrefs.margin * 2;
        const frameH = pageHeight - pagePrefs.margin * 2;
        
        let fit = pagePrefs.fit;
        if (fit === 'auto') {
          fit = (img.width > frameW || img.height > frameH) ? 'contain' : 'cover';
        }

        const scaleContain = Math.min(frameW / img.width, frameH / img.height);
        const scaleCover = Math.max(frameW / img.width, frameH / img.height);
        const s = fit === 'cover' ? scaleCover : scaleContain;

        const drawW = img.width * s;
        const drawH = img.height * s;
        
        page.drawImage(img, {
          x: pagePrefs.margin + (frameW - drawW) / 2,
          y: pagePrefs.margin + (frameH - drawH) / 2,
          width: drawW,
          height: drawH,
        });

      } catch (err: any) {
        skipped.push({ name: imagePart.name, reason: err.message || 'Embedding failed' });
      }
    }

    const pdfBytes = await pdfDoc.save();

    if (wantsJson) {
      const probeResponse: any = { ok: true, phase: 'POST_OK', pdfBytes: pdfBytes.length, pages: pdfDoc.getPageCount(), skipped };
      if (isMulti) {
        probeResponse.pageSizes = pdfDoc.getPages().map(p => p.getSize());
      } else if (imagesToProcess.length > 0) {
        probeResponse.format = imagesToProcess[0].format;
        probeResponse.width = imagesToProcess[0].width;
        probeResponse.height = imagesToProcess[0].height;
      }
      return json(probeResponse);
    }
    
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
