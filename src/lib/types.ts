
import { z } from 'zod';

// --- Section A: Product ---
export const ProductSchema = z.object({
  id: z.string(), 
  productName: z.string({ required_error: 'Product name is required.' }).min(1, 'Product name is required.'),
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(1),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0),
  sellPrice: z.number({ required_error: 'Sell price is required.' }).min(0),
  salesModel: z.enum(['launch', 'even', 'seasonal', 'growth'], { required_error: 'Sales model is required.' }),
  sellThrough: z.number({ required_error: 'Sell-through is required.' }).min(0).max(100),
  depositPct: z.number({ required_error: 'Deposit % is required.' }).min(0).max(100),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Section B: Fixed Costs (Now Dynamic) ---
export const FixedCostItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Cost name is required.'),
    amount: z.number().min(0, 'Amount must be positive.'),
});
export type FixedCostItem = z.infer<typeof FixedCostItemSchema>;


// --- Section C: General Parameters ---
export const ParametersSchema = z.object({
  forecastMonths: z.number().min(1).max(36),
  taxRate: z.number().min(0).max(100),
  planningBuffer: z.number().min(0).max(100),
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
