import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

const safeString = (v: any) => String(v ?? '-');
const safeNumber = (v: any) => String(Number(v).toLocaleString() ?? '-');
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


const FG = '#333333';
const BORDER = '#e5e5e5';
const BG = '#f4f4f4';

const styles = StyleSheet.create({
  page:   { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: FG },
  header: { fontSize: 18, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  subHeader: { fontSize: 12, marginBottom: 10, fontFamily: 'Helvetica-Bold' },

  kpiRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  kpiCard: { flexGrow: 1, minWidth: 110, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 8 },
  kpiLab:  { fontSize: 7, marginBottom: 2, color: FG, fontFamily: 'Helvetica-Bold' },
  kpiVal:  { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: BORDER, borderRadius: 3, marginBottom: 20 },
  row:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  row_last: { flexDirection: 'row' },
  hcell: { flex: 1, padding: 5, backgroundColor: BG, fontFamily: 'Helvetica-Bold' },
  cell:  { flex: 1, padding: 5 },
  cellRight: { flex: 1, padding: 5, textAlign: 'right' },
});

const PdfStub = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Report Error</Text>
            <Text>No valid forecast data was provided to generate the report.</Text>
        </Page>
    </Document>
);

export function ReportDocument({ inputs, data }: { inputs?: EngineInput; data?: EngineOutput }) {
  if (!inputs || !data) {
    return <PdfStub />;
  }

  const { currency } = inputs.parameters;
  const { revenueSummary, costSummary, profitSummary, cashFlowSummary } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Financial Summary</Text>
        <Text style={styles.subHeader}>Key Performance Indicators</Text>
        <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>TOTAL REVENUE</Text>
                <Text style={styles.kpiVal}>{safeCurrency(revenueSummary.totalRevenue, currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>TOTAL COSTS</Text>
                <Text style={styles.kpiVal}>{safeCurrency(costSummary.totalOperating, currency)}</Text>
            </View>
             <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>GROSS PROFIT</Text>
                <Text style={styles.kpiVal}>{safeCurrency(profitSummary.totalGrossProfit, currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>ENDING CASH</Text>
                <Text style={styles.kpiVal}>{safeCurrency(cashFlowSummary.endingCashBalance, currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>PROFIT BREAK-EVEN</Text>
                <Text style={styles.kpiVal}>{safeString(profitSummary.breakEvenMonth)} Months</Text>
            </View>
            <View style={styles.kpiCard}>
                <Text style={styles.kpiLab}>PEAK FUNDING NEED</Text>
                <Text style={styles.kpiVal}>{safeCurrency(cashFlowSummary.peakFundingNeed, currency)}</Text>
            </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Inputs Sheet</Text>
        <Text style={styles.subHeader}>Products & Services</Text>
        <View style={styles.table}>
            <View style={styles.row}>
                <Text style={{...styles.hcell, flex: 3}}>PRODUCT</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>PLANNED UNITS</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>UNIT COST</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>SELL PRICE</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>SELL-THROUGH</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>DEPOSIT</Text>
            </View>
            {inputs.products.map((p, i) => (
                <View key={p.id} style={i === inputs.products.length - 1 ? styles.row_last : styles.row}>
                    <Text style={{...styles.cell, flex: 3}}>{safeString(p.productName)}</Text>
                    <Text style={styles.cellRight}>{safeNumber(p.plannedUnits)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.unitCost, currency)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.sellPrice, currency)}</Text>
                    <Text style={styles.cellRight}>{safePercent(p.sellThrough)}</Text>
                    <Text style={styles.cellRight}>{safePercent(p.depositPct)}</Text>
                </View>
            ))}
        </View>
      </Page>
      
       <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Revenue Breakdown</Text>
        <Text style={styles.subHeader}>Performance by Product</Text>
        <View style={styles.table}>
            <View style={styles.row}>
                <Text style={{...styles.hcell, flex: 3}}>PRODUCT</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>UNITS SOLD</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>TOTAL REVENUE</Text>
            </View>
            {revenueSummary.productBreakdown.map((p, i) => (
                <View key={p.name} style={i === revenueSummary.productBreakdown.length - 1 ? styles.row_last : styles.row}>
                    <Text style={{...styles.cell, flex: 3}}>{safeString(p.name)}</Text>
                    <Text style={styles.cellRight}>{safeNumber(p.totalSoldUnits)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.totalRevenue, currency)}</Text>
                </View>
            ))}
        </View>
      </Page>

    </Document>
  );
}
