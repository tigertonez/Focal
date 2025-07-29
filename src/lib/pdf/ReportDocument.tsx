import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

interface ReportDocumentProps {
    imageDataUri: string;
}

/* Single export – _named_ function (not async, not default) */
export function ReportDocument({ imageDataUri }: ReportDocumentProps) {

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="portrait">
        <Image style={styles.image} src={imageDataUri} />
      </Page>
    </Document>
  );
}
