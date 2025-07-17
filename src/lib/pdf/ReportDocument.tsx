
'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// =================================================================
// STYLING & HELPERS (Commit 1: Placeholders)
// =================================================================

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 32, color: '#333' },
  section: { marginBottom: 20 },
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 12 },
  footer: { position: 'absolute', bottom: 16, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: 'grey' },
});

// Defensive helpers to ensure no invalid values crash the renderer
const safe = (value: unknown, fallback = '–'): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
    return fallback;
};

// =================================================================
// PAGE COMPONENTS (Commit 1: Placeholders)
// =================================================================

const PageFooter = () => (
    <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Seite ${pageNumber} / ${totalPages}`
    )} fixed />
);

const InputsPage = ({ inputs }: { inputs: EngineInput }) => (
  <Page size="A4" style={styles.page}>
    <Text style={styles.h1}>Inputs Sheet</Text>
    <Text>// TODO: Implement Inputs page layout</Text>
    <PageFooter />
  </Page>
);

const RevenuePage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Revenue Analysis</Text>
        <Text>// TODO: Implement Revenue page layout</Text>
        <PageFooter />
    </Page>
);

const CostsPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Cost Analysis</Text>
        <Text>// TODO: Implement Costs page layout</Text>
        <PageFooter />
    </Page>
);

const ProfitPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Profit Analysis</Text>
        <Text>// TODO: Implement Profit page layout</Text>
        <PageFooter />
    </Page>
);

const CashFlowPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Cash Flow Analysis</Text>
        <Text>// TODO: Implement Cash Flow page layout</Text>
        <PageFooter />
    </Page>
);

const SummaryPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Financial Summary</Text>
        <Text>// TODO: Implement Summary page layout</Text>
        <PageFooter />
    </Page>
);

// =================================================================
// DOCUMENT ROOT
// =================================================================

export const ReportDocument = ({ inputs, data }: { inputs: EngineInput, data: EngineOutput }) => (
  <Document author="Forecasting SaaS Platform" title={`Financial Forecast ${new Date().toISOString().split('T')[0]}`}>
    {/* Page order as specified */}
    <InputsPage inputs={inputs} />
    <RevenuePage data={data} inputs={inputs} />
    <CostsPage data={data} inputs={inputs} />
    <ProfitPage data={data} inputs={inputs} />
    <CashFlowPage data={data} inputs={inputs} />
    <SummaryPage data={data} inputs={inputs} />
  </Document>
);
