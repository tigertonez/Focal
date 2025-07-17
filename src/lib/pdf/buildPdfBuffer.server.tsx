'use server';

import { pdf, Document, Page, Text } from '@react-pdf/renderer';

/** returns Buffer with one-page stub */
export async function buildPdfBuffer(): Promise<Buffer> {
  return pdf(
    <Document>
      <Page size="A4"><Text>PDF stub – it works 🚀</Text></Page>
    </Document>
  ).toBuffer();
}
