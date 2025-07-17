
'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput, FixedCostItem, Product } from '@/lib/types';

// =================================================================
// STYLING
// =================================================================
const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 32, color: '#333' },
  // Headers
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 4 },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 14, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  h3: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 8 },
  // Layout
  section: { marginBottom: 24, breakAfter: 'avoid' },
  flexRow: { flexDirection: 'row', gap: 12 },
  flexCol: { flexDirection: 'column', flex: 1 },
  // Tables
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee' },
  tableRow: { margin: 'auto', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeader: { backgroundColor: '#f9f9f9', fontFamily: 'Helvetica-Bold' },
  tableCell: { margin: 5, fontSize: 8 },
  // Misc
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  kpiCard: { flex: 1, minWidth: '32%', border: 1, borderColor: '#eee', padding: 6, borderRadius: 3, gap: 2 },
  kpiLabel: { fontSize: 8, color: '#666' },
  kpiValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 16, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: 'grey' },
});

// =================================================================
// SAFE RENDERING HELPERS
// =================================================================

/**
 * Guarantees a primitive string for rendering in <Text>, preventing crashes.
 * @param value The value to sanitize.
 * @param fallback The string to return if the value is not a valid string or number.
 * @returns A renderable string.
 */
const safe = (value: unknown, fallback = '–'): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  return fallback;
};

const safeNum = (value: unknown, fallback = '–'): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat('en-US').format(value);
};

const safeCurrency = (value: unknown, currencyCode: string = 'USD', fallback = '–'): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(value);
};

const safePercent = (value: unknown, fallback = '–'): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return `${value.toFixed(1)}%`;
};

// =================================================================
// PDF PAGE COMPONENTS
// =================================================================

