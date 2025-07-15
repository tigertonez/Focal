
import { type FixedCostItem, type Product } from './types';

export function buildFixedCostTimeline(
  fixedCosts: FixedCostItem[],
  forecastMonths: number,
  salesWeights: number[],
  preOrder: boolean,
): number[] {
  const tl: number[] = Array(forecastMonths).fill(0);
  
  const firstSalesMonthIndex = preOrder ? 1 : 0;
  const salesCurveMonths = forecastMonths - firstSalesMonthIndex;

  const add = (m: number, val: number) => { 
    if (m >= 0 && m < forecastMonths) {
      tl[m] += val;
    }
  };

  fixedCosts.forEach(fc => {
    const totalAmount = +fc.amount;

    if (totalAmount === 0) return;

    switch (fc.paymentSchedule || 'Up-Front') {
      case 'According to Sales':
        salesWeights.forEach((weight, monthIndex) => {
          add(monthIndex, totalAmount * weight);
        });
        break;

      case 'Monthly':
        if (salesCurveMonths > 0) {
          const monthlyAmount = totalAmount / salesCurveMonths;
          for (let m = firstSalesMonthIndex; m < forecastMonths; m++) {
            add(m, monthlyAmount);
          }
        }
        break;

      case 'Quarterly':
        if (salesCurveMonths > 0) {
          const numQuarters = Math.ceil(salesCurveMonths / 3);
          const quarterlyAmount = totalAmount / numQuarters;
          for (let m = firstSalesMonthIndex; m < forecastMonths; m += 3) {
            add(m, quarterlyAmount);
          }
        }
        break;
        
      case 'Up-Front':
        add(preOrder ? 0 : firstSalesMonthIndex, totalAmount);
        break;
    }
  });

  return tl.map(v => +v.toFixed(2));
}

export function getAggregatedSalesWeights(products: Product[], forecastMonths: number, preOrder: boolean): number[] {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    const salesCurveMonths = preOrder ? forecastMonths : forecastMonths;
    const salesStartIndex = preOrder ? 1 : 0;

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
    
    const productSalesWeights = products.map(p => {
        const singleProductWeights = getSalesWeights(salesCurveMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
        totalRevenue += productRevenue;
        return { weights: singleProductWeights, revenue: productRevenue };
    });

    if (totalRevenue === 0) {
        if (forecastMonths > 0) {
            const evenWeight = 1 / forecastMonths;
            return Array(forecastMonths).fill(evenWeight);
        }
        return aggregatedWeights;
    }
    
    // Distribute weights into the main timeline array
    for (let i = 0; i < forecastMonths; i++) {
      let monthlyTotalRevenue = 0;
      productSalesWeights.forEach(({ weights, revenue }) => {
        const weightIndex = i - salesStartIndex;
        if (weightIndex >= 0 && weightIndex < weights.length) {
          monthlyTotalRevenue += weights[weightIndex] * revenue;
        }
      });
      aggregatedWeights[i] = monthlyTotalRevenue / totalRevenue;
    }
    
    return aggregatedWeights;
}
