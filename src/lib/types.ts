
export type SalesCurve = 'drop-launch' | 'even' | 'steady' | 'seasonal';

export type FixedCost = {
  name: string;
  amount: number;
};

export interface EngineInput {
  productName: string;
  launchMonth: string; // YYYY-MM-DD
  horizonMonths: number;
  preOrderMonth0: boolean;
  initialSales: number;
  salesCurve: SalesCurve;
  price: number;
  cogsPercentage: number;
  posChannelEnabled: boolean;
  posSalesPercentage: number;
  fixedCosts: FixedCost[];
}

export interface EngineSettings {
  planningBuffer: number; // Percentage
  taxRate: number; // Percentage
}

export interface EngineOutput {
  revenue: number[];
  costs: {
    fixed: number[];
    variable: number[];
    total: number[];
  };
  profit: {
    gross: number[];
    operating: number[];
    net: number[];
  };
  cash: number[];
  kpis: {
    grossMargin: number;
    netProfitMargin: number;
    ltv: number; // Lifetime Value
    cac: number; // Customer Acquisition Cost
    breakEvenMonth: number | null;
  };
  health: {
    cashRunwayMonths: number | null;
    isProfitable: boolean;
  };
}
