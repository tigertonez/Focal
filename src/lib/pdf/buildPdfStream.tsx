
'use server';

import { renderToStream } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import type { EngineInput, EngineOutput } from '@/lib/types';
import type { Readable } from 'stream';

/**
 * Renders a React component to a Node.js stream.
 * This function is marked as a server-only module.
 */
export async function buildPdfStream(props: {
  inputs: EngineInput;
  data: EngineOutput;
}): Promise<Readable> {
  // `renderToStream` returns a Node.js Readable stream.
  const stream = await renderToStream(<ReportDocument {...props} />);
  return stream;
}
