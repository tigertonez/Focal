
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema } from '@/lib/types';

// Dummy sales data for 'According to Sales' calculation.
// In a real scenario, this would come from the revenue calculation engine.
const getSalesWeights = (months: number): number[] => {
    // Using a simple 'launch' model for now
    const weights = Array(months).fill(0);
    if (months > 0) weights[0] = 0.6;
    if (months > 1) weights[1] = 0.3;
    if (months > 2) weights[2] = 0.1;
    
    // Fill remaining with a small baseline if longer than 3 months
    if (months > 3) {
      const remainingWeight = 0; // No more sales after first 3 months in this simple model
      const perMonthWeight = remainingWeight / (months - 3);
      for(let i = 3; i < months; i++) {
        weights[i] = perMonthWeight;
      }
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    // Normalize weights to sum to 1
    return totalWeight > 0 ? weights.map(w => w / totalWeight) : weights;
};


const buildFixedCostTimeline = (inputs: EngineInput): Record<string, number>[] => {
    const { preOrder, forecastMonths } = inputs.parameters;
    const timelineMonths = preOrder ? forecastMonths + 1 : forecastMonths;
    const firstSalesMonthIndex = preOrder ? 1 : 0;
    const salesMonthsCount = forecastMonths;
    
    // Initialize timeline with empty cost objects
    const timeline: Record<string, number>[] = Array.from({ length: timelineMonths }, (_, i) => ({ month: i }));

    const salesWeights = getSalesWeights(salesMonthsCount);

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Up-Front';
        
        switch (schedule) {
            case 'Up-Front':
                timeline[0][cost.name] = (timeline[0][cost.name] || 0) + cost.amount;
                break;
            
            case 'Monthly':
                if (salesMonthsCount > 0) {
                    const monthlyAmount = cost.amount / salesMonthsCount;
                    for (let i = 0; i < salesMonthsCount; i++) {
                        const timelineIndex = firstSalesMonthIndex + i;
                        if (timeline[timelineIndex]) {
                           timeline[timelineIndex][cost.name] = (timeline[timelineIndex][cost.name] || 0) + monthlyAmount;
                        }
                    }
                }
                break;

            case 'Quarterly':
                const quarters = Math.ceil(salesMonthsCount / 3);
                if (quarters > 0) {
                    const quarterlyAmount = cost.amount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        const startMonthInSales = q * 3;
                        const timelineIndex = firstSalesMonthIndex + startMonthInSales;
                        if (timeline[timelineIndex]) {
                            timeline[timelineIndex][cost.name] = (timeline[timelineIndex][cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'According to Sales':
                 for (let i = 0; i < salesMonthsCount; i++) {
                    const timelineIndex = firstSalesMonthIndex + i;
                    if (timeline[timelineIndex]) {
                        const distributedAmount = cost.amount * salesWeights[i];
                        timeline[timelineIndex][cost.name] = (timeline[timelineIndex][cost.name] || 0) + distributedAmount;
                    }
                }
                break;
        }
    });

    return timeline;
};


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
            if (p.unitCost > p.sellPrice && p.productName) {
                throw new Error(`Product "${p.productName}" has a Unit Cost higher than its Sales Price, which will result in a loss.`);
            }
        });

        const { preOrder } = inputs.parameters;

        // --- Variable Costs ---
        let totalPlannedUnits = 0;
        let totalDepositsPaid = 0;
        let totalFinalPayments = 0;
        let totalVariableCost = 0;

        const variableCostBreakdown = inputs.products.map(product => {
            const plannedUnits = product.plannedUnits || 0;
            const unitCost = product.unitCost || 0;
            const totalProductionCost = plannedUnits * unitCost;
            const depositPaid = totalProductionCost * ((product.depositPct || 0) / 100);
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

        // --- Fixed Costs & Monthly Timeline ---
        const monthlyFixedCosts = buildFixedCostTimeline(inputs);
        
        // Add variable costs to the timeline
        const depositMonth = preOrder ? 0 : 1;
        const finalPaymentMonth = preOrder ? 1 : 2;
        
        if (monthlyFixedCosts[depositMonth]) {
            monthlyFixedCosts[depositMonth]['Deposits'] = (monthlyFixedCosts[depositMonth]['Deposits'] || 0) + totalDepositsPaid;
        }
        if (monthlyFixedCosts[finalPaymentMonth]) {
            monthlyFixedCosts[finalPaymentMonth]['Final Payments'] = (monthlyFixedCosts[finalPaymentMonth]['Final Payments'] || 0) + totalFinalPayments;
        }

        const totalFixedCostInPeriod = inputs.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const totalOperating = totalFixedCostInPeriod + totalVariableCost;
        const avgCostPerUnit = totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0;
        
        const costSummary = {
            totalFixed: totalFixedCostInPeriod,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts,
            variableCosts: variableCostBreakdown,
            totalDepositsPaid,
            totalFinalPayments,
        };
        
        // Validate and clean the monthly data, filling in missing keys
        const allKeys = new Set<string>(['month']);
        monthlyFixedCosts.forEach(monthData => {
            Object.keys(monthData).forEach(key => allKeys.add(key));
        });

        const cleanedMonthlyCosts = monthlyFixedCosts.map(monthData => {
            const completeMonth: Record<string, any> = {};
            allKeys.forEach(key => {
                completeMonth[key] = monthData[key] || 0;
            });
            return MonthlyCostSchema.parse(completeMonth);
        });


        return { 
            costSummary,
            monthlyCosts: cleanedMonthlyCosts
        };

    } catch (e: any) {
        console.error("Error in cost calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
