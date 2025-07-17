
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { EngineInputSchema, EngineOutputSchema } from '@/lib/types';
import { buildPdfStream } from '@/lib/pdf/buildPdfStream';
import { streamToBuffer } from 'node:stream/consumers';

// In-memory store for rate limiting.
// In a production environment, you would use a more persistent store like Redis.
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // --- 1. Rate Limiting ---
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const now = Date.now();
  const userRequests = (rateLimitStore.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (userRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  rateLimitStore.set(ip, [...userRequests, now]);

  // --- 2. Request Processing ---
  try {
    const body = await req.json();

    // Validate inputs and data using Zod schemas
    const parsedInputs = EngineInputSchema.safeParse(body.inputs);
    const parsedData = EngineOutputSchema.safeParse(body.data);

    if (!parsedInputs.success || !parsedData.success) {
      console.error('Zod validation failed:', {
        inputs: !parsedInputs.success ? parsedInputs.error.flatten() : 'success',
        data: !parsedData.success ? parsedData.error.flatten() : 'success',
      });
      return NextResponse.json({ error: 'Invalid data provided for PDF generation.' }, { status: 400 });
    }

    // --- 3. PDF Generation ---
    // The actual rendering logic is isolated in this helper
    const nodeStream = await buildPdfStream({
      inputs: parsedInputs.data,
      data: parsedData.data,
    });

    // Convert the Node.js Readable stream to a Buffer for a reliable response
    const pdfBuffer = await streamToBuffer(nodeStream);
    
    // --- 4. Send Response ---
    const filename = `forecast-${new Date().toISOString().split('T')[0]}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error('PDF route error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF.', details: err.message },
      { status: 500 }
    );
  }
}
