
import { type EngineInput, type CostSummary, type MonthlyCost, type FixedCostItem } from '@/lib/types';
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

        const { preOrder, forecastMonths: baseForecastMonths } = inputs.parameters;
        
        // Add a month for pre-order period if active
        const timelineMonths = preOrder ? baseForecastMonths + 1 : baseForecastMonths;
        const salesForecastMonths = baseForecastMonths; // Sales projections are always over the N months after launch
        const month1Index = preOrder ? 1 : 0; // Month 1 is index 1 if preOrder, else 0

        const allFixedCosts: FixedCostItem[] = [...inputs.fixedCosts];
        
        // Sales weights are calculated for the period *after* launch
        const salesWeights = getAggregatedSalesWeights(inputs.products, salesForecastMonths);
        
        const fixedCostTimeline = buildFixedCostTimeline(
            allFixedCosts, 
            timelineMonths, 
            salesWeights,
            preOrder
        );
        
        const totalFixedCostInTimeline = fixedCostTimeline.reduce((sum, cost) => sum + cost, 0);
        
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

        // Find the planning buffer amount from the list of fixed costs to display in summary
        const planningBufferCost = inputs.fixedCosts.find(fc => fc.name.toLowerCase().includes('planning buffer'));
        const planningBufferAmount = planningBufferCost ? planningBufferCost.amount : 0;

        const costSummary: CostSummary = {
            totalFixed: totalFixedCostInTimeline,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts,
            variableCosts: variableCostBreakdown,
            totalDepositsPaid,
            totalFinalPayments,
            planningBuffer: planningBufferAmount,
        };

        const monthlyCosts: MonthlyCost[] = Array.from({ length: timelineMonths }, (_, i) => ({
            month: i,
            deposits: 0,
            finalPayments: 0,
            fixed: fixedCostTimeline[i] || 0,
            total: fixedCostTimeline[i] || 0,
        }));

        // Deposits are paid in Month 1
        if (timelineMonths > month1Index) {
            monthlyCosts[month1Index].deposits = totalDepositsPaid;
            monthlyCosts[month1Index].total += totalDepositsPaid;
        }

        // Final payments are made in Month 2
        if (timelineMonths > month1Index + 1) {
            monthlyCosts[month1Index + 1].finalPayments = totalFinalPayments;
            monthlyCosts[month1Index + 1].total += totalFinalPayments;
        }
        
        return { costSummary, monthlyCosts };

    } catch (e: any) {
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
