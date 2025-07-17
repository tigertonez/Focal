import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '@/lib/types';

const FG = '#333333';
const BORDER = '#e5e5e5';
const BG = '#f4f4f4';
const PRIMARY = '#3b82f6';
const RED = '#ef4444';
const GREEN = '#22c55e';

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
  hcell: { flex: 1, padding: 5, backgroundColor: BG, fontFamily: 'Helvetica-Bold' },
  cell:  { flex: 1, padding: 5 },
  cellRight: { flex: 1, padding: 5, textAlign: 'right' },
});

const safeString = (v: any) => String(v ?? '-');
const safeCurrency = (v: any, currency: string = 'USD') => {
    const num = Number(v);
    if (isNaN(num)) return '-';
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${num.toFixed(2)}`;
};
const safePercent = (v: any) => {
    const num = Number(v);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)}%`;
};


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
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Financial Summary</Text>
        <View style={styles.kpiRow}>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Total Revenue</Text><Text style={styles.kpiVal}>{safeCurrency(revenueSummary.totalRevenue, currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Total Costs</Text><Text style={styles.kpiVal}>{safeCurrency(costSummary.totalOperating, currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Gross Profit</Text><Text style={styles.kpiVal}>{safeCurrency(profitSummary.totalGrossProfit, currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Ending Cash</Text><Text style={styles.kpiVal}>{safeCurrency(cashFlowSummary.endingCashBalance, currency)}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Profit Break-Even</Text><Text style={styles.kpiVal}>{profitSummary.breakEvenMonth ? `${profitSummary.breakEvenMonth} Months` : 'N/A'}</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiLab}>Funding Need</Text><Text style={styles.kpiVal}>{safeCurrency(cashFlowSummary.peakFundingNeed, currency)}</Text></View>
        </View>
      </Page>

      {/* Page 2: Inputs */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Forecast Inputs</Text>
        <Text style={styles.subHeader}>Products & Services</Text>
        <View style={styles.table}>
            <View style={styles.row}>
                <Text style={{...styles.hcell, flex: 2}}>Product</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Units</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Unit Cost</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Sell Price</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Sell-Thru</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Deposit</Text>
            </View>
            {inputs.products.map(p => (
                <View key={p.id} style={styles.row}>
                    <Text style={{...styles.cell, flex: 2}}>{safeString(p.productName)}</Text>
                    <Text style={styles.cellRight}>{safeString(p.plannedUnits)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.unitCost, currency)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.sellPrice, currency)}</Text>
                    <Text style={styles.cellRight}>{safePercent(p.sellThrough)}</Text>
                    <Text style={styles.cellRight}>{safePercent(p.depositPct)}</Text>
                </View>
            ))}
        </View>
         <Text style={styles.subHeader}>Fixed Costs</Text>
        <View style={styles.table}>
            <View style={styles.row}>
                <Text style={{...styles.hcell, flex: 3}}>Cost Name</Text>
                <Text style={{...styles.hcell, flex: 2, textAlign: 'right'}}>Amount</Text>
                <Text style={{...styles.hcell, flex: 2}}>Schedule</Text>
            </View>
            {inputs.fixedCosts.map(c => (
                <View key={c.id} style={styles.row}>
                    <Text style={{...styles.cell, flex: 3}}>{safeString(c.name)}</Text>
                    <Text style={{...styles.cell, flex: 2, textAlign: 'right'}}>{`${safeCurrency(c.amount, currency)} (${c.costType === 'Monthly Cost' ? 'p/m' : 'total'})`}</Text>
                    <Text style={{...styles.cell, flex: 2}}>{safeString(c.paymentSchedule)}</Text>
                </View>
            ))}
        </View>
      </Page>
    </Document>
  );
}
