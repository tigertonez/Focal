'use server';
import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// *** EINZIGE (!!) Export-Variante – benannter Export ***
export function ReportDocument(
  props: { inputs?: EngineInput; data?: EngineOutput }
) {
  return (
    <Document>
      <Page size="A4">
        <Text>👋 PDF stub – ReportDocument works.</Text>
      </Page>
    </Document>
  );
}
