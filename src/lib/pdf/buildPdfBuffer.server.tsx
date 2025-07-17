'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';

/* Generates a Buffer directly – no streams */
export async function buildPdfBuffer(): Promise<Buffer> {
  const mockData = {
     title: "Mock Forecast 2025",
     kpis: [
       { label: "Total Revenue", value: 125000 },
       { label: "Total Costs", value: 72500 },
       { label: "Gross Profit", value: 52500 },
       { label: "Ending Cash", value: 18000 },
       { label: "Break-Even", value: 7 },
       { label: "Funding Need", value: 14000 }
     ],
     products: [
       { name: "Widget A", unitCost: 12.5, sellPrice: 29.9 },
       { name: "Widget B", unitCost: 9.8,  sellPrice: 24.9 },
       { name: "Widget C", unitCost: 6.0,  sellPrice: 14.5 }
     ]
   };

  try {
    const buffer = await pdf(<ReportDocument data={mockData} />).toBuffer();
    return buffer;
  } catch (e: any) {
    console.error('PDF-BUILD-FAIL', e);
    throw e;
  }
}
