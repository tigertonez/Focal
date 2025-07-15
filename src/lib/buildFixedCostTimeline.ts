
import { type FixedCostItem, type Product } from './types';

export function buildFixedCostTimeline(
  fixedCosts: FixedCostItem[],
  forecastMonths: number,
  salesWeights: number[],
  preOrder: boolean,
): number[] {
  const tl: number[] = Array(forecastMonths).fill(0);
  
  // The first *sales* month. If preOrder is on, this is index 1. Otherwise, it's index 0.
  // In pre-order mode, some costs might start from month 0, and recurring from month 1.
  const firstSalesMonthIndex = preOrder ? 1 : 0;
  
  const add = (m: number, val: number) => { 
    if (m >= 0 && m < forecastMonths) {
      tl[m] += val;
    }
  };

  fixedCosts.forEach(fc => {
    const A = +fc.amount;

    if (fc.paymentSchedule === 'According to Sales') {
        // Sales weights are now calculated for the entire timeline, including a potential month 0.
        // So we can just apply them directly.
        salesWeights.forEach((w, i) => add(i, A * w));
        return; 
    }
    
    switch (fc.paymentSchedule || 'Up-Front') {
      case 'Monthly':
        // Monthly costs start in the first *sales* month.
        for (let m = firstSalesMonthIndex; m < forecastMonths; m++) add(m, A);
        break;
      case 'Quarterly':
        // Quarterly costs start in the first *sales* month.
        for (let m = firstSalesMonthIndex; m < forecastMonths; m += 3) add(m, A);
        break;
      case 'Up-Front':
        // If pre-order is on, Up-Front costs are in month 0. Otherwise, first sales month.
        add(preOrder ? 0 : firstSalesMonthIndex, A);
        break;
    }
  });

  return tl.map(v => +v.toFixed(2));
}

export function getAggregatedSalesWeights(products: Product[], forecastMonths: number, preOrder: boolean): number[] {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    // The number of months that have sales. If pre-order, the first month (0) is for pre-sales.
    // So the "sales curve" is distributed over `forecastMonths` if pre-order, or `forecastMonths` if not.
    const salesCurveMonths = preOrder ? forecastMonths : forecastMonths;

    if (!products || products.length === 0) return aggregatedWeights;

    const getSalesWeights = (months: number, model: 'launch' | 'even' | 'seasonal' | 'growth'): number[] => {
      let weights: number[] = Array(months).fill(0);
      switch (model) {
          case 'launch':
              if (months >= 3) { weights[0] = 0.6; weights[1] = 0.3; weights[2] = 0.1; }
              else if (months === 2) { weights[0] = 0.7; weights[1] = 0.3; }
              else if (months > 0) { weights[0] = 1; }
              break;
          case 'even':
              if (months > 0) weights.fill(1 / months);
              break;
          case 'seasonal':
              if (months > 0) {
                  const peak = months / 2;
                  let totalWeight = 0;
                  for (let i = 0; i < months; i++) {
                      const distance = Math.abs(i - peak);
                      weights[i] = Math.exp(-0.1 * distance * distance);
                      totalWeight += weights[i];
                  }
                  if (totalWeight > 0) { weights = weights.map(w => w / totalWeight); }
              }
              break;
          case 'growth':
               if (months > 0) {
                  const totalSteps = (months * (months + 1)) / 2;
                  if (totalSteps > 0) { for (let i = 0; i < months; i++) { weights[i] = (i + 1) / totalSteps; } }
               }
              break;
      }
      return weights;
  }

    const productRevenues = products.map(p => {
        const weights = getSalesWeights(salesCurveMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
        totalRevenue += productRevenue;
        return weights.map(w => w * productRevenue);
    });

    if (totalRevenue === 0 && forecastMonths > 0) {
        return Array(forecastMonths).fill(1 / forecastMonths);
    }
    
    if (totalRevenue > 0) {
      for (let i = 0; i < forecastMonths; i++) {
          let monthlyTotalRevenue = 0;
          productRevenues.forEach(revenues => {
              monthlyTotalRevenue += (revenues[i] || 0); // ensure we don't add undefined
          });
          aggregatedWeights[i] = monthlyTotalRevenue / totalRevenue;
      }
    }
    
    return aggregatedWeights;
}
