
import { z } from 'zod';

// --- Section A: Product ---
export const ProductSchema = z.object({
  id: z.string().default(''), // Default is empty, will be set via crypto.randomUUID() on client
  productName: z.string({ required_error: 'Product name is required.' }).default(''),
  plannedUnits: z.number({ required_error: 'Planned units are required.' }).min(1).default(1000),
  unitCost: z.number({ required_error: 'Unit cost is required.' }).min(0).default(10),
  sellPrice: z.number({ required_error: 'Sell price is required.' }).min(0).default(25),
  salesModel: z.enum(['launch', 'even', 'seasonal', 'growth'], { required_error: 'Sales model is required.' }).default('launch'),
  sellThrough: z.number({ required_error: 'Sell-through is required.' }).min(0).max(100).default(80),
  depositPct: z.number({ required_error: 'Deposit % is required.' }).min(0).max(100).default(0),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Section B: Fixed Costs ---
export const FixedCostsSchema = z.object({
  samples: z.number().min(0).default(0),
  equipment: z.number().min(0).default(0),
  setup: z.number().min(0).default(0),
  marketing: z.number().min(0).default(0),
});
export type FixedCosts = z.infer<typeof FixedCostsSchema>;

// --- Section C: General Parameters ---
export const ParametersSchema = z.object({
  forecastMonths: z.number().min(1).max(36).default(12),
  taxRate: z.number().min(0).max(100).default(20),
  planningBuffer: z.number().min(0).max(100).default(15),
  currency: z.enum(['EUR', 'USD']).default('USD'),
  preOrder: z.boolean().default(false),
});
export type Parameters = z.infer<typeof ParametersSchema>;

// --- Section D: Realtime Settings ---
export const RealtimeSettingsSchema = z.object({
  dataSource: z.enum(['Manual', 'Shopify', 'CSV']).default('Manual'),
  apiKey: z.string().optional(),
  timezone: z.string().default('UTC'),
});
export type RealtimeSettings = z.infer<typeof RealtimeSettingsSchema>;


// --- Main Input Schema for Validation ---
export const EngineInputSchema = z.object({
  products: z.array(ProductSchema.extend({
      productName: z.string().min(1, 'Product name is required.'),
  })).min(1, { message: 'At least one product is required.' }),
  fixedCosts: FixedCostsSchema,
  parameters: ParametersSchema,
  realtime: RealtimeSettingsSchema,
});
export type EngineInput = z.infer<typeof EngineInputSchema>;
