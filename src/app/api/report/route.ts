
import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer';
import { calculateFinancials } from '@/lib/engine/financial-engine';
import { EngineInputSchema, type EngineInput, type EngineOutput } from '@/lib/types';
import { z } from 'zod';

// ==================================
// PDF Component Stubs
// ==================================
// TODO: Implement the actual layout and styling for each page.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
  }
});

const InputSheetPage = ({ inputs }: { inputs: EngineInput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
      <Text style={styles.heading}>Input Sheet</Text>
      <Text>TODO: Render input tables (Products, Fixed Costs, Parameters)</Text>
    </View>
  </Page>
);

const RevenuePage = ({ data }: { data: EngineOutput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
      <Text style={styles.heading}>Revenue Analysis</Text>
      <Text>TODO: Render revenue KPIs, charts, and tables</Text>
    </View>
  </Page>
);

const CostsPage = ({ data }: { data: EngineOutput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
       <Text style={styles.heading}>Cost Analysis</Text>
      <Text>TODO: Render cost KPIs, charts, and tables</Text>
    </View>
  </Page>
);

const ProfitPage = ({ data }: { data: EngineOutput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
      <Text style={styles.heading}>Profit Analysis</Text>
      <Text>TODO: Render profit KPIs, charts, and tables</Text>
    </View>
  </Page>
);

const CashFlowPage = ({ data }: { data: EngineOutput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
      <Text style={styles.heading}>Cash Flow Analysis</Text>
      <Text>TODO: Render cash flow KPIs, charts, and tables</Text>
    </View>
  </Page>
);

const SummaryPage = ({ data }: { data: EngineOutput }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.section}>
      <Text style={styles.heading}>Financial Summary</Text>
      <Text>TODO: Render KPISection, HealthPanel, and CashBridge</Text>
    </View>
  </Page>
);

// ==================================
// Main PDF Document
// ==================================

const ReportDocument = ({ inputs, data }: { inputs: EngineInput; data: EngineOutput }) => (
  <Document>
    <InputSheetPage inputs={inputs} />
    <RevenuePage data={data} />
    <CostsPage data={data} />
    <ProfitPage data={data} />
    <CashFlowPage data={data} />
    <SummaryPage data={data} />
  </Document>
);

// ==================================
// API Route Handler
// ==================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = EngineInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.flatten() }, { status: 400 });
    }

    const inputs = validation.data;
    
    // Recalculate to ensure fresh data
    const data = calculateFinancials(inputs);

    // TODO: Add timeout handling (e.g., Promise.race with a timer)

    const stream = await renderToStream(<ReportDocument inputs={inputs} data={data} />);

    return new NextResponse(stream as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
        },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // TODO: This should return a structured error that the client can show in a toast
    return NextResponse.json({ error: 'Failed to generate report', details: errorMessage }, { status: 500 });
  }
}