const PageFooter = () => (
    <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} of ${totalPages}`
    )} fixed />
);

const InputsPage = ({ inputs }: { inputs: EngineInput }) => (
  <Page size="A4" style={styles.page}>
    <Text style={styles.h1}>Inputs Sheet</Text>
    <Text style={{...styles.kpiLabel, marginBottom: 16}}>The assumptions driving this financial forecast.</Text>
    
    <View style={styles.section}>
      <Text style={styles.h2}>Products & Services</Text>
      {inputs.products.map((p: Product) => (
        <View key={p.id} style={{ ...styles.kpiCard, width: '100%', marginBottom: 12 }}>
          <Text style={styles.h3}>{safe(p.productName, 'Unnamed Product')}</Text>
          <View style={styles.flexRow}>
            <View style={styles.flexCol}><Text style={styles.kpiLabel}>Planned Units:</Text><Text>{safeNum(p.plannedUnits)}</Text></View>
            <View style={styles.flexCol}><Text style={styles.kpiLabel}>Unit Cost:</Text><Text>{safeCurrency(p.unitCost, inputs.parameters.currency)}</Text></View>
            <View style={styles.flexCol}><Text style={styles.kpiLabel}>Sales Price:</Text><Text>{safeCurrency(p.sellPrice, inputs.parameters.currency)}</Text></View>
            <View style={styles.flexCol}><Text style={styles.kpiLabel}>Sell-Through:</Text><Text>{safePercent(p.sellThrough)}</Text></View>
            <View style={styles.flexCol}><Text style={styles.kpiLabel}>Deposit:</Text><Text>{safePercent(p.depositPct)}</Text></View>
          </View>
        </View>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.h2}>Fixed Costs</Text>
      <View style={styles.table}>
        <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
            <View style={{...styles.tableCell, flex: 3}}><Text>Cost Name</Text></View>
            <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>Amount</Text></View>
            <View style={{...styles.tableCell, flex: 2}}><Text>Schedule</Text></View>
        </View>
        {inputs.fixedCosts.map((c: FixedCostItem) => (
            <View key={c.id} style={styles.tableRow}>
                <View style={{...styles.tableCell, flex: 3}}><Text>{safe(c.name)}</Text></View>
                <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>{safeCurrency(c.amount, inputs.parameters.currency)} {c.costType === 'Monthly Cost' ? '/mo' : ''}</Text></View>
                <View style={{...styles.tableCell, flex: 2}}><Text>{safe(c.paymentSchedule)}</Text></View>
            </View>
        ))}
      </View>
    </View>
    <PageFooter />
  </Page>
);

const RevenuePage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Revenue Analysis</Text>
        <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Revenue</Text><Text style={styles.kpiValue}>{safeCurrency(data.revenueSummary.totalRevenue, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Units Sold</Text><Text style={styles.kpiValue}>{safeNum(data.revenueSummary.totalSoldUnits)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Avg. Revenue / Unit</Text><Text style={styles.kpiValue}>{safeCurrency(data.revenueSummary.avgRevenuePerUnit, inputs.parameters.currency)}</Text></View>
        </View>
        <View style={styles.section}>
            <Text style={styles.h2}>Revenue by Product</Text>
            <View style={styles.table}>
                <View style={{...styles.tableRow, ...styles.tableHeader}}>
                    <View style={{...styles.tableCell, flex: 3}}><Text>Product</Text></View>
                    <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>Units Sold</Text></View>
                    <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>Total Revenue</Text></View>
                </View>
                {data.revenueSummary.productBreakdown.map((p) => (
                    <View key={p.name} style={styles.tableRow}>
                        <View style={{...styles.tableCell, flex: 3}}><Text>{safe(p.name)}</Text></View>
                        <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>{safeNum(p.totalSoldUnits)}</Text></View>
                        <View style={{...styles.tableCell, flex: 1.5, textAlign: 'right'}}><Text>{safeCurrency(p.totalRevenue, inputs.parameters.currency)}</Text></View>
                    </View>
                ))}
            </View>
        </View>
        <PageFooter />
    </Page>
);

const CostsPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Cost Analysis</Text>
        <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Operating Costs</Text><Text style={styles.kpiValue}>{safeCurrency(data.costSummary.totalOperating, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Fixed Costs</Text><Text style={styles.kpiValue}>{safeCurrency(data.costSummary.totalFixed, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Variable Costs</Text><Text style={styles.kpiValue}>{safeCurrency(data.costSummary.totalVariable, inputs.parameters.currency)}</Text></View>
        </View>
        <View style={styles.section}>
            <Text style={styles.h2}>Fixed Costs</Text>
            {inputs.fixedCosts.map((c: FixedCostItem) => (<Text key={c.id}> • {c.name}: {safeCurrency(c.amount, inputs.parameters.currency)}</Text>))}
        </View>
        <PageFooter />
    </Page>
);

const ProfitPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Profit Analysis</Text>
        <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Net Profit</Text><Text style={styles.kpiValue}>{safeCurrency(data.profitSummary.totalNetProfit, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Operating Profit</Text><Text style={styles.kpiValue}>{safeCurrency(data.profitSummary.totalOperatingProfit, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Gross Profit</Text><Text style={styles.kpiValue}>{safeCurrency(data.profitSummary.totalGrossProfit, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Net Margin</Text><Text style={styles.kpiValue}>{safePercent(data.profitSummary.netMargin)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Profit Break-Even</Text><Text style={styles.kpiValue}>{safe(data.profitSummary.breakEvenMonth)} months</Text></View>
        </View>
        <PageFooter />
    </Page>
);

const CashFlowPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Cash Flow Analysis</Text>
         <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Ending Cash Balance</Text><Text style={styles.kpiValue}>{safeCurrency(data.cashFlowSummary.endingCashBalance, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Peak Funding Need</Text><Text style={styles.kpiValue}>{safeCurrency(data.cashFlowSummary.peakFundingNeed, inputs.parameters.currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Cash Runway</Text><Text style={styles.kpiValue}>{safe(data.cashFlowSummary.runway)} months</Text></View>
        </View>
        <PageFooter />
    </Page>
);

const SummaryPage = ({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Financial Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Revenue</Text><Text style={styles.kpiValue}>{safeCurrency(data.revenueSummary.totalRevenue, inputs.parameters.currency)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Total Costs</Text><Text style={styles.kpiValue}>{safeCurrency(data.costSummary.totalOperating, inputs.parameters.currency)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Net Profit</Text><Text style={styles.kpiValue}>{safeCurrency(data.profitSummary.totalNetProfit, inputs.parameters.currency)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Ending Cash</Text><Text style={styles.kpiValue}>{safeCurrency(data.cashFlowSummary.endingCashBalance, inputs.parameters.currency)}</Text></View>
        </View>
        {data.businessHealth &&
          <View style={styles.section}>
            <Text style={styles.h2}>Business Health Score: {safe(data.businessHealth.score.toFixed(0))}/100</Text>
            <Text style={styles.h3}>Insights:</Text>
            {data.businessHealth.insights.map((item, i) => <Text key={i}> • {safe(item)}</Text>)}
            <Text style={{...styles.h3, marginTop: 12}}>Alerts:</Text>
            {data.businessHealth.alerts.map((item, i) => <Text key={i}> • {safe(item)}</Text>)}
          </View>
        }
        <PageFooter />
    </Page>
);

// =================================================================
// DOCUMENT ROOT
// =================================================================

export const ReportDocument = ({ inputs, data }: { inputs: EngineInput, data: EngineOutput }) => (
  <Document author="Forecasting SaaS Platform" title={`Financial Forecast ${new Date().toISOString().split('T')[0]}`}>
    <SummaryPage data={data} inputs={inputs} />
    <InputsPage inputs={inputs} />
    <RevenuePage data={data} inputs={inputs} />
    <CostsPage data={data} inputs={inputs} />
    <ProfitPage data={data} inputs={inputs} />
    <CashFlowPage data={data} inputs={inputs} />
  </Document>
);
