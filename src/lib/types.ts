
import { z } from 'zod';

// --- Section A: Product ---
export const ProductSchema = z.object({
  id: z.string(), 
  productName: z.string({ required_error: 'Product name is required.' }).min(1, 'Product name is required.'),
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(0),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0),
  sellPrice: z.number({ required_error: 'Sales price is required.' }).min(0),
  salesModel: z.enum(['launch', 'even', 'seasonal', 'growth'], { required_error: 'Sales model is required.' }),
  sellThrough: z.number({ required_error: 'Sell-through is required.' }).min(0).max(100),
  depositPct: z.number({ required_error: 'Deposit % is required.' }).min(0).max(100),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Section B: Fixed Costs ---
export const FixedCostItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Cost name is required.'),
    amount: z.number().min(0, 'Amount must be positive.'),
    paymentSchedule: z.enum(['Allocated Monthly', 'Allocated Quarterly', 'Paid Up-Front', 'Allocated According to Sales']),
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
    planningBuffer: z.number().optional(),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

export const MonthlyCostSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyCost = z.infer<typeof MonthlyCostSchema>;

// Revenue-related schemas (placeholders)
export const RevenueSummarySchema = z.object({
    totalRevenue: z.number(),
    avgRevenuePerUnit: z.number(),
    ltv: z.number(),
    cac: z.number(),
});
export type RevenueSummary = z.infer<typeof RevenueSummarySchema>;

export const MonthlyRevenueSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyRevenue = z.infer<typeof MonthlyRevenueSchema>;

// Profit-related schemas (placeholders)
export const ProfitSummarySchema = z.object({
    grossProfit: z.number(),
    operatingProfit: z.number(),
    netProfit: z.number(),
});
export type ProfitSummary = z.infer<typeof ProfitSummarySchema>;

export const MonthlyProfitSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyProfit = z.infer<typeof MonthlyProfitSchema>;

// Cash-Flow-related schemas (placeholders)
export const CashFlowSummarySchema = z.object({
    endingCashBalance: z.number(),
    runway: z.number(),
});
export type CashFlowSummary = z.infer<typeof CashFlowSummarySchema>;

export const MonthlyCashFlowSchema = z.object({
  month: z.number(),
}).catchall(z.number());
export type MonthlyCashFlow = z.infer<typeof MonthlyCashFlowSchema>;


// This is the single source of truth for all calculated financial data
export const EngineOutputSchema = z.object({
    costSummary: CostSummarySchema,
    monthlyCosts: z.array(MonthlyCostSchema),
    revenueSummary: RevenueSummarySchema,
    monthlyRevenue: z.array(MonthlyRevenueSchema),
    profitSummary: ProfitSummarySchema,
    monthlyProfit: z.array(MonthlyProfitSchema),
    cashFlowSummary: CashFlowSummarySchema,
    monthlyCashFlow: z.array(MonthlyCashFlowSchema),
});
export type EngineOutput = z.infer<typeof EngineOutputSchema>;
