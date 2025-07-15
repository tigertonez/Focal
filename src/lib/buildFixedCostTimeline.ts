
import { FixedCostItem } from './types';

function getSalesWeights(forecastMonths: number, model: 'launch' | 'even' | 'seasonal' | 'growth'): number[] {
    let weights: number[] = Array(forecastMonths).fill(0);
    
    switch (model) {
        case 'launch':
            if (forecastMonths >= 3) {
                weights[0] = 0.6; weights[1] = 0.3; weights[2] = 0.1;
            } else if (forecastMonths === 2) {
                weights[0] = 0.7; weights[1] = 0.3;
            } else {
                weights[0] = 1;
            }
            break;
        case 'even':
            weights.fill(1 / forecastMonths);
            break;
        case 'seasonal':
            const peak = forecastMonths / 2;
            let totalWeight = 0;
            for (let i = 0; i < forecastMonths; i++) {
                const distance = Math.abs(i - peak);
                weights[i] = Math.exp(-0.1 * distance * distance);
                totalWeight += weights[i];
            }
            if (totalWeight > 0) {
                weights = weights.map(w => w / totalWeight);
            }
            break;
        case 'growth':
            const totalSteps = (forecastMonths * (forecastMonths + 1)) / 2;
             if (totalSteps > 0) {
                for (let i = 0; i < forecastMonths; i++) {
                    weights[i] = (i + 1) / totalSteps;
                }
            }
            break;
    }
    return weights;
}


export function buildFixedCostTimeline(
  fixedCosts: FixedCostItem[],
  forecastMonths: number,
  salesWeights: number[]
): number[] {
  const tl: number[] = Array(forecastMonths).fill(0);
  const add = (m: number, val: number) => { if (m >= 1 && m <= forecastMonths) tl[m - 1] += val; };

  fixedCosts.forEach(fc => {
    const A = +fc.amount;
    const schedule = fc.paymentSchedule || 'Up-Front';

    let wasLinkedToSales = false;

    // First handle marketing link if applicable
    if (fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false) {
      salesWeights.forEach((w, i) => add(i + 1, A * w));
      wasLinkedToSales = true;
    }
    
    // Then handle the base payment schedule
    if (!wasLinkedToSales) {
        switch (schedule) {
            case 'Monthly':
                for (let m = 1; m <= forecastMonths; m++) {
                    add(m, A / forecastMonths);
                }
                break;
            case 'Quarterly':
                const quarterlyAmount = A / (forecastMonths / 3);
                for (let m = 1; m <= forecastMonths; m += 3) {
                    add(m, quarterlyAmount);
                }
                break;
            case 'Up-Front':
                add(1, A);
                break;
            case 'Custom':
                const start = fc.startMonth ?? 1;
                const end = fc.endMonth ?? start;
                const span = end - start + 1;
                let rule = fc.splitRule ?? [];
                if (!rule.length) {
                    rule = Array(span).fill(1);
                }
                const totalRuleWeight = rule.reduce((s, v) => s + v, 0);
                const normalizedRule = totalRuleWeight > 0 ? rule.map(w => w / totalRuleWeight) : [];

                normalizedRule.forEach((w, i) => add(start + i, A * w));
                break;
        }
    }
  });

  const timelineTotal = tl.reduce((s, v) => s + v, 0);
  const inputTotal = fixedCosts.reduce((s, v) => s + v.amount, 0);

  if (Math.abs(timelineTotal - inputTotal) > 0.01) { // Use a tolerance for float comparisons
    console.error(`Fixed-cost timeline mismatch. Expected: ${inputTotal.toFixed(2)}, Got: ${timelineTotal.toFixed(2)}`);
    // Not throwing error to avoid crash, but logging it. A more robust solution might be needed.
  }

  return tl.map(v => +v.toFixed(2));
}

// Dummy sales weight generator for now, should be replaced with real logic from revenue engine
export function getAggregatedSalesWeights(products: any[], forecastMonths: number): number[] {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    const productRevenues = products.map(p => {
        const weights = getSalesWeights(forecastMonths, p.salesModel);
        const productRevenue = p.plannedUnits * p.sellPrice * (p.sellThrough / 100);
        totalRevenue += productRevenue;
        return weights.map(w => w * productRevenue);
    });

    if (totalRevenue === 0) return aggregatedWeights;

    for (let i = 0; i < forecastMonths; i++) {
        let monthlyTotalRevenue = 0;
        productRevenues.forEach(revenues => {
            monthlyTotalRevenue += revenues[i];
        });
        aggregatedWeights[i] = monthlyTotalRevenue / totalRevenue;
    }
    
    return aggregatedWeights;
}
