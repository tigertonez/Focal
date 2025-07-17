'use server';

import { pdf } from '@react-pdf/renderer';
import ReportDocument from './ReportDocument';
import type { EngineInput, EngineOutput } from '@/lib/types';


const mockInputs: EngineInput = {
  products: [
    {
      id: 'prod_mock_1',
      productName: 'Pro Widget',
      plannedUnits: 1250,
      unitCost: 10,
      sellPrice: 90,
      salesModel: 'launch',
      sellThrough: 80,
      depositPct: 25,
    },
    {
      id: 'prod_mock_2',
      productName: 'Basic Widget',
      plannedUnits: 2500,
      unitCost: 5,
      sellPrice: 45,
      salesModel: 'even',
      sellThrough: 95,
      depositPct: 10,
    },
  ],
  fixedCosts: [
      { id: 'fc_mock_0', name: 'Salaries', amount: 8000, paymentSchedule: 'Allocated Monthly', costType: 'Monthly Cost', startMonth: 'Month 1' },
      { id: 'fc_mock_1', name: 'Marketing', amount: 15000, paymentSchedule: 'Allocated According to Sales', costType: 'Total for Period', startMonth: 'Month 1' },
  ],
  parameters: {
    forecastMonths: 12,
    taxRate: 20,
    currency: 'EUR',
    preOrder: true,
  },
  realtime: {
    dataSource: 'Manual',
    apiKey: '',
    timezone: 'UTC',
  },
};

const mockData: EngineOutput = {
    revenueSummary: { totalRevenue: 546250, avgRevenuePerUnit: 173.41, totalSoldUnits: 3150, productBreakdown: [], ltv: 0, cac: 0 },
    costSummary: { totalFixed: 126000, totalVariable: 37500, totalOperating: 163500, avgCostPerUnit: 10, totalDepositsPaid: 0, totalFinalPayments: 0, cogsOfUnsoldGoods: 0, fixedCosts: [], variableCosts: [] },
    profitSummary: { totalGrossProfit: 514750, totalOperatingProfit: 388750, totalNetProfit: 311000, grossMargin: 0, operatingMargin: 0, netMargin: 0, breakEvenMonth: 2 },
    cashFlowSummary: { endingCashBalance: 311000, potentialCashBalance: 0, peakFundingNeed: 15250, runway: 0, breakEvenMonth: 3 },
    monthlyRevenue: [],
    monthlyCosts: [],
    monthlyUnitsSold: [],
    monthlyProfit: [],
    monthlyCashFlow: []
};


/** returns Buffer with two-page stub */
export async function buildPdfBuffer(): Promise<Buffer> {
  try {
    return pdf(<ReportDocument inputs={mockInputs} data={mockData} />).toBuffer();
  } catch(e: any) {
    console.error('PDF-BUILD-FAIL', e);
    throw e;
  }
}
