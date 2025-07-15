
import { z } from 'zod';

// --- Section A: Product ---
export const ProductSchema = z.object({
  id: z.string(), 
  productName: z.string({ required_error: 'Product name is required.' }).min(1, 'Product name is required.'),
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(0),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0),
  sellPrice: z.number({ required_error: 'Sell price is required.' }).min(0),
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
    paymentSchedule: z.enum(['Monthly', 'Quarterly', 'Up-Front', 'Custom']).optional(),
    startMonth: z.number().optional(),
    endMonth: z.number().optional(),
    splitRule: z.array(z.number()).optional(),
    linkToSalesModel: z.boolean().optional(),
});
export type FixedCostItem = z.infer<typeof FixedCostItemSchema>;

export const FixedCostsSchema = z.object({
  items: z.array(FixedCostItemSchema),
  planningBuffer: z.number().min(0).max(100),
});
export type FixedCosts = z.infer<typeof FixedCostsSchema>;


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
  fixedCosts: FixedCostsSchema,
  parameters: ParametersSchema,
  realtime: RealtimeSettingsSchema,
});
export type EngineInput = z.infer<typeof EngineInputSchema>;


// --- Engine Output Schemas ---

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
    planningBuffer: z.number(),
    variableCosts: z.array(VariableCostBreakdownSchema),
    totalDepositsPaid: z.number(),
    totalFinalPayments: z.number(),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

export const MonthlyCostSchema = z.object({
    month: z.number(),
    deposits: z.number(),
    finalPayments: z.number(),
    fixed: z.number(),
    total: z.number(),
});
export type MonthlyCost = z.infer<typeof MonthlyCostSchema>;

// This will eventually hold all calculation results
export const EngineOutputSchema = z.object({
    costSummary: CostSummarySchema,
    monthlyCosts: z.array(MonthlyCostSchema),
    // revenueSummary, monthlyRevenue, etc. will go here later
});
export type EngineOutput = z.infer<typeof EngineOutputSchema>;
