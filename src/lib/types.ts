

import { z } from 'zod';

// --- Section A: Company Context ---
export const CompanyContextSchema = z.object({
  brand: z.string().optional(),
  logoDataUri: z.string().optional(),
  teamSize: z.enum(['solo', '2-5', '6-20', '>20']).optional(),
  stage: z.enum(['idea', 'launch', 'growth', 'scale']).optional(),
  production: z.enum(['preorder', 'stock', 'ondemand']).optional(),
  industry: z.enum(['fashion', 'jewelry', 'cosmetics', 'food', 'digital', 'other']).optional(),
});
export type CompanyContext = z.infer<typeof CompanyContextSchema>;


// --- Section B: Product ---
export const ProductSchema = z.object({
  id: z.string(), 
  productName: z.string({ required_error: 'Product name is required.' }).min(1, 'Product name is required.'),
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(0).optional(),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0),
  sellPrice: z.number({ required_error: 'Sales price is required.' }).min(0),
  salesModel: z.enum(['launch', 'even', 'seasonal', 'growth'], { required_error: 'Sales model is required.' }).optional(),
  sellThrough: z.number({ required_error: 'Sell-through is required.' }).min(0).max(100).optional(),
  depositPct: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Deposit must be positive.").max(100, "Deposit can't exceed 100%.")
  ).optional(),
  costModel: z.enum(['batch', 'monthly']).default('batch').optional(),
  color: z.string().optional(),
  estimatedSales: z.number().optional(),
  saleMonth: z.number().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Section C: Fixed Costs ---
export const FixedCostItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Cost name is required.'),
    amount: z.number().min(0, 'Amount must be positive.'),
    paymentSchedule: z.enum(['up_front_m0', 'monthly_from_m0', 'monthly_from_m1']),
    costType: z.enum(['Total for Period', 'Monthly Cost']).default('Total for Period'),
    color: z.string().optional(),
});
export type FixedCostItem = z.infer<typeof FixedCostItemSchema>;


// --- Section D: General Parameters ---
export const ParametersSchema = z.object({
  forecastMonths: z.number().min(1).max(36),
  taxRate: z.number().min(0).max(100),
  currency: z.enum(['EUR', 'USD']),
  accountingMethod: z.enum(['cogs', 'total_costs']).default('total_costs'),
});
export type Parameters = z.infer<typeof ParametersSchema>;

// --- Section E: Realtime Settings ---
export const RealtimeSettingsSchema = z.object({
  dataSource: z.enum(['Manual', 'Shopify', 'CSV']),
  apiKey: z.string().optional(),
  timezone: z.string(),
});
export type RealtimeSettings = z.infer<typeof RealtimeSettingsSchema>;


// --- Main Input Schema for Validation ---
export const EngineInputSchema = z.object({
  company: CompanyContextSchema.optional(),
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
    potentialGrossProfit: z.number().optional(),
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
    estimatedTaxes: z.number(),
});
export type CashFlowSummary = z.infer<typeof CashFlowSummarySchema>;

export const MonthlyCashFlowSchema = z.object({
  month: z.number(),
  netCashFlow: z.number(),
  cumulativeCash: z.number(),
});
export type MonthlyCashFlow = z.infer<typeof MonthlyCashFlowSchema>;


// Health Score Schema
export const BusinessHealthScoreKpiSchema = z.object({
  label: z.string(),
  value: z.number(), // The normalized score (0-100)
  weight: z.number(),
  tooltip: z.string(),
});
export type BusinessHealthScoreKpi = z.infer<typeof BusinessHealthScoreKpiSchema>;

export const BusinessHealthSchema = z.object({
  score: z.number(),
  kpis: z.array(BusinessHealthScoreKpiSchema),
});
export type BusinessHealth = z.infer<typeof BusinessHealthSchema>;


// --- AI-related Schemas ---

export const AnalyzeProfitabilityInputSchema = z.object({
  companyContext: CompanyContextSchema.optional(),
  revenueSummary: RevenueSummarySchema,
  costSummary: CostSummarySchema,
  profitSummary: ProfitSummarySchema,
  currency: z.string(),
  language: z.string().optional(),
});
export type AnalyzeProfitabilityInput = z.infer<
  typeof AnalyzeProfitabilityInputSchema
>;

