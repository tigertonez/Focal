'use client';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

/* Plain React component – NOT a server action */
export function ReportDocument({
  inputs,
  data,
}: {
  inputs?: EngineInput;
  data?: EngineOutput;
}) {
  return (
    <Document>
      <Page size="A4">
        <Text>PDF stub – it works 🚀</Text>
      </Page>
    </Document>
  );
}
