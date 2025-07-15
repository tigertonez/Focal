
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product } from '@/lib/types';


// Helper function to build the fixed cost timeline
function buildFixedCostTimeline(
    fixedCosts: FixedCostItem[],
    products: Product[],
    forecastMonths: number,
    preOrder: boolean,
  ): { timeline: { [key: string]: number }[], totalFixedInTimeline: number } {
    const timeline: { [key: string]: number }[] = Array.from({ length: forecastMonths }, () => ({}));

    const salesCurveMonths = preOrder ? forecastMonths - 1 : forecastMonths;
    const firstSalesMonthIndex = preOrder ? 1 : 0;

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

    const aggregatedSalesWeights = Array(forecastMonths).fill(0);
    if (products?.length > 0 && salesCurveMonths > 0) {
      let totalRevenue = 0;
      const productSalesData = products.map(p => {
        const singleProductWeights = getSalesWeights(salesCurveMonths, p.salesModel || 'launch');
        const productRevenue = (p.plannedUnits || 0) * (p.sellPrice || 0) * ((p.sellThrough || 0) / 100);
        totalRevenue += productRevenue;
        return { weights: singleProductWeights, revenue: productRevenue };
      });

      if (totalRevenue > 0) {
        for (let i = 0; i < salesCurveMonths; i++) {
          const timelineIndex = i + firstSalesMonthIndex;
          let monthlyTotalRevenue = 0;
          productSalesData.forEach(({ weights, revenue }) => {
            if (i < weights.length) {
              monthlyTotalRevenue += weights[i] * revenue;
            }
          });
          if (totalRevenue > 0) {
            aggregatedSalesWeights[timelineIndex] = monthlyTotalRevenue / totalRevenue;
          }
        }
      }
    }

    const sanitizeKey = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const add = (m: number, val: number, name: string) => {
      if (m >= 0 && m < forecastMonths) {
        const key = sanitizeKey(name);
        if (!timeline[m][key]) {
            timeline[m][key] = 0;
        }
        timeline[m][key] += val;
      }
    };

    fixedCosts.forEach(fc => {
      const totalAmount = +fc.amount;
      if (totalAmount === 0 || !fc.name) return;

      switch (fc.paymentSchedule || 'Up-Front') {
        case 'According to Sales':
          aggregatedSalesWeights.forEach((weight, monthIndex) => {
            if (weight > 0) {
              add(monthIndex, totalAmount * weight, fc.name);
            }
          });
          break;

        case 'Monthly':
          const monthlyAmount = totalAmount;
          for (let m = firstSalesMonthIndex; m < forecastMonths; m++) {
            add(m, monthlyAmount, fc.name);
          }
          break;

        case 'Quarterly':
          const quarterlyAmount = totalAmount;
          for (let m = firstSalesMonthIndex; m < forecastMonths; m += 3) {
            add(m, quarterlyAmount, fc.name);
          }
          break;

        case 'Up-Front':
          add(0, totalAmount, fc.name);
          break;
      }
    });

    let totalFixedInTimeline = 0;
    timeline.forEach(month => {
        totalFixedInTimeline += Object.values(month).reduce((sum, val) => sum + val, 0);
    });

    return { timeline, totalFixedInTimeline };
}


export function calculateCosts(inputs: EngineInput): EngineOutput {
    try {
        if (!inputs || !inputs.parameters || !inputs.products) {
            throw new Error('Inputs not available.');
        }
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) {
            throw new Error('Forecast Months must be between 1 and 36.');
        }
        inputs.products.forEach(p => {
             if (p.unitCost === undefined || p.sellPrice === undefined) {
                 throw new Error(`Product "${p.productName}" must have a Unit Cost and Sales Price.`);
            }
            if (p.unitCost > p.sellPrice) {
                throw new Error(`Product "${p.productName}" has a Unit Cost higher than its Sales Price, which will result in a loss.`);
            }
        });

        const { preOrder, forecastMonths: baseForecastMonths } = inputs.parameters;
        const timelineMonths = preOrder ? baseForecastMonths + 1 : baseForecastMonths;
        
        const { timeline: fixedCostTimelineData, totalFixedInTimeline } = buildFixedCostTimeline(
            inputs.fixedCosts,
            inputs.products,
            timelineMonths,
            preOrder
        );
        
        const totalFixedCostInTimeline = totalFixedInTimeline;
        
        let totalPlannedUnits = 0;
        let totalDepositsPaid = 0;
        let totalFinalPayments = 0;
        let totalVariableCost = 0;

        const variableCostBreakdown = inputs.products.map(product => {
            const plannedUnits = product.plannedUnits || 0;
            const unitCost = product.unitCost || 0;
            const totalProductionCost = plannedUnits * unitCost;
            const depositPaid = totalProductionCost * (product.depositPct / 100);
            const remainingCost = totalProductionCost - depositPaid;
            
            totalPlannedUnits += plannedUnits;
            totalDepositsPaid += depositPaid;
            totalFinalPayments += remainingCost;
            totalVariableCost += totalProductionCost;

            return {
                name: product.productName,
                plannedUnits,
                unitCost,
                totalProductionCost,
                depositPaid,
                remainingCost
            };
        });

        const totalOperating = totalFixedCostInTimeline + totalVariableCost;
        const avgCostPerUnit = totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0;

        const planningBufferCost = inputs.fixedCosts.find(fc => fc.name.toLowerCase().includes('planning buffer'));
        const planningBufferAmount = planningBufferCost ? planningBufferCost.amount : 0;

        const costSummary = {
            totalFixed: totalFixedCostInTimeline,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts.filter(fc => !fc.name.toLowerCase().includes('planning buffer')),
            variableCosts: variableCostBreakdown,
            totalDepositsPaid,
            totalFinalPayments,
            planningBuffer: planningBufferAmount,
        };

        const monthlyCosts = Array.from({ length: timelineMonths }, (_, i) => ({
            month: i,
            deposits: 0,
            finalPayments: 0,
            ...fixedCostTimelineData[i],
        }));
        
        const depositMonth = preOrder ? 0 : 0; 
        if (depositMonth < monthlyCosts.length) {
            monthlyCosts[depositMonth].deposits += totalDepositsPaid;
        }

        const finalPaymentMonth = preOrder ? 1 : 1; 
        if (finalPaymentMonth < monthlyCosts.length) {
            monthlyCosts[finalPaymentMonth].finalPayments += totalFinalPayments;
        }
        
        monthlyCosts.forEach(month => {
            month.total = Object.entries(month)
                .filter(([key]) => key !== 'month' && key !== 'name')
                .reduce((sum, [, value]) => sum + (value as number), 0);
        });

        return { costSummary, monthlyCosts };

    } catch (e: any) {
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
