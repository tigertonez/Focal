import { z } from 'zod';

// --- Section A: Product ---
export const ProductSchema = z.object({
  id: z.string(), 
  productName: z.string({ required_error: 'Product name is required.' }).min(1, 'Product name is required.'),
  // Make forecast-specific fields optional
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(0).optional(),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0),
  sellPrice: z.number({ required_error: 'Sales price is required.' }).min(0),
  salesModel: z.enum(['launch', 'even', 'seasonal', 'growth'], { required_error: 'Sales model is required.' }).optional(),
  sellThrough: z.number({ required_error: 'Sell-through is required.' }).min(0).max(100).optional(),
  depositPct: z.number({ required_error: 'Deposit % is required.' }).min(0).max(100),
  color: z.string().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Section B: Fixed Costs ---
export const FixedCostItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Cost name is required.'),
    amount: z.number().min(0, 'Amount must be positive.'),
    paymentSchedule: z.enum(['Allocated Monthly', 'Allocated Quarterly', 'Paid Up-Front', 'Allocated According to Sales']),
    costType: z.enum(['Total for Period', 'Monthly Cost']).default('Total for Period'),
    startMonth: z.enum(['Up-front', 'Month 0', 'Month 1']).default('Month 1'),
    color: z.string().optional(),
});
export type FixedCostItem = z.infer<typeof FixedCostItemSchema>;


// --- Section C: General Parameters ---
export const ParametersSchema = z.object({
  forecastMonths: z.number().min(1).max(36),
  taxRate: z.number().min(0).max(100),
  currency: z.enum(['EUR', 'USD']),
  preOrder: z.boolean(),
});
export type Parameters = z.infer<typeof ParametersSchema>;

// --- Section D: Realtime Settings ---
export const RealtimeSettingsSchema = z.object({
  dataSource: z.enum(['Manual', 'Shopify', 'CSV']),
  apiKey: z.string().optional(),
  timezone: z.string(),
});
export type RealtimeSettings = z.infer<typeof RealtimeSettingsSchema>;


// --- Main Input Schema for Validation ---
export const EngineInputSchema = z.object({
  products: z.array(ProductSchema).min(1, { message: 'At least one product is required.' }),
  fixedCosts: z.array(FixedCostItemSchema),
  parameters: ParametersSchema,
  realtime: RealtimeSettingsSchema,
});
export type EngineInput = z.infer<typeof EngineInputSchema>;


// --- Engine Output Schemas ---

// Cost-related schemas
export const VariableCostBreakdownSchema = z.object({
    name: z.string(),
    plannedUnits: z.number(),
    unitCost: z.number(),
    totalProductionCost: z.number(),
    depositPaid: z.number(),
    remainingCost: z.number(),
});

export const CostSummarySchema = z.object({
    totalFixed: z.number(),
    totalVariable: z.number(),
    totalOperating: z.number(),
    avgCostPerUnit: z.number(),
    fixedCosts: z.array(FixedCostItemSchema),
    variableCosts: z.array(VariableCostBreakdownSchema),
    totalDepositsPaid: z.number(),
    totalFinalPayments: z.number(),
    cogsOfUnsoldGoods: z.number(),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

export const MonthlyCostSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyCost = z.infer<typeof MonthlyCostSchema>;

// Revenue-related schemas
export const RevenueProductBreakdownSchema = z.object({
    name: z.string(),
    totalRevenue: z.number(),
    totalSoldUnits: z.number(),
});
export type RevenueProductBreakdown = z.infer<typeof RevenueProductBreakdownSchema>;

export const RevenueSummarySchema = z.object({
    totalRevenue: z.number(),
    avgRevenuePerUnit: z.number(),
    totalSoldUnits: z.number(),
    productBreakdown: z.array(RevenueProductBreakdownSchema),
    ltv: z.number(), // Placeholder for future implementation
    cac: z.number(), // Placeholder for future implementation
});
export type RevenueSummary = z.infer<typeof RevenueSummarySchema>;

export const MonthlyRevenueSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyRevenue = z.infer<typeof MonthlyRevenueSchema>;

export const MonthlyUnitsSoldSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyUnitsSold = z.infer<typeof MonthlyUnitsSoldSchema>;


// Profit-related schemas
export const ProfitSummarySchema = z.object({
    totalGrossProfit: z.number(),
    totalOperatingProfit: z.number(),
    totalNetProfit: z.number(),
    grossMargin: z.number(),
    operatingMargin: z.number(),
    netMargin: z.number(),
    breakEvenMonth: z.number().nullable(),
});
export type ProfitSummary = z.infer<typeof ProfitSummarySchema>;

export const MonthlyProfitSchema = z.object({
  month: z.number(),
  grossProfit: z.number(),
  operatingProfit: z.number(),
  netProfit: z.number(),
});
export type MonthlyProfit = z.infer<typeof MonthlyProfitSchema>;

// Cash-Flow-related schemas
export const CashFlowSummarySchema = z.object({
    endingCashBalance: z.number(),
    potentialCashBalance: z.number(),
    peakFundingNeed: z.number(),
    runway: z.number(),
    breakEvenMonth: z.number().nullable(),
});
export type CashFlowSummary = z.infer<typeof CashFlowSummarySchema>;

export const MonthlyCashFlowSchema = z.object({
  month: z.number(),
  netCashFlow: z.number(),
  cumulativeCash: z.number(),
});
export type MonthlyCashFlow = z.infer<typeof MonthlyCashFlowSchema>;


// --- AI-related Schemas ---

export const AnalyzeProfitabilityInputSchema = z.object({
  revenueSummary: RevenueSummarySchema,
  costSummary: CostSummarySchema,
  profitSummary: ProfitSummarySchema,
  currency: z.string(),
});
export type AnalyzeProfitabilityInput = z.infer<
  typeof AnalyzeProfitabilityInputSchema
>;

export const AnalyzeProfitabilityOutputSchema = z.object({
  keyFacts: z.array(z.string()).describe("A list of the top 3 most critical numbers a shop owner must know."),
  strengths: z.array(z.string()).describe("A bulleted list of the biggest strengths and positive drivers."),
  weaknesses: z.array(z.string()).describe("A bulleted list of the 1-2 biggest weaknesses or areas holding back profit."),
  recommendations: z.array(z.string()).describe("A bulleted list of 2-3 highly specific, actionable recommendations."),
});
export type AnalyzeProfitabilityOutput = z.infer<
  typeof AnalyzeProfitabilityOutputSchema
>;


// --- Main Engine Output Schema ---
// This is the single source of truth for all calculated financial data
export const EngineOutputSchema = z.object({
    costSummary: CostSummarySchema,
    monthlyCosts: z.array(MonthlyCostSchema),
    revenueSummary: RevenueSummarySchema,
    monthlyRevenue: z.array(MonthlyRevenueSchema),
    monthlyUnitsSold: z.array(MonthlyUnitsSoldSchema),
    profitSummary: ProfitSummarySchema,
    monthlyProfit: z.array(MonthlyProfitSchema),
    cashFlowSummary: CashFlowSummarySchema,
    monthlyCashFlow: z.array(MonthlyCashFlowSchema),
});
export type EngineOutput = z.infer<typeof EngineOutputSchema>;
