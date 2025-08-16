
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Disables the GET endpoint for PDF generation as it is currently unreliable.
 * All PDF generation is handled by the POST fallback.
 */
export async function GET(request: Request) {
    return NextResponse.json(
        { ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' },
        { status: 405 }
    );
}


/**
 * Handles PDF generation by embedding a client-provided image into a PDF document
 * or by generating a blank, text-only PDF for diagnostic purposes.
 * This method does not require a headless browser.
 */
export async function POST(request: Request) {
    const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    const wantsJson = (req: Request) => (req.headers.get('accept') || '').toLowerCase().includes('application/json');

    try {
        const url = new URL(request.url);
        const isDebug = url.searchParams.get('debug') === '1' || wantsJson(request);
        
        let body: any;
        try {
            body = await request.json();
        } catch (err) {
            return json({ ok: false, code: 'BAD_JSON', message: 'Invalid JSON body' }, 400);
        }

        const title = (typeof body?.title === 'string' && body.title.trim()) ? body.title.trim() : 'ForecastReport';

        const { Document, Page, View, Image, Text, pdf, StyleSheet } = await import('@react-pdf/renderer');
        const React = (await import('react')).default || (await import('react'));
        
        // --- BLANK PDF PROBE ---
        if (body.mode === 'blank') {
             const blankStyles = StyleSheet.create({
                page: { padding: 48, backgroundColor: '#FFFFFF', fontSize: 12, fontFamily: 'Helvetica' },
                text: { marginBottom: 10 }
            });
            const blankDoc = React.createElement(
                Document, { title: 'Blank PDF Probe' },
                React.createElement(
                    Page, { size: 'A4', style: blankStyles.page },
                    React.createElement(Text, { style: blankStyles.text }, 'Blank PDF Probe: OK'),
                    React.createElement(Text, { style: blankStyles.text }, `Generated at: ${new Date().toISOString()}`)
                )
            );
            const blankBuf = await pdf(blankDoc).toBuffer();
            if (isDebug) {
                return json({ ok: true, phase: 'POST_OK_BLANK', pdfBytes: blankBuf.length });
            }
            return new Response(blankBuf, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="blank_probe.pdf"`,
                    'Cache-Control': 'no-store'
                }
            });
        }


        // --- IMAGE-BASED PDF ---
        const rawBase64 = (typeof body?.imageBase64 === 'string' ? body.imageBase64 : '').trim();
        if (!rawBase64) {
            return json({ ok: false, code: 'BAD_IMAGE', message: 'Missing or empty imageBase64 string.' }, 400);
        }

        const formatIn = (body?.format || 'jpg').toLowerCase();
        const format = formatIn === 'jpeg' ? 'jpg' : formatIn;
        if (format !== 'jpg' && format !== 'png') {
            return json({ ok: false, code: 'BAD_FORMAT', message: `Unsupported format: ${format}. Must be 'jpg' or 'png'.` }, 400);
        }
        
        const bytes = Buffer.from(rawBase64, 'base64');
        if (bytes.length === 0) {
            return json({ ok: false, code: 'BAD_IMAGE', message: 'Decoded image buffer is empty.' }, 400);
        }

        const styles = StyleSheet.create({
            page: { padding: 24, backgroundColor: '#FFFFFF', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
            container: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            image: { objectFit: 'contain', width: '100%', height: 'auto' },
        });

        const imageSrc = { data: new Uint8Array(bytes), format: format as 'jpg' | 'png' };

        const docElement = React.createElement(
            Document,
            { title },
            React.createElement(
                Page,
                { size: 'A4', style: styles.page, orientation: 'portrait' },
                React.createElement(
                    View, 
                    { style: styles.container },
                    React.createElement(Image, { src: imageSrc, style: styles.image })
                )
            )
        );

        if (isDebug) {
             try {
                const probeInstance = pdf(docElement);
                const probeBuffer = await probeInstance.toBuffer();
                return json({ 
                    ok: true, 
                    phase: 'POST_OK', 
                    inputBytes: bytes.length, 
                    pdfBytes: probeBuffer.length,
                    format 
                });
             } catch (e: any) {
                return json({ ok:false, code:'EMBED_FAILED', message: String(e?.message||e), inputBytes: bytes.length, format }, 500);
             }
        }
        
        try {
            const instance = pdf(docElement);
            const buffer: Buffer = await instance.toBuffer();

            return new Response(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${title}.pdf"`,
                    'Cache-Control': 'no-store',
                },
            });
        } catch (err: any) {
             return json({ ok:false, code:'EMBED_FAILED', message: String(err?.message||err), inputBytes: bytes.length, format }, 500);
        }
        

    } catch (err: any) {
        console.warn('[pdf:embed-fallback]', 'Failed to render PDF from image', err);
        return json({ ok: false, code: 'POST_ERROR', message: String(err.message || err) }, 500);
    }
}
