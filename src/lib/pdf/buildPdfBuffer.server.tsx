'use server';
import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';

export async function buildPdfBuffer(): Promise<Buffer> {
  console.log('TYPE', typeof ReportDocument);
  return pdf(<ReportDocument />).toBuffer();
}
