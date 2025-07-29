'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';

/* Generates a Buffer directly – no streams */
export async function buildPdfBuffer(): Promise<Buffer> {
  return await pdf(<ReportDocument />).toBuffer();
}
