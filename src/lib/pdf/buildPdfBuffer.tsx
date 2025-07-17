
'use server';
import { pdf, Document, Page, Text } from '@react-pdf/renderer';

export async function buildPdfBuffer() {
  const doc = (
    <Document>
      <Page size="A4">
        <Text>🚀 PDF stub generated successfully.</Text>
      </Page>
    </Document>
  );

  return await pdf(doc).toBuffer();
}
