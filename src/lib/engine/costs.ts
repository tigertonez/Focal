
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product } from '@/lib/types';


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
        // The total number of months on the timeline chart
        const timelineMonths = preOrder ? baseForecastMonths + 1 : baseForecastMonths;
        
        let totalFixedInTimeline = 0;
        inputs.fixedCosts.forEach(fc => {
            totalFixedInTimeline += fc.amount;
        });
        
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

        const totalOperating = totalFixedInTimeline + totalVariableCost;
        const avgCostPerUnit = totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0;

        const planningBufferCost = inputs.fixedCosts.find(fc => fc.name.toLowerCase().includes('planning buffer'));
        const planningBufferAmount = planningBufferCost ? planningBufferCost.amount : 0;

        const costSummary = {
            totalFixed: totalFixedInTimeline,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts.filter(fc => !fc.name.toLowerCase().includes('planning buffer')),
            variableCosts: variableCostBreakdown,
            totalDepositsPaid,
            totalFinalPayments,
            planningBuffer: planningBufferAmount,
        };

        return { costSummary };

    } catch (e: any) {
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
