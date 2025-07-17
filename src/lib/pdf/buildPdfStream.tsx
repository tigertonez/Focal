
'use client'; // This directive is important for @react-pdf/renderer

import { renderToStream } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';
import { ReportDocument } from './ReportDocument';
import type { Readable } from 'stream';

/**
 * A helper function that isolates the `renderToStream` call.
 * This is the only place in the codebase where JSX is rendered into a PDF stream.
 * It takes validated data and returns a Node.js Readable stream.
 * @param props - An object containing the validated `inputs` and `data`.
 * @returns A promise that resolves to a Node.js Readable stream.
 */
export async function buildPdfStream(
  props: { inputs: EngineInput; data: EngineOutput }
): Promise<Readable> {
  // renderToStream returns a Node.js stream.
  // Any rendering error inside ReportDocument will be caught by the API route's try/catch block.
  const stream = await renderToStream(<ReportDocument {...props} />);
  return stream as Readable;
}
