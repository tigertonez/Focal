
'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';

interface BuildPdfProps {
  imageDataUri: string;
}

/* Generates a Buffer directly – no streams */
export async function buildPdfBuffer({ imageDataUri }: BuildPdfProps): Promise<Buffer> {
  return await pdf(<ReportDocument imageDataUri={imageDataUri} />).toBuffer();
}
