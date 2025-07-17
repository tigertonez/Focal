'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import type { EngineInput, EngineOutput } from '@/lib/types';

/* Generates a Buffer directly from live data */
export async function buildPdfBuffer({
  inputs,
  data,
}: {
  inputs: EngineInput;
  data: EngineOutput;
}): Promise<Buffer> {
  try {
    const buffer = await pdf(<ReportDocument inputs={inputs} data={data} />).toBuffer();
    return buffer;
  } catch (e: any) {
    console.error('PDF-BUILD-FAIL', e);
    throw e;
  }
}
