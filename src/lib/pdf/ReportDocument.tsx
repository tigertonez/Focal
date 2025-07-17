
'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-p' + 'df/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// This is a placeholder component. It will be fully implemented in the next step.
// For now, it just proves the rendering pipeline is working.
export const ReportDocument = ({ inputs, data }: { inputs: EngineInput, data: EngineOutput }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Financial Report Placeholder</Text>
        <Text>This document confirms the PDF generation pipeline is correctly set up.</Text>
        <Text>The full report content will be added in the next step.</Text>
        <Text style={styles.small}>Timestamp: {new Date().toISOString()}</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 30,
    lineHeight: 1.5,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 10,
  },
  small: {
    fontSize: 8,
    marginTop: 20,
    color: 'grey',
  },
});
