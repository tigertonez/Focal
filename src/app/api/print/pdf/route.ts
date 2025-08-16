
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The GET handler is disabled as the headless Chrome path is currently unreliable.
 * All PDF generation is handled by the POST fallback.
 */
export async function GET(request: Request) {
    return NextResponse.json(
        { ok: false, code: 'GET_DISABLED', message: 'This endpoint only supports POST.' },
        { status: 405 }
    );
}

/**
 * Handles PDF generation by embedding a client-provided image into a PDF document.
 * This method does not require a headless browser.
 */
export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const accept = (request.headers.get('accept') || '').toLowerCase();
        const isDebug = url.searchParams.get('debug') === '1' || accept.includes('application/json');

        // 1. Safely parse JSON body
        let body: any;
        try {
            body = await request.json();
        } catch (err) {
            return NextResponse.json({ ok: false, code: 'BAD_JSON', message: 'Invalid JSON body' }, { status: 400 });
        }

        // 2. Validate input payload
        const rawBase64 = (typeof body?.imageBase64 === 'string' ? body.imageBase64 : '').trim();
        const formatIn = (body?.format || 'jpg').toLowerCase();
        const format = formatIn === 'jpeg' ? 'jpg' : formatIn; // Normalize to 'jpg'
        const title = (typeof body?.title === 'string' && body.title.trim()) ? body.title.trim() : 'ForecastReport';

        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!rawBase64 || !base64Regex.test(rawBase64)) {
            return NextResponse.json(
                { ok: false, code: 'BAD_IMAGE', message: 'Missing or invalid imageBase64 string.' },
                { status: 400 }
            );
        }
        
        // 3. Convert to bytes
        const bytes = Buffer.from(rawBase64, 'base64');
        if (!bytes.length) {
            return NextResponse.json({ ok: false, code: 'BAD_IMAGE', message: 'Empty image data.' }, { status: 400 });
        }

        // 4. Dynamically import modules
        const React = (await import('react')).default || (await import('react'));
        const { Document, Page, View, Image, pdf, StyleSheet } = await import('@react-pdf/renderer');
        
        // 5. Build styles and React element tree (no JSX)
        const styles = StyleSheet.create({
            page: { padding: 24, backgroundColor: '#FFFFFF', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
            container: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            image: { objectFit: 'contain', width: '100%', height: 'auto' },
        });

        const imageSrc = { data: new Uint8Array(bytes), format };

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

        // 6. Content negotiation: return PDF or debug JSON
        if (isDebug) {
             try {
                const probeInstance = pdf(docElement);
                const probeBuffer = await probeInstance.toBuffer();
                return NextResponse.json({ 
                    ok: true, 
                    phase: 'POST_OK', 
                    inputBytes: bytes.length, 
                    pdfBytes: probeBuffer.length,
                    format 
                }, { status: 200 });
             } catch (e: any) {
                return NextResponse.json({ ok:false, code:'EMBED_FAILED', message: String(e?.message||e), inputBytes: bytes.length, format }, { status: 500 });
             }
        }
        
        const instance = pdf(docElement);
        const buffer: Buffer = await instance.toBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${title}.pdf"`,
                'Cache-Control': 'no-store',
            },
        });

    } catch (err: any) {
        console.warn('[pdf:embed-fallback]', 'Failed to render PDF from image', err);
        return NextResponse.json(
            { ok: false, code: 'EMBED_FAILED', message: String(err.message || err) },
            { status: 500 }
        );
    }
}
