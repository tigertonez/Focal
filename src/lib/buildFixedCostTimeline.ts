
import { type FixedCostItem, type Product } from './types';

interface FixedCostBreakdown {
    name: string;
    amount: number;
}

interface MonthlyFixedCost {
    total: number;
    breakdown: FixedCostBreakdown[];
}

const getSalesWeights = (months: number, model: 'launch' | 'even' | 'seasonal' | 'growth'): number[] => {
    let weights: number[] = Array(months).fill(0);
    if (months <= 0) return weights;

    switch (model) {
        case 'launch':
            if (months >= 3) { weights[0] = 0.6; weights[1] = 0.3; weights[2] = 0.1; }
            else if (months === 2) { weights[0] = 0.7; weights[1] = 0.3; }
            else { weights[0] = 1; }
            break;
        case 'even':
            weights.fill(1 / months);
            break;
        case 'seasonal':
            const peak = months / 2;
            let totalWeight = 0;
            for (let i = 0; i < months; i++) {
                const distance = Math.abs(i - peak);
                weights[i] = Math.exp(-0.1 * distance * distance);
                totalWeight += weights[i];
            }
            if (totalWeight > 0) { weights = weights.map(w => w / totalWeight); }
            break;
        case 'growth':
            const totalSteps = (months * (months + 1)) / 2;
            if (totalSteps > 0) { for (let i = 0; i < months; i++) { weights[i] = (i + 1) / totalSteps; } }
            break;
    }
    return weights;
}

const getAggregatedSalesWeights = (products: Product[], forecastMonths: number, preOrder: boolean): number[] => {
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalRevenue = 0;
    
    const salesCurveMonths = preOrder ? forecastMonths - 1 : forecastMonths;
    if (!products || products.length === 0 || salesCurveMonths <= 0) return aggregatedWeights;
    
    const productSalesData = products.map(p => {
        const singleProductWeights = getSalesWeights(salesCurveMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
        totalRevenue += productRevenue;
        return { weights: singleProductWeights, revenue: productRevenue };
    });

    if (totalRevenue === 0) return aggregatedWeights;
    
    const salesStartIndex = preOrder ? 1 : 0;
    for (let i = 0; i < salesCurveMonths; i++) {
        const timelineIndex = i + salesStartIndex;
        let monthlyTotalRevenue = 0;
        productSalesData.forEach(({ weights, revenue }) => {
            if (i < weights.length) {
                monthlyTotalRevenue += weights[i] * revenue;
            }
        });
        if (totalRevenue > 0) {
            aggregatedWeights[timelineIndex] = monthlyTotalRevenue / totalRevenue;
        }
    }
    
    return aggregatedWeights;
}

export function buildFixedCostTimeline(
  fixedCosts: FixedCostItem[],
  products: Product[],
  forecastMonths: number,
  preOrder: boolean,
): MonthlyFixedCost[] {
  const timeline: MonthlyFixedCost[] = Array.from({ length: forecastMonths }, () => ({
    total: 0,
    breakdown: [],
  }));
  
  const salesWeights = getAggregatedSalesWeights(products, forecastMonths, preOrder);
  const salesCurveMonths = preOrder ? forecastMonths - 1 : forecastMonths;
  const firstSalesMonthIndex = preOrder ? 1 : 0;

  const add = (m: number, val: number, name: string) => { 
    if (m >= 0 && m < forecastMonths) {
      timeline[m].total += val;
      const existing = timeline[m].breakdown.find(b => b.name === name);
      if (existing) {
        existing.amount += val;
      } else {
        timeline[m].breakdown.push({ name, amount: val });
      }
    }
  };

  fixedCosts.forEach(fc => {
    const totalAmount = +fc.amount;
    if (totalAmount === 0) return;

    switch (fc.paymentSchedule || 'Up-Front') {
      case 'According to Sales':
        salesWeights.forEach((weight, monthIndex) => {
          if (weight > 0) {
            add(monthIndex, totalAmount * weight, fc.name);
          }
        });
        break;

      case 'Monthly':
        if (salesCurveMonths > 0) {
          const monthlyAmount = totalAmount / salesCurveMonths;
          for (let m = firstSalesMonthIndex; m < forecastMonths; m++) {
            add(m, monthlyAmount, fc.name);
          }
        }
        break;

      case 'Quarterly':
        if (salesCurveMonths > 0) {
          const numQuarters = Math.ceil(salesCurveMonths / 3);
          if (numQuarters > 0) {
            const quarterlyAmount = totalAmount / numQuarters;
            for (let m = firstSalesMonthIndex; m < forecastMonths; m += 3) {
              add(m, quarterlyAmount, fc.name);
            }
          }
        }
        break;
        
      case 'Up-Front':
        add(preOrder ? 0 : 0, totalAmount, fc.name);
        break;
    }
  });

  // Round all values at the end
  return timeline.map(month => ({
    total: +month.total.toFixed(2),
    breakdown: month.breakdown.map(item => ({
      name: item.name,
      amount: +item.amount.toFixed(2)
    })).sort((a, b) => b.amount - a.amount), // Sort by amount desc
  }));
}
