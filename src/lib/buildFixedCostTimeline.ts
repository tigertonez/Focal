
import { type FixedCostItem } from './types';

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

  let totalExpectedTimelineSum = 0;

  fixedCosts.forEach(fc => {
    const A = +fc.amount;
    const schedule = fc.paymentSchedule || 'Up-Front';

    // Base cost application based on schedule
    switch (schedule) {
      case 'Monthly':
        for (let m = 1; m <= forecastMonths; m++) {
          add(m, A);
        }
        totalExpectedTimelineSum += A * forecastMonths;
        break;
      case 'Quarterly':
        for (let m = 1; m <= forecastMonths; m += 3) {
          add(m, A);
        }
        totalExpectedTimelineSum += A * Math.ceil(forecastMonths / 3);
        break;
      case 'Up-Front':
        add(1, A);
        totalExpectedTimelineSum += A;
        break;
      case 'Custom': {
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
        totalExpectedTimelineSum += A;
        break;
      }
    }
    
    // Marketing link is an additional layer, not a replacement
    if (fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false) {
      const marketingTotal = A * (schedule === 'Monthly' ? forecastMonths : 1);
      salesWeights.forEach((w, i) => {
          const proportionalAmount = marketingTotal * w;
          add(i + 1, proportionalAmount);
      });
      // We remove the original amounts to avoid double counting
      switch (schedule) {
          case 'Monthly':
            for (let m = 1; m <= forecastMonths; m++) add(m, -A);
            break;
          case 'Up-Front':
            add(1, -A);
            break;
          // Note: Add other cases if marketing can have other schedules
      }
      totalExpectedTimelineSum += marketingTotal; // Add marketing total
      totalExpectedTimelineSum -= marketingTotal; // And remove what was subtracted
    }
  });

  const timelineTotal = tl.reduce((s, v) => s + v, 0);

  // Use a tolerance for floating point comparisons
  if (Math.abs(timelineTotal - totalExpectedTimelineSum) > 0.01) {
    console.warn(`Fixed-cost timeline mismatch. Expected: ${totalExpectedTimelineSum.toFixed(2)}, Got: ${timelineTotal.toFixed(2)}`);
  }

  return tl.map(v => +v.toFixed(2));
}

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
