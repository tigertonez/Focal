import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput, FixedCostItem, Product } from '@/lib/types';

// =================================================================
// Safe Data Helpers
// =================================================================
const safeString = (v: any) => String(v ?? '-');
const safeNumber = (v: any) => isFinite(v) ? Number(v).toLocaleString('de-DE') : '0';
const safeCurrency = (v: any, currency: string = 'USD') => {
  const num = Number(v);
  if (isNaN(num)) return '-';
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
const safePercent = (v: any) => {
    const num = Number(v);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)}%`;
};

// =================================================================
// Styling
// =================================================================
const PRIMARY_BLUE = '#2563EB';
const ACCENT_GREEN = '#059669';
const DANGER_RED = '#DC2626';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';
const TABLE_HEADER_BG = '#F3F4F6';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: TEXT_PRIMARY },
  header: { fontSize: 18, marginBottom: 24, fontFamily: 'Helvetica-Bold', color: PRIMARY_BLUE },
  subHeader: { fontSize: 12, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  
  // KPI Cards
  kpiRow:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 4, padding: 10, width: '32%', marginBottom: 10 },
  kpiLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_SECONDARY, marginBottom: 4, textTransform: 'uppercase' },
  kpiValue:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: TEXT_PRIMARY },
  
  // Table
  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 3, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: TABLE_HEADER_BG, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  row:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  row_last: { flexDirection: 'row' },
  hcell: { flex: 1, padding: 8, fontFamily: 'Helvetica-Bold' },
  hcell_wide: { flex: 2, padding: 8, fontFamily: 'Helvetica-Bold' },
  cell:  { flex: 1, padding: 8 },
  cell_wide: { flex: 2, padding: 8 },
  cellRight: { textAlign: 'right' },

  // Page numbering
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: TEXT_SECONDARY,
  },
});

const PdfStub = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Report Error</Text>
            <Text>No valid forecast data was provided to generate the report.</Text>
        </Page>
    </Document>
);

// =================================================================
// Main Document Component
// =================================================================
export function ReportDocument({ inputs, data }: { inputs?: EngineInput; data?: EngineOutput }) {
  if (!inputs || !data) {
    return <PdfStub />;
  }

  const { currency } = inputs.parameters;
  const { revenueSummary, costSummary, profitSummary, cashFlowSummary } = data;

  const PageNumber = ({ pageNumber, totalPages }: { pageNumber: number, totalPages: number }) => (
    <Text style={styles.pageNumber} fixed>
      Page {pageNumber} / {totalPages}
    </Text>
  );

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Financial Summary</Text>
        <Text style={styles.subHeader}>Key Performance Indicators</Text>
        <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                <Text style={styles.kpiValue}>{safeCurrency(revenueSummary.totalRevenue, currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL COSTS</Text>
                <Text style={styles.kpiValue}>{safeCurrency(costSummary.totalOperating, currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>GROSS PROFIT</Text>
                <Text style={{...styles.kpiValue, color: profitSummary.totalGrossProfit > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safeCurrency(profitSummary.totalGrossProfit, currency)}
                </Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>ENDING CASH</Text>
                 <Text style={{...styles.kpiValue, color: cashFlowSummary.endingCashBalance > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safeCurrency(cashFlowSummary.endingCashBalance, currency)}
                </Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PROFIT BREAK-EVEN</Text>
                <Text style={styles.kpiValue}>{profitSummary.breakEvenMonth ? `${safeString(profitSummary.breakEvenMonth)} Months` : 'N/A'}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PEAK FUNDING NEED</Text>
                <Text style={{...styles.kpiValue, color: cashFlowSummary.peakFundingNeed > 0 ? DANGER_RED : TEXT_PRIMARY }}>
                  {safeCurrency(cashFlowSummary.peakFundingNeed, currency)}
                </Text>
            </View>
        </View>
        <PageNumber pageNumber={1} totalPages={5} />
      </Page>

      {/* Page 2: Input Sheet */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Inputs Sheet</Text>
        <Text style={styles.subHeader}>Products & Services</Text>
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.hcell_wide}>PRODUCT</Text>
                <Text style={{...styles.hcell, ...styles.cellRight}}>UNIT COST</Text>
                <Text style={{...styles.hcell, ...styles.cellRight}}>SELL PRICE</Text>
            </View>
            {inputs.products.map((p: Product, i: number) => (
                <View key={p.id} style={i === inputs.products.length - 1 ? styles.row_last : styles.row}>
                    <Text style={styles.cell_wide}>{safeString(p.productName)}</Text>
                    <Text style={{...styles.cell, ...styles.cellRight}}>{safeCurrency(p.unitCost, currency)}</Text>
                    <Text style={{...styles.cell, ...styles.cellRight}}>{safeCurrency(p.sellPrice, currency)}</Text>
                </View>
            ))}
        </View>
        <PageNumber pageNumber={2} totalPages={5} />
      </Page>
      
      {/* Page 3: Revenue */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Revenue Breakdown</Text>
        <Text style={styles.subHeader}>Performance by Product</Text>
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.hcell_wide}>PRODUCT</Text>
                <Text style={{...styles.hcell, ...styles.cellRight}}>UNITS SOLD</Text>
                <Text style={{...styles.hcell, ...styles.cellRight}}>TOTAL REVENUE</Text>
            </View>
            {revenueSummary.productBreakdown.map((p, i) => (
                <View key={p.name} style={i === revenueSummary.productBreakdown.length - 1 ? styles.row_last : styles.row}>
                    <Text style={styles.cell_wide}>{safeString(p.name)}</Text>
                    <Text style={{...styles.cell, ...styles.cellRight}}>{safeNumber(p.totalSoldUnits)}</Text>
                    <Text style={{...styles.cell, ...styles.cellRight}}>{safeCurrency(p.totalRevenue, currency)}</Text>
                </View>
            ))}
        </View>
        <PageNumber pageNumber={3} totalPages={5} />
      </Page>

      {/* Page 4: Costs */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Costs</Text>
        <Text style={styles.subHeader}>Fixed Costs Breakdown</Text>
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.hcell_wide}>NAME</Text>
                <Text style={styles.hcell}>TYPE</Text>
                <Text style={{...styles.hcell, ...styles.cellRight}}>AMOUNT</Text>
                <Text style={styles.hcell}>SCHEDULE</Text>
            </View>
             {costSummary.fixedCosts.map((c: FixedCostItem, i: number) => (
                <View key={c.id} style={i === costSummary.fixedCosts.length - 1 ? styles.row_last : styles.row}>
                    <Text style={styles.cell_wide}>{safeString(c.name)}</Text>
                    <Text style={styles.cell}>{safeString(c.costType)}</Text>
                    <Text style={{...styles.cell, ...styles.cellRight}}>{safeCurrency(c.amount, currency)}</Text>
                    <Text style={styles.cell}>{safeString(c.paymentSchedule)}</Text>
                </View>
            ))}
        </View>
        <PageNumber pageNumber={4} totalPages={5} />
      </Page>
      
      {/* Page 5: Profits */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Profits</Text>
        <Text style={styles.subHeader}>Key Profit Metrics</Text>
        <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL GROSS PROFIT</Text>
                <Text style={{...styles.kpiValue, color: profitSummary.totalGrossProfit > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safeCurrency(profitSummary.totalGrossProfit, currency)}
                </Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL NET PROFIT</Text>
                 <Text style={{...styles.kpiValue, color: profitSummary.totalNetProfit > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safeCurrency(profitSummary.totalNetProfit, currency)}
                </Text>
            </View>
             <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>GROSS MARGIN</Text>
                <Text style={{...styles.kpiValue, color: profitSummary.grossMargin > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safePercent(profitSummary.grossMargin)}
                </Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>NET MARGIN</Text>
                <Text style={{...styles.kpiValue, color: profitSummary.netMargin > 0 ? ACCENT_GREEN : DANGER_RED }}>
                    {safePercent(profitSummary.netMargin)}
                </Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PROFIT BREAK-EVEN</Text>
                <Text style={styles.kpiValue}>
                    {profitSummary.breakEvenMonth ? `${safeString(profitSummary.breakEvenMonth)} Months` : 'N/A'}
                </Text>
            </View>
        </View>
        <PageNumber pageNumber={5} totalPages={5} />
      </Page>
    </Document>
  );
}
