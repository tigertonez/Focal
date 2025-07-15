
import { type EngineInput, type CostSummary, type MonthlyCost } from '@/lib/types';
import { buildFixedCostTimeline, getAggregatedSalesWeights } from '@/lib/buildFixedCostTimeline';

export function calculateCosts(inputs: EngineInput): { costSummary: CostSummary, monthlyCosts: MonthlyCost[] } {
    try {
        if (!inputs || !inputs.parameters || !inputs.products) {
            throw new Error('Inputs not available.');
        }
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) {
            throw new Error('Forecast Months must be between 1 and 36.');
        }
        if (inputs.products.some(p => p.unitCost === undefined || p.sellPrice === undefined)) {
             throw new Error('All products must have a Unit Cost and Sell Price.');
        }
        const forecastMonths = inputs.parameters.forecastMonths;

        const salesWeights = getAggregatedSalesWeights(inputs.products, forecastMonths);
        const fixedCostTimeline = buildFixedCostTimeline(
            inputs.fixedCosts, 
            forecastMonths, 
            salesWeights
        );
        
        const totalFixedInTimeline = fixedCostTimeline.reduce((sum, cost) => sum + cost, 0);
        
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

        const costSummary: CostSummary = {
            totalFixed: totalFixedInTimeline,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts,
            variableCosts: variableCostBreakdown,
            totalDepositsPaid,
            totalFinalPayments,
        };

        const months = forecastMonths;
        const monthlyCosts: MonthlyCost[] = Array.from({ length: months }, (_, i) => ({
            month: i + 1,
            deposits: 0,
            finalPayments: 0,
            fixed: fixedCostTimeline[i] || 0,
            total: fixedCostTimeline[i] || 0,
        }));

        if (months >= 1) {
            monthlyCosts[0].deposits = totalDepositsPaid;
            monthlyCosts[0].total += totalDepositsPaid;
        }

        if (months >= 2) {
            monthlyCosts[1].finalPayments = totalFinalPayments;
            monthlyCosts[1].total += totalFinalPayments;
        }
        
        return { costSummary, monthlyCosts };

    } catch (e: any) {
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
