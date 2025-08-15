
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if the package can be resolved at runtime.
    // The actual executable path will be handled by the library.
    require.resolve('@sparticuz/chromium');
    return NextResponse.json({
      ok: true,
      chromium: {
        available: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      chromium: {
        available: false,
      },
      error: error.message,
    });
  }
}
