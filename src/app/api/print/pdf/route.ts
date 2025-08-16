import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The GET handler is currently disabled in favor of the more reliable POST-based fallback.
 * The debug steps for headless Chrome are kept for potential future use.
 */
export async function GET(request: Request) {
    // Parse URL defensively
    let url: URL;
    try {
        url = new URL(request.url);
    } catch {
        return NextResponse.json({ ok: false, code: 'BAD_URL', message: 'invalid request.url' }, { status: 500 });
    }

    const accept = (request.headers.get('accept') || '').toLowerCase();
    const isDebug = url.searchParams.get('debug') === '1' || accept.includes('application/json');

    // For now, always disable the GET path, but allow debug steps to be tested.
    if (!isDebug) {
        return NextResponse.json({ ok: false, code: 'GET_DISABLED', message: 'This endpoint is temporarily disabled. Use POST.' }, { status: 405 });
    }
    
    // --- STAGED DEBUG LOGIC (kept for reference) ---
    const step = url.searchParams.get('step') || '';
    const origin = `${url.protocol}//${url.host}`;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const printUrl = origin + normalizedBase + '/print/report' + (url.search ? url.search : '');

    if (step === 'entry') {
        return NextResponse.json({ ok: true, phase: 'ENTRY', origin, basePath, printUrl }, { status: 200 });
    }
    
    // For other steps, return the disabled message as we are not using Puppeteer.
    return NextResponse.json({ ok: false, code: 'GET_DISABLED', message: `Debug step '${step}' is part of a disabled flow.` }, { status: 405 });
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
        const { imageBase64: rawBase64 = '', format = 'jpeg', title = 'ForecastReport' } = body;
        const imageBase64 = rawBase64.trim();

        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!imageBase64 || !base64Regex.test(imageBase64)) {
            return NextResponse.json(
                { ok: false, code: 'BAD_IMAGE', message: 'Missing or invalid imageBase64 string.' },
                { status: 400 }
            );
        }
        
        // 3. Convert to bytes
        const bytes = Buffer.from(imageBase64, 'base64');
        if (!bytes.length) {
            return NextResponse.json({ ok: false, code: 'BAD_IMAGE', message: 'Empty image data.' }, { status: 400 });
        }

        // 4. Dynamically import modules to avoid issues in environments where they might not be available.
        const React = (await import('react')).default || (await import('react'));
        const { Document, Page, View, Image, pdf, StyleSheet } = await import('@react-pdf/renderer');
        
        // 5. Build styles and React element tree (no JSX)
        const styles = StyleSheet.create({
            page: { padding: 24, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
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

        // 6. Render the PDF to a buffer
        const instance = pdf(docElement);
        const buffer: Buffer = await instance.toBuffer();

        // 7. Content negotiation: return PDF or debug JSON
        if (isDebug) {
            return NextResponse.json({ ok: true, phase: 'POST_OK', bytes: buffer.length }, { status: 200 });
        }

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
