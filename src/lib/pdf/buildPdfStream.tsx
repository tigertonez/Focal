
'use server';

import { Document, Page, Text, renderToStream } from '@react-pdf/renderer';
import type { Readable } from 'stream';

export async function buildPdfStream(): Promise<Readable> {
  return renderToStream(
    <Document>
      <Page size="A4">
        <Text>🚀 PDF stub generated successfully.</Text>
      </Page>
    </Document>
  );
}
