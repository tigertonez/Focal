
'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// TODO: Fill this component with the actual report structure.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  section: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export function ReportDocument({ inputs, data }: { inputs: EngineInput; data: EngineOutput }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading}>Financial Report</Text>
          <Text>This is a placeholder for the full financial report.</Text>
          <Text>Currency: {inputs.parameters.currency}</Text>
          <Text>Total Revenue: {data.revenueSummary.totalRevenue}</Text>
        </View>
      </Page>
    </Document>
  );
}
