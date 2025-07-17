'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import type { EngineInput, EngineOutput } from '../types';

/* Generates a Buffer directly – no streams */
export async function buildPdfBuffer({ inputs, data }: { inputs: EngineInput, data: EngineOutput }): Promise<Buffer> {
  try {
    console.log('PDF-BUILD-START: Generating PDF with live data.');
    const buffer = await pdf(<ReportDocument inputs={inputs} data={data} />).toBuffer();
    console.log('PDF-BUILD-SUCCESS: PDF buffer created.');
    return buffer;
  } catch (e: any) {
    console.error('PDF-BUILD-FAIL', e);
    throw e;
  }
}
