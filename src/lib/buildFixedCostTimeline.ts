
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
  salesWeights: number[],
  planningBuffer: number,
): number[] {
  const tl: number[] = Array(forecastMonths).fill(0);
  const add = (m: number, val: number) => { if (m >= 1 && m <= forecastMonths) tl[m - 1] += val; };

  let totalScheduledCost = 0;

  // Step 1: Build the base timeline from user-defined schedules
  fixedCosts.forEach(fc => {
    const A = +fc.amount;
    const schedule = fc.paymentSchedule || 'Up-Front';
    
    // Don't include linked marketing costs in this initial pass
    if (fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false) {
      return;
    }

    switch (schedule) {
      case 'Monthly':
        for (let m = 1; m <= forecastMonths; m++) add(m, A);
        break;
      case 'Quarterly':
        for (let m = 1; m <= forecastMonths; m += 3) add(m, A);
        break;
      case 'Up-Front':
        add(1, A);
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
        break;
      }
    }
  });
  
  // Step 2: Distribute the planning buffer proportionally across the base timeline
  const baseTimelineTotal = tl.reduce((s,v) => s + v, 0);
  if (baseTimelineTotal > 0) {
      for(let i = 0; i < tl.length; i++){
          const proportion = tl[i] / baseTimelineTotal;
          tl[i] += planningBuffer * proportion;
      }
  } else if (planningBuffer > 0) {
      // If there are no other costs, distribute buffer according to sales weights or evenly
      if (salesWeights.length === forecastMonths && salesWeights.reduce((s,v) => s+v, 0) > 0.99) {
          salesWeights.forEach((w, i) => add(i + 1, planningBuffer * w));
      } else {
        const monthlyBuffer = planningBuffer / forecastMonths;
        for(let i = 0; i < tl.length; i++){
            add(i+1, monthlyBuffer);
        }
      }
  }

  // Step 3: Layer the linked marketing costs on top
  fixedCosts.forEach(fc => {
      if (fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false) {
          const A = +fc.amount;
          salesWeights.forEach((w, i) => add(i + 1, A * w));
      }
  });


  // Final check for integrity
  let expectedTotal = fixedCosts.reduce((s, v) => {
    const A = +v.amount;
    const schedule = v.paymentSchedule || 'Up-Front';
    switch (schedule) {
        case 'Monthly': return s + (A * forecastMonths);
        case 'Quarterly': return s + (A * Math.ceil(forecastMonths / 3));
        default: return s + A;
    }
  }, 0) + planningBuffer;
  
  // Correct for linked marketing costs, as their original payment schedule is ignored
  fixedCosts.forEach(fc => {
      if (fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false) {
          const A = +fc.amount;
          const schedule = fc.paymentSchedule || 'Up-Front';
           switch (schedule) {
                case 'Monthly': expectedTotal -= (A * forecastMonths); break;
                case 'Quarterly': expectedTotal -= (A * Math.ceil(forecastMonths/3)); break;
                default: expectedTotal -= A;
            }
            expectedTotal += A; // Add it back once, as it's distributed via sales weights
      }
  });


  const timelineTotal = tl.reduce((s, v) => s + v, 0);
  
  if (Math.abs(timelineTotal - expectedTotal) > 0.01) {
    console.warn(`Fixed-cost timeline mismatch. Expected: ${expectedTotal.toFixed(2)}, Got: ${timelineTotal.toFixed(2)}`);
  }

  return tl.map(v => +v.toFixed(2));
}

export function getAggregatedSalesWeights(products: any[], forecastMonths: number): number[] {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    if (!products || products.length === 0) return aggregatedWeights;

    const productRevenues = products.map(p => {
        const weights = getSalesWeights(forecastMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
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
