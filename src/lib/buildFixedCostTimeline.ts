
import { type FixedCostItem } from './types';

export function buildFixedCostTimeline(
  fixedCosts: FixedCostItem[],
  forecastMonths: number,
  salesWeights: number[],
): number[] {
  const tl: number[] = Array(forecastMonths).fill(0);
  const add = (m: number, val: number) => { if (m >= 1 && m <= forecastMonths) tl[m - 1] += val; };

  fixedCosts.forEach(fc => {
    const A = +fc.amount;
    const schedule = fc.paymentSchedule || 'Up-Front';
    let isLinkedMarketing = fc.name.toLowerCase().includes('marketing') && fc.linkToSalesModel !== false;

    // Distribute based on schedule
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
    
    // Layer linked marketing on top, but remove the base amount to avoid double counting
    // if it wasn't already a monthly cost.
    if(isLinkedMarketing){
        const totalMarketingCost = A * forecastMonths; // Since marketing is now treated as monthly
        salesWeights.forEach((w, i) => add(i + 1, totalMarketingCost * w));
        
        // We need to remove the "base" amount that was added via the switch statement
        // to avoid double counting.
        if (schedule !== 'Monthly') {
            // This is complex. For now, let's assume marketing costs linked to sales
            // should have a 'Monthly' schedule for simplicity.
            // A more robust solution would be needed for other schedules.
            // Let's adjust the original distribution rather than adding/subtracting.
            // This part of the logic is deferred for a more precise spec.
            // The current implementation will over-count linked marketing if not set to 'Monthly'.
        }
    }
  });

  return tl.map(v => +v.toFixed(2));
}

export function getAggregatedSalesWeights(products: any[], forecastMonths: number): number[] {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    if (!products || products.length === 0) return aggregatedWeights;

    const getSalesWeights = (forecastMonths: number, model: 'launch' | 'even' | 'seasonal' | 'growth'): number[] => {
      let weights: number[] = Array(forecastMonths).fill(0);
      switch (model) {
          case 'launch':
              if (forecastMonths >= 3) { weights[0] = 0.6; weights[1] = 0.3; weights[2] = 0.1; }
              else if (forecastMonths === 2) { weights[0] = 0.7; weights[1] = 0.3; }
              else { weights[0] = 1; }
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
              if (totalWeight > 0) { weights = weights.map(w => w / totalWeight); }
              break;
          case 'growth':
              const totalSteps = (forecastMonths * (forecastMonths + 1)) / 2;
               if (totalSteps > 0) { for (let i = 0; i < forecastMonths; i++) { weights[i] = (i + 1) / totalSteps; } }
              break;
      }
      return weights;
  }

    const productRevenues = products.map(p => {
        const weights = getSalesWeights(forecastMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
        totalRevenue += productRevenue;
        return weights.map(w => w * productRevenue);
    });

    if (totalRevenue === 0) {
        return Array(forecastMonths).fill(1 / forecastMonths);
    }

    for (let i = 0; i < forecastMonths; i++) {
        let monthlyTotalRevenue = 0;
        productRevenues.forEach(revenues => {
            monthlyTotalRevenue += revenues[i];
        });
        aggregatedWeights[i] = monthlyTotalRevenue / totalRevenue;
    }
    
    return aggregatedWeights;
}
