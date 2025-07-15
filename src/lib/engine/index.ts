
import { type EngineInput, type EngineSettings, type EngineOutput } from '@/lib/types';
import { calculateRevenue } from './revenue';
import { calculateCosts } from './costs';
import { calculateFinancials, calculateKpis } from './financials';

export function calculateForecast(
  inputs: EngineInput,
  settings: EngineSettings
): EngineOutput {
  // TODO: Implement full engine logic
  // This is a stub that respects the function signature and output shape.

  const revenue = calculateRevenue(inputs, settings);
  const { fixed, variable, total: totalCosts } = calculateCosts(inputs, settings, revenue);
  const { profit, cash, health } = calculateFinancials(inputs, settings, revenue, totalCosts);
  const kpis = calculateKpis(inputs, settings, revenue, totalCosts, profit);

  return {
    revenue,
    costs: {
      fixed,
      variable,
      total: totalCosts,
    },
    profit,
    cash,
    kpis,
    health,
  };
}
