
'use server';

import { Document, Page, Text, renderToStream } from '@react-pdf/renderer';
import type { Readable } from 'stream';

/**
 * Renders a React component to a Node.js stream for the PDF report.
 * This function is marked as a server-only module.
 */
export async function buildPdfStream(): Promise<Readable> {
  // For now, render a minimal stub document to verify the plumbing.
  const stream = await renderToStream(
    <Document>
      <Page size="A4">
        <Text>PDF stub v1</Text>
      </Page>
    </Document>
  );
  return stream;
}
