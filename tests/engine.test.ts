
import { calculateForecast } from '@/lib/engine';
import { type EngineInput, type EngineSettings } from '@/lib/types';
import sampleData from './sample-data.json';

describe('Forecasting Engine', () => {
  it('should return the correct output shape with valid inputs', () => {
    const inputs: EngineInput = sampleData.inputs;
    const settings: EngineSettings = sampleData.settings;

    const output = calculateForecast(inputs, settings);

    // Assert that the main keys exist
    expect(output).toHaveProperty('revenue');
    expect(output).toHaveProperty('costs');
    expect(output).toHaveProperty('profit');
    expect(output).toHaveProperty('cash');
    expect(output).toHaveProperty('kpis');
    expect(output).toHaveProperty('health');

    const horizon = inputs.horizonMonths;

    // Assert array lengths
    expect(output.revenue).toHaveLength(horizon);
    expect(output.costs.fixed).toHaveLength(horizon);
    expect(output.costs.variable).toHaveLength(horizon);
    expect(output.profit).toHaveLength(horizon);
    expect(output.cash).toHaveLength(horizon);

    // Assert KPI structure
    expect(output.kpis).toHaveProperty('grossMargin');
    expect(output.kpis).toHaveProperty('netProfitMargin');
    expect(output.kpis).toHaveProperty('ltv');
    expect(output.kpis).toHaveProperty('cac');
    expect(output.kpis).toHaveProperty('breakEvenMonth');

    // Assert Health structure
    expect(output.health).toHaveProperty('cashRunwayMonths');
    expect(output.health).toHaveProperty('isProfitable');

    // Assert that cumulative cash equals operating profit before tax at horizon N
    // This is a core requirement from the prompt.
    // For now, with stubbed data, they will both be 0.
    const cumulativeCash = output.cash.reduce((acc, val) => acc + val, 0);
    const cumulativeProfit = output.profit.reduce((acc, val) => acc + val, 0);
    expect(cumulativeCash).toBeCloseTo(cumulativeProfit);
  });
});