export const AnalyzeProfitabilityOutputSchema = z.object({
  explanation: z.string().describe("A brief, beginner-friendly explanation of Gross Profit, Operating Profit, and Net Profit, including their current values and why they matter."),
  whatsWorking: z.string().optional().describe("A summary of 1-2 healthy metrics (like strong gross margin or sell-through) and the business decisions that likely led to them. If there are no clear strengths, this field should contain the single sentence 'The current plan shows areas for improvement across the board.'"),
  issues: z.string().describe("A summary of 1-2 negative or below-benchmark metrics, tying each issue directly to the numbers that prove it."),
  opportunities: z.string().describe("A summary of 1-2 concrete, data-driven suggestions for improvement, using product names where relevant."),
  topPriorities: z.string().describe("A numbered list of 3-5 actionable, founder-friendly next steps, each starting with a verb."),
});
export type AnalyzeProfitabilityOutput = z.infer<
  typeof AnalyzeProfitabilityOutputSchema
>;

export const AnalyzeRevenueInputSchema = z.object({
  companyContext: CompanyContextSchema.optional(),
  products: z.array(ProductSchema),
  revenueSummary: RevenueSummarySchema,
  currency: z.string(),
  language: z.string().optional(),
});
export type AnalyzeRevenueInput = z.infer<typeof AnalyzeRevenueInputSchema>;

export const AnalyzeRevenueOutputSchema = z.object({
  insights: z.array(z.string()).describe("A list of 2-3 key insights derived from the revenue summary."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the revenue analysis."),
});
export type AnalyzeRevenueOutput = z.infer<typeof AnalyzeRevenueOutputSchema>;

export const AnalyzeCostsInputSchema = z.object({
  companyContext: CompanyContextSchema.optional(),
  costSummary: CostSummarySchema,
  revenueSummary: RevenueSummarySchema,
  currency: z.string(),
  language: z.string().optional(),
});
export type AnalyzeCostsInput = z.infer<typeof AnalyzeCostsInputSchema>;

export const AnalyzeCostsOutputSchema = z.object({
  insights: z.array(z.string()).describe("A list of 2-3 key insights derived from the cost summary."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the cost analysis."),
});
export type AnalyzeCostsOutput = z.infer<typeof AnalyzeCostsOutputSchema>;

export const AnalyzeCashFlowInputSchema = z.object({
  companyContext: CompanyContextSchema.optional(),
  cashFlowSummary: CashFlowSummarySchema,
  currency: z.string(),
  language: z.string().optional(),
});
export type AnalyzeCashFlowInput = z.infer<typeof AnalyzeCashFlowInputSchema>;

export const AnalyzeCashFlowOutputSchema = z.object({
  insights: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).describe("An array of objects, where each object represents a key metric. The 'label' is the metric's name, and the 'value' is a string containing the bolded metric and a one-sentence interpretation."),
  recommendations: z.array(z.string()).describe("A list of 1-3 strategic recommendations based on the cash flow analysis."),
});
export type AnalyzeCashFlowOutput = z.infer<typeof AnalyzeCashFlowOutputSchema>;

export const StrategizeHealthScoreInputSchema = z.object({
  companyContext: CompanyContextSchema.optional(),
  products: z.array(ProductSchema),
  businessHealth: BusinessHealthSchema,
  revenueSummary: RevenueSummarySchema,
  costSummary: CostSummarySchema,
  profitSummary: ProfitSummarySchema,
  language: z.string().optional(),
});
export type StrategizeHealthScoreInput = z.infer<typeof StrategizeHealthScoreInputSchema>;

export const StrategizeHealthScoreOutputSchema = z.object({
  summary: z.string().describe("A concise, one-sentence summary of the business's overall financial health based on the score."),
  strengths: z.array(z.string()).describe("A bulleted list of the top 2-3 strategic strengths based on the highest-scoring KPIs."),
  opportunities: z.array(z.string()).describe("A bulleted list of the top 2-3 strategic opportunities for improvement based on the lowest-scoring KPIs."),
  risks: z.array(z.string()).describe("A bulleted list of the top 2-3 risks the business faces, identified from the health score analysis."),
});
export type StrategizeHealthScoreOutput = z.infer<typeof StrategizeHealthScoreOutputSchema>;


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
    businessHealth: BusinessHealthSchema.optional(),
});
export type EngineOutput = z.infer<typeof EngineOutputSchema>;

    
