
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
    const wantsJson = (req: Request) => (req.headers.get('accept') || '').toLowerCase().includes('application/json');
    const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

    try {
        const url = new URL(request.url);
        const isDebug = url.searchParams.get('debug') === '1' || wantsJson(request);
        
        let body: any;
        try {
            body = await request.json();
        } catch (err) {
            return json({ ok: false, code: 'BAD_JSON', message: 'Invalid JSON body' }, 400);
        }

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
        let imageDataUrl = body.imageDataUrl || '';
        let inputBytes = 0;
        let finalFormat = 'png';

        if (!imageDataUrl && body.imageBase64) {
            const fmtIn = (body.format || 'png').toLowerCase();
            finalFormat = fmtIn === 'jpeg' ? 'jpg' : fmtIn;
            if (finalFormat !== 'png' && finalFormat !== 'jpg') {
                return json({ ok: false, code: 'BAD_FORMAT', format: finalFormat }, 400);
            }
            imageDataUrl = `data:image/${finalFormat};base64,${body.imageBase64}`;
        }
        
        if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
            return json({ ok: false, code: 'BAD_IMAGE', message: 'Expected a data:image/... URL.' }, 400);
        }

        const base64Part = imageDataUrl.split(',')[1];
        if (base64Part) {
            inputBytes = Buffer.from(base64Part, 'base64').length;
        }

        const styles = StyleSheet.create({
            page: { padding: 24, backgroundColor: '#ffffff' },
            img: { width: '100%', height: 'auto' }
        });

        const docElement = React.createElement(
            Document,
            { title: body.title || 'ForecastReport' },
            React.createElement(
                Page,
                { size: 'A4', style: styles.page, orientation: 'portrait' },
                React.createElement(Image, { src: imageDataUrl, style: styles.img })
            )
        );

        if (isDebug) {
             try {
                const probeInstance = pdf(docElement);
                const probeBuffer = await probeInstance.toBuffer();
                return json({ 
                    ok: true, 
                    phase: 'POST_OK', 
                    inputBytes, 
                    pdfBytes: probeBuffer.length,
                    format: body.format || 'png'
                });
             } catch (e: any) {
                const errorInfo = { name:e.name, message:e.message, stack:(e.stack||'').slice(0,800) };
                return json({ ok:false, code:'EMBED_FAILED', error: errorInfo, inputBytes, format: body.format || 'png' }, 500);
             }
        }
        
        try {
            const instance = pdf(docElement);
            const buffer: Buffer = await instance.toBuffer();

            return new Response(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${(body.title||'ForecastReport')}.pdf"`,
                    'Cache-Control': 'no-store',
                },
            });
        } catch (err: any) {
             const errorInfo = { name:err.name, message:err.message, stack:(err.stack||'').slice(0,800) };
             return json({ ok:false, code:'EMBED_FAILED', error: errorInfo, inputBytes, format: body.format || 'png' }, 500);
        }
        

    } catch (err: any) {
        console.warn('[pdf:embed-fallback]', 'Failed to render PDF from image', err);
        return json({ ok: false, code: 'POST_ERROR', message: String(err.message || err) }, 500);
    }
}
