
import { type EngineInput, type CostSummary, type MonthlyCost, type FixedCostItem } from '@/lib/types';
import { buildFixedCostTimeline } from '@/lib/buildFixedCostTimeline';

export function calculateCosts(inputs: EngineInput): { costSummary: CostSummary, monthlyCosts: MonthlyCost[] } {
    try {
        if (!inputs || !inputs.parameters || !inputs.products) {
            throw new Error('Inputs not available.');
        }
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) {
            throw new Error('Forecast Months must be between 1 and 36.');
        }
        inputs.products.forEach(p => {
             if (p.unitCost === undefined || p.sellPrice === undefined) {
                 throw new Error(`Product "${p.productName}" must have a Unit Cost and Sell Price.`);
            }
            if (p.unitCost > p.sellPrice) {
                throw new Error(`Product "${p.productName}" has a Unit Cost higher than its Sell Price, which will result in a loss.`);
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

        const costSummary: CostSummary = {
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

        const monthlyCosts: MonthlyCost[] = Array.from({ length: timelineMonths }, (_, i) => ({
            month: i,
            deposits: 0,
            finalPayments: 0,
            fixed: fixedCostTimeline[i]?.total || 0,
            fixedBreakdown: fixedCostTimeline[i]?.breakdown || [],
            total: fixedCostTimeline[i]?.total || 0,
        }));
        
        const depositMonth = preOrder ? 0 : 1;
        const finalPaymentMonth = preOrder ? 1 : 2;

        // Ensure depositMonth is within bounds
        if (depositMonth < monthlyCosts.length) {
            monthlyCosts[depositMonth].deposits += totalDepositsPaid;
            monthlyCosts[depositMonth].total += totalDepositsPaid;
        }

        // Ensure finalPaymentMonth is within bounds
        if (finalPaymentMonth < monthlyCosts.length) {
            monthlyCosts[finalPaymentMonth].finalPayments += totalFinalPayments;
            monthlyCosts[finalPaymentMonth].total += totalFinalPayments;
        }
        
        return { costSummary, monthlyCosts };

    } catch (e: any) {
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
