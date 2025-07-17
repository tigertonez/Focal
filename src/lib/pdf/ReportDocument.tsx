import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

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
  hcell: { flex: 1, padding: 5, backgroundColor: BG, fontFamily: 'Helvetica-Bold' },
  cell:  { flex: 1, padding: 5 },
  cellRight: { flex: 1, padding: 5, textAlign: 'right' },
});

const safeString = (v: any) => String(v ?? '-');
const safeCurrency = (v: any) => {
    const num = Number(v);
    if (isNaN(num)) return '-';
    return `$${num.toFixed(2)}`;
};
const safePercent = (v: any) => {
    const num = Number(v);
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)}%`;
};

/* Named export, plain React component */
export function ReportDocument({ data }: { data: any }) {

  if (!data) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Report Error</Text>
          <Text>No valid forecast data was provided to generate the report.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{safeString(data.title)}</Text>
        <Text style={styles.subHeader}>KPI Summary</Text>
        <View style={styles.kpiRow}>
            {data.kpis.map((kpi: any) => (
               <View key={safeString(kpi.label)} style={styles.kpiCard}>
                 <Text style={styles.kpiLab}>{safeString(kpi.label).toUpperCase()}</Text>
                 <Text style={styles.kpiVal}>{kpi.label.includes('Need') ? safeCurrency(kpi.value) : safeString(kpi.value)}</Text>
               </View>
            ))}
        </View>
      </Page>

      {/* Page 2: Inputs */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Inputs Sheet</Text>
        <Text style={styles.subHeader}>Products & Services</Text>
        <View style={styles.table}>
            <View style={styles.row}>
                <Text style={{...styles.hcell, flex: 3}}>Product</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Unit Cost</Text>
                <Text style={{...styles.hcell, textAlign: 'right'}}>Sell Price</Text>
            </View>
            {data.products.map((p: any) => (
                <View key={safeString(p.name)} style={styles.row}>
                    <Text style={{...styles.cell, flex: 3}}>{safeString(p.name)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.unitCost)}</Text>
                    <Text style={styles.cellRight}>{safeCurrency(p.sellPrice)}</Text>
                </View>
            ))}
        </View>
      </Page>
    </Document>
  );
}
