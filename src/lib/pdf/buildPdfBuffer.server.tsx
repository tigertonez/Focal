'use server';

import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import type { EngineInput, EngineOutput } from '../types';

/** returns Buffer with a real-looking PDF using mock data */
export async function buildPdfBuffer(): Promise<Buffer> {
  try {
    // Create mock data to ensure the document renders without live data.
    const mockInputs: EngineInput = {
      products: [
        { id: 'p1', productName: 'Pro Widget', plannedUnits: 1000, unitCost: 10, sellPrice: 50, sellThrough: 80, depositPct: 20, color: '#2563eb' },
        { id: 'p2', productName: 'Basic Widget', plannedUnits: 5000, unitCost: 5, sellPrice: 25, sellThrough: 95, depositPct: 10, color: '#0d9488' },
      ],
      fixedCosts: [],
      parameters: {
        forecastMonths: 12,
        taxRate: 20,
        currency: 'USD',
        preOrder: true,
      },
      realtime: {
        dataSource: 'Manual',
        apiKey: '',
        timezone: 'UTC',
      }
    };

    const mockData: EngineOutput = {
      revenueSummary: { totalRevenue: 150000, avgRevenuePerUnit: 30, totalSoldUnits: 5000, productBreakdown: [], ltv: 0, cac: 0 },
      costSummary: { totalFixed: 60000, totalVariable: 75000, totalOperating: 135000, avgCostPerUnit: 15, fixedCosts: [], variableCosts: [], totalDepositsPaid: 0, totalFinalPayments: 0, cogsOfUnsoldGoods: 0 },
      profitSummary: { totalGrossProfit: 75000, totalOperatingProfit: 15000, totalNetProfit: 12000, grossMargin: 50, operatingMargin: 10, netMargin: 8, breakEvenMonth: 8 },
      cashFlowSummary: { endingCashBalance: 25000, peakFundingNeed: 15000, breakEvenMonth: 9, runway: 4, potentialCashBalance: 40000 },
      monthlyRevenue: [],
      monthlyUnitsSold: [],
      monthlyCosts: [],
      monthlyProfit: [],
      monthlyCashFlow: [],
      businessHealth: {
          score: 75,
          insights: [],
          alerts: [],
          kpis: []
      }
    };

    const doc = ReportDocument({ inputs: mockInputs, data: mockData });

    return pdf(doc).toBuffer();
  } catch (e) {
    console.error('PDF-BUILD-FAIL', e);
    throw e;
  }
}
