
import { z } from 'zod';

// --- Product ---
export const ProductSchema = z.object({
  id: z.string().default(() => `prod_${crypto.randomUUID()}`),
  name: z.string().default(''), // Allow empty string initially
  sku: z.string().optional(),
  moqUnits: z.number().min(0).default(0),
  unitCost: z.number().min(0).default(0),
  sellPrice: z.number().min(0).default(0),
  strategy: z.enum(['launch', 'lifter', 'filler']).default('launch'),
  sellThrough: z.number().min(0).max(100).default(100),
  depositPaid: z.number().min(0).max(100).default(0),
});
export type Product = z.infer<typeof ProductSchema>;

// --- Fixed Costs ---
export const FixedCostsSchema = z.object({
  samplesOrPrototypes: z.number().min(0).default(0),
  equipment: z.number().min(0).default(0),
  setupAndCompliance: z.number().min(0).default(0),
  marketingBudget: z.number().min(0).default(0),
});
export type FixedCosts = z.infer<typeof FixedCostsSchema>;

// --- Parameters ---
export const ParametersSchema = z.object({
  forecastMonths: z.number().min(1).max(120).default(24),
  taxRate: z.number().min(0).max(100).default(20),
  planningBufferPct: z.number().min(0).max(100).default(15),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  preOrderMode: z.boolean().default(false),
});
export type Parameters = z.infer<typeof ParametersSchema>;


// --- Realtime Settings ---
export const RealtimeSettingsSchema = z.object({
  dataSource: z.enum(['manual', 'google_sheets', 'shopify']).default('manual'),
  apiKeyEncrypted: z.string().optional(),
  syncIntervalMin: z.number().min(5).default(60),
  timezone: z.string().default('UTC'),
  llmAssistToggle: z.boolean().default(true),
});
export type RealtimeSettings = z.infer<typeof RealtimeSettingsSchema>;


// --- Main Input Schema ---
export const EngineInputSchema = z.object({
  products: z.array(ProductSchema).default([{...ProductSchema.parse({})}]),
  fixedCosts: FixedCostsSchema.default({}),
  parameters: ParametersSchema.default({}),
  realtime: RealtimeSettingsSchema.default({}),
  readyForCalc: z.boolean().default(false),
});
export type EngineInput = z.infer<typeof EngineInputSchema>;


// --- Engine Output (Placeholder) ---
// This will be expanded in later phases.
export interface EngineOutput {
  status: 'success' | 'error';
  message?: string;
  // KPIs will be added here
}
