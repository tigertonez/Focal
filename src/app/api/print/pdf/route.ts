// src/app/api/print/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PageSizes } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MultiPayload = {
  images: { imageBase64: string; wPx?: number; hPx?: number; routeName?: string; pageIndex?: number; md5?: string }[];
  page: 'A4' | 'Letter';
  dpi: number;
  marginPt: number;
  title?: string;
  clientDiag?: any; // <-- NEW
};
type SinglePayload = {
  imageBase64: string; width: number; height: number;
  page?: 'auto' | 'A4' | 'Letter'; fit?: 'contain' | 'cover' | 'auto';
  marginPt?: number; dpi?: number; title?: string; clientDiag?: any;
};
type PostBody = (SinglePayload | MultiPayload) & { mode?: 'probe' | 'pdf' };

const json = (data: any, status = 200) =>
  new NextResponse(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

function decodeImageBase64(input: string): { bytes: Uint8Array; type: 'png' | 'jpg' } {
  const m = input.match(/^data:image\/(png|jpeg);base64,(.*)$/i);
  const b64 = m ? m[2] : input.trim();
  const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isJpg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  return { bytes, type: isPng ? 'png' : isJpg ? 'jpg' : 'png' };
}

export async function GET() {
  return json({ ok:false, code:'GET_DISABLED', message:'Use POST.' }, 405);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    const wantsJson = (req.headers.get('accept') || '').includes('application/json') || body.mode === 'probe';

    const pdf = await PDFDocument.create();
    pdf.setTitle(body.title || 'ForecastReport', { showInWindowTitleBar: true });

    const isMulti = 'images' in body && Array.isArray((body as any).images);
    const routesSeen = new Map<string, number>();
    const skipped: { index: number; reason: string }[] = [];

    if (isMulti) {
      const { images: rawImages, page, marginPt } = body as MultiPayload;
      const pagePt = page === 'Letter' ? { w: 612, h: 792 } : { w: 595.28, h: 841.89 };
      const images = rawImages
        .map((it:any)=> typeof it === 'string' ? { imageBase64: it } : it)
        .filter((it:any)=> it?.imageBase64 && it.imageBase64.length > 500);

      const diagnostics = images.map((s:any,i:number)=>({
        idx: i, kb: Math.round(s.imageBase64.length*3/4/1024),
        w: s.wPx, h: s.hPx, md5: s.md5, route: s.routeName
      }));

      images.forEach(s => routesSeen.set(s.routeName||'?', (routesSeen.get(s.routeName||'?')||0)+1));

      for (const [i,slice] of images.entries()) {
        try {
          const { bytes, type } = decodeImageBase64(slice.imageBase64);
          const img = type === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const frameW = pagePt.w - marginPt*2;
          const scale = frameW / img.width;
          const drawH = img.height * scale;
          const pageObj = pdf.addPage([pagePt.w, pagePt.h]);
          pageObj.drawImage(img, { x: marginPt, y: pagePt.h - marginPt - drawH, width: frameW, height: drawH });
        } catch (e:any) {
          skipped.push({ index: i, reason: e.message || 'embed failed' });
        }
      }

      if (wantsJson) {
        return json({
          ok: true, phase: 'POST_OK_MULTI',
          pages: pdf.getPageCount(),
          slices: images.length,
          routesSeen: Object.fromEntries(routesSeen.entries()),
          skipped,
          diagnostics,
          clientDiag: (body as any).clientDiag ?? null
        });
      }
    } else {
      const { imageBase64, marginPt = 36, dpi = 150, page = 'auto', fit = 'auto', clientDiag } = body as SinglePayload;
      if (!imageBase64) return json({ ok:false, message:'imageBase64 missing' }, 400);

      const { bytes, type } = decodeImageBase64(imageBase64);
      const img = type === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const dims = page === 'A4' ? PageSizes.A4 : page === 'Letter' ? PageSizes.Letter : [img.width * 72/dpi + 2*marginPt, img.height*72/dpi + 2*marginPt];
      const pageObj = pdf.addPage([dims[0], dims[1]]);
      const frameW = dims[0] - marginPt*2, frameH = dims[1] - marginPt*2;
      const sContain = Math.min(frameW / img.width, frameH / img.height);
      const sCover = Math.max(frameW / img.width, frameH / img.height);
      const s = (fit === 'cover') ? sCover : sContain;
      const w = img.width*s, h = img.height*s;
      pageObj.drawImage(img, { x: marginPt+(frameW-w)/2, y: marginPt+(frameH-h)/2, width:w, height:h });

      if (wantsJson) {
        return json({ ok:true, phase:'POST_OK', pages: pdf.getPageCount(), clientDiag: clientDiag ?? null });
      }
    }

    const bytes = await pdf.save();
    if (pdf.getPageCount() === 0) return json({ ok:false, code:'NO_PAGES_GENERATED' }, 500);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: { 'Content-Type':'application/pdf', 'Content-Disposition': `attachment; filename="${(body as any).title || 'ForecastReport'}-${Date.now()}.pdf"` }
    });
  } catch (err:any) {
    return json({ ok:false, code: err.code || 'UNKNOWN', message: err.message || 'Server error' }, 500);
  }
}
