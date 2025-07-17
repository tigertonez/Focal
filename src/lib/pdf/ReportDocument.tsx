
'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// =================================================================
// Data Sanitization Helpers
// =================================================================

const safeString = (value: any): string => {
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
    return '–';
  }
  return String(value);
};

const safeCurrency = (value: any, currency: 'USD' | 'EUR' = 'USD'): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '–';
  }
  const symbol = currency === 'USD' ? '$' : '€';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const safePercent = (value: any): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '–';
  }
  return `${value.toFixed(1)}%`;
};


// =================================================================
// Styles
// =================================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#111',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 5,
    padding: 10,
    flexGrow: 1,
    flexBasis: '30%', // Allows 3 cards per row
    minWidth: 150,
  },
  kpiLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    display: "flex",
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F0F0F0',
    fontFamily: 'Helvetica-Bold',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableCell: {
    margin: 5,
    fontSize: 9,
  },
});


// =================================================================
// Sub-components
// =================================================================

const KpiCard = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
    </View>
);

const SummaryPage = ({ data, currency }: { data: EngineOutput, currency: 'USD' | 'EUR' }) => (
    <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Financial Report Summary</Text>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
            <View style={styles.kpiGrid}>
                <KpiCard label="Total Revenue" value={safeCurrency(data.revenueSummary.totalRevenue, currency)} />
                <KpiCard label="Total Costs" value={safeCurrency(data.costSummary.totalOperating, currency)} />
                <KpiCard label="Gross Profit" value={safeCurrency(data.profitSummary.totalGrossProfit, currency)} />
                <KpiCard label="Ending Cash" value={safeCurrency(data.cashFlowSummary.endingCashBalance, currency)} />
                <KpiCard label="Profit Break-Even" value={`${safeString(data.profitSummary.breakEvenMonth)} Months`} />
                <KpiCard label="Peak Funding Need" value={safeCurrency(data.cashFlowSummary.peakFundingNeed, currency)} />
            </View>
        </View>
    </Page>
);

const InputSheetPage = ({ inputs }: { inputs: EngineInput }) => {
    const { currency } = inputs.parameters;
    const colStyles = {
        name: { flex: 3 },
        units: { flex: 1, textAlign: 'right' as const },
        unitCost: { flex: 1, textAlign: 'right' as const },
        sellPrice: { flex: 1, textAlign: 'right' as const },
        sellThru: { flex: 1, textAlign: 'right' as const },
        deposit: { flex: 1, textAlign: 'right' as const },
    };

    return (
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Input Sheet</Text>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Products & Services</Text>
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCol, colStyles.name]}><Text style={styles.tableCell}>Product</Text></View>
                        <View style={[styles.tableCol, colStyles.units]}><Text style={styles.tableCell}>Units</Text></View>
                        <View style={[styles.tableCol, colStyles.unitCost]}><Text style={styles.tableCell}>Unit Cost</Text></View>
                        <View style={[styles.tableCol, colStyles.sellPrice]}><Text style={styles.tableCell}>Sell Price</Text></View>
                        <View style={[styles.tableCol, colStyles.sellThru]}><Text style={styles.tableCell}>Sell-Thru</Text></View>
                        <View style={[styles.tableCol, colStyles.deposit]}><Text style={styles.tableCell}>Deposit</Text></View>
                    </View>
                    {/* Data Rows */}
                    {inputs.products.map(p => (
                        <View key={p.id} style={styles.tableRow}>
                            <View style={[styles.tableCol, colStyles.name]}><Text style={styles.tableCell}>{safeString(p.productName)}</Text></View>
                            <View style={[styles.tableCol, colStyles.units]}><Text style={styles.tableCell}>{safeString(p.plannedUnits)}</Text></View>
                            <View style={[styles.tableCol, colStyles.unitCost]}><Text style={styles.tableCell}>{safeCurrency(p.unitCost, currency)}</Text></View>
                            <View style={[styles.tableCol, colStyles.sellPrice]}><Text style={styles.tableCell}>{safeCurrency(p.sellPrice, currency)}</Text></View>
                            <View style={[styles.tableCol, colStyles.sellThru]}><Text style={styles.tableCell}>{safePercent(p.sellThrough)}</Text></View>
                            <View style={[styles.tableCol, colStyles.deposit]}><Text style={styles.tableCell}>{safePercent(p.depositPct)}</Text></View>
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    );
};


// =================================================================
// Main Document Component
// =================================================================

export function ReportDocument({ inputs, data }: { inputs: EngineInput; data: EngineOutput }) {
  return (
    <Document>
      <SummaryPage data={data} currency={inputs.parameters.currency} />
      <InputSheetPage inputs={inputs} />
    </Document>
  );
}
