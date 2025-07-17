'use client';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

// ==================================
// STYLES
// ==================================
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingHorizontal: 40,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
  },
  // KPI Styles
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    width: '32%',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Table Styles
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeaderRow: {
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
  },
  tableCol: {
    padding: 6,
    borderStyle: 'solid',
  },
  tableHeader: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  tableCell: {
    fontFamily: 'Helvetica',
    color: '#334155',
  },
});

// ==================================
// HELPERS
// ==================================
const safeString = (value: any): string => {
  if (value === null || typeof value === 'undefined') return '';
  return String(value);
};

const safeCurrency = (value: any, currency: string = 'USD'): string => {
  const num = Number(value);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
};

const safePercent = (value: any): string => {
  const num = Number(value);
  if (isNaN(num)) return '';
  return `${num.toFixed(1)}%`;
};

// ==================================
// DOCUMENT COMPONENT
// ==================================
export default function ReportDocument({
  inputs,
  data,
}: {
  inputs?: EngineInput;
  data?: EngineOutput;
}) {
  const currency = inputs?.parameters.currency || 'USD';

  return (
    <Document>
      {/* PAGE 1: SUMMARY */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Financial Summary</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
              <Text style={styles.kpiValue}>{String(safeCurrency(data?.revenueSummary.totalRevenue, currency))}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Costs</Text>
              <Text style={styles.kpiValue}>{String(safeCurrency(data?.costSummary.totalOperating, currency))}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Gross Profit</Text>
              <Text style={styles.kpiValue}>{String(safeCurrency(data?.profitSummary.totalGrossProfit, currency))}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Ending Cash</Text>
              <Text style={styles.kpiValue}>{String(safeCurrency(data?.cashFlowSummary.endingCashBalance, currency))}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Profit Break-Even</Text>
              <Text style={styles.kpiValue}>{String(safeString(data?.profitSummary.breakEvenMonth))} Months</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Peak Funding Need</Text>
              <Text style={styles.kpiValue}>{String(safeCurrency(data?.cashFlowSummary.peakFundingNeed, currency))}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PAGE 2: INPUTS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Input Sheet</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products &amp; Services</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }]}>
              <View style={[styles.tableCol, { flex: 3 }]}><Text style={styles.tableHeader}>Product</Text></View>
              <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableHeader}>Units</Text></View>
              <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableHeader}>Unit Cost</Text></View>
              <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableHeader}>Sell Price</Text></View>
              <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableHeader}>Sell-Thru</Text></View>
              <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableHeader}>Deposit</Text></View>
            </View>
            {/* Table Body */}
            {inputs?.products.map((p, i) => (
              <View key={p.id} style={[styles.tableRow, i === inputs.products.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <View style={[styles.tableCol, { flex: 3 }]}><Text style={styles.tableCell}>{String(safeString(p.productName))}</Text></View>
                <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableCell}>{String(safeString(p.plannedUnits))}</Text></View>
                <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableCell}>{String(safeCurrency(p.unitCost, currency))}</Text></View>
                <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableCell}>{String(safeCurrency(p.sellPrice, currency))}</Text></View>
                <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableCell}>{String(safePercent(p.sellThrough))}</Text></View>
                <View style={[styles.tableCol, { flex: 1.5, textAlign: 'right' }]}><Text style={styles.tableCell}>{String(safePercent(p.depositPct))}</Text></View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
