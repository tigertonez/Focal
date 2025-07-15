
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product } from '@/lib/types';


// Helper function to build the fixed cost timeline
function buildFixedCostTimeline(
    fixedCosts: FixedCostItem[],
    products: Product[],
    forecastMonths: number,
    preOrder: boolean,
  ): any[] { // Using any[] for simplicity as this is an internal function
    const timeline = Array.from({ length: forecastMonths }, () => ({
      total: 0,
      breakdown: [],
    }));
  
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
  
    const add = (m: number, val: number, name: string) => {
      if (m >= 0 && m < forecastMonths) {
        timeline[m].total += val;
        const existing = timeline[m].breakdown.find((b: any) => b.name === name);
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
          aggregatedSalesWeights.forEach((weight, monthIndex) => {
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
          add(0, totalAmount, fc.name);
          break;
      }
    });
  
    return timeline.map(month => ({
      total: +month.total.toFixed(2),
      breakdown: month.breakdown.map((item: any) => ({
        name: item.name,
        amount: +item.amount.toFixed(2)
      })).sort((a: any, b: any) => b.amount - a.amount),
    }));
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
        
        const fixedCostTimeline = buildFixedCostTimeline(
            inputs.fixedCosts, 
            inputs.products,
            timelineMonths,
            preOrder
        );
        
        const totalFixedCostInTimeline = fixedCostTimeline.reduce((sum, month) => sum + month.total, 0);
        
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
            fixed: fixedCostTimeline[i]?.total || 0,
            fixedBreakdown: fixedCostTimeline[i]?.breakdown || [],
            total: fixedCostTimeline[i]?.total || 0,
        }));
        
        // Deposits paid in Month 0 if pre-order, else Month 1 (index 0 of a non-preorder timeline)
        const depositMonth = preOrder ? 0 : 0; 
        if (depositMonth < monthlyCosts.length) {
            monthlyCosts[depositMonth].deposits += totalDepositsPaid;
            monthlyCosts[depositMonth].total += totalDepositsPaid;
        }

        // Final payments in Month 1 if pre-order, else Month 2 (index 1 of a non-preorder timeline)
        const finalPaymentMonth = preOrder ? 1 : 1; 
        if (finalPaymentMonth < monthlyCosts.length) {
            monthlyCosts[finalPaymentMonth].finalPayments += totalFinalPayments;
            monthlyCosts[finalPaymentMonth].total += totalFinalPayments;
        }
        
        return { costSummary, monthlyCosts };

    } catch (e: any) {
        // In a real app, you might want a more structured error response
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
