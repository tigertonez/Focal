import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

/* Single export – _named_ function (not async, not default) */
export function ReportDocument() {
  const safe  = (v: any) => String(v ?? '-');

  /* HEX colours only */
  const FG     = '#333333';
  const BORDER = '#e5e5e5';
  const BG     = '#f4f4f4';

  const styles = StyleSheet.create({
    page:   { padding: 30, fontSize: 9, fontFamily: 'Helvetica', color: FG },
    header: { fontSize: 18, marginBottom: 12, fontWeight: 'bold' },

    kpiRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    kpiCard: { width: 110, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 8 },
    kpiLab:  { fontSize: 7, marginBottom: 2, color: FG },
    kpiVal:  { fontSize: 11, fontWeight: 'bold' },

    table: { display: 'flex', borderWidth: 1, borderColor: BORDER, borderRadius: 3 },
    row:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
    hcell: { flex: 1, padding: 4, backgroundColor: BG, fontWeight: 'bold' },
    cell:  { flex: 1, padding: 4 }
  });

  /* tiny hard-coded mock numbers just to render */
  const mock = { Revenue: 290625, Costs: 164750, Profit: 262578, Cash: 100059 };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Summary (mock)</Text>
        <View style={styles.kpiRow}>
          {Object.entries(mock).map(([k, v]) => (
            <View key={k} style={styles.kpiCard}>
              <Text style={styles.kpiLab}>{safe(k)}</Text>
              <Text style={styles.kpiVal}>{safe(v)}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Inputs (mock)</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.hcell}>Product</Text>
            <Text style={styles.hcell}>Units</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell}>Widget A</Text>
            <Text style={styles.cell}>{safe(1250)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
