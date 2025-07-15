
import { type EngineInput, type CostSummary, type MonthlyCost } from '@/lib/types';


export function calculateCosts(inputs: EngineInput): { costSummary: CostSummary, monthlyCosts: MonthlyCost[], depositProgress: number } {
    try {
        // Safety Guards
        if (!inputs || !inputs.parameters || !inputs.products) {
            throw new Error('Inputs not available.');
        }
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) {
            throw new Error('Forecast Months must be between 1 and 36.');
        }
        if (inputs.products.some(p => p.unitCost === undefined || p.sellPrice === undefined)) {
             throw new Error('All products must have a Unit Cost and Sell Price.');
        }

        // --- Fixed Costs Calculation ---
        const marketingCostItem = inputs.fixedCosts.find(c => c.name.toLowerCase() === 'marketing');
        const marketingCost = marketingCostItem ? marketingCostItem.amount : 0;
        
        const otherFixedCosts = inputs.fixedCosts.filter(c => c.name.toLowerCase() !== 'marketing');
        const baseOtherFixedCosts = otherFixedCosts.reduce((acc, cost) => acc + (cost.amount || 0), 0);
        
        const totalBaseFixedCosts = baseOtherFixedCosts + marketingCost;
        const planningBuffer = totalBaseFixedCosts * (inputs.parameters.planningBuffer / 100);
        const totalFixed = totalBaseFixedCosts + planningBuffer;
        
        // --- Variable Costs Calculation ---
        let totalPlannedUnits = 0;
        let totalDepositsPaid = 0;
        let totalVariableCost = 0;

        const variableCosts = inputs.products.map(product => {
            const plannedUnits = product.plannedUnits || 0;
            const unitCost = product.unitCost || 0;
            const totalProductionCost = plannedUnits * unitCost;
            const depositPaid = totalProductionCost * (product.depositPct / 100);
            const remainingCost = totalProductionCost - depositPaid;
            
            totalPlannedUnits += plannedUnits;
            totalDepositsPaid += depositPaid;
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

        // --- Summary ---
        const totalOperating = totalFixed + totalVariableCost;
        const avgCostPerUnit = totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0;

        const costSummary: CostSummary = {
            totalFixed,
            totalVariable: totalVariableCost,
            totalOperating,
            avgCostPerUnit,
            fixedCosts: inputs.fixedCosts,
            planningBuffer,
            variableCosts
        };

        // --- Monthly Timeline ---
        const months = inputs.parameters.forecastMonths;
        const monthlyMarketing = marketingCost / months;
        // Apply buffer proportionally to non-marketing fixed costs
        const bufferedOtherFixed = baseOtherFixedCosts + planningBuffer;
        const monthlyOtherFixed = bufferedOtherFixed / months;
        
        const monthlyProduction = totalVariableCost / months;
        const monthlyDeposits = totalDepositsPaid / months;

        const timeline: MonthlyCost[] = Array.from({ length: months }, (_, i) => ({
            deposits: monthlyDeposits,
            otherFixed: monthlyOtherFixed,
            production: monthlyProduction,
            marketing: monthlyMarketing,
            total: monthlyOtherFixed + monthlyProduction + monthlyMarketing,
        }));
        
        // --- Deposit Progress ---
        const depositProgress = totalVariableCost > 0 ? (totalDepositsPaid / totalVariableCost) * 100 : 0;
        
        return { costSummary, monthlyCosts: timeline, depositProgress };

    } catch (e: any) {
        // Re-throw the error to be caught by the calling function in the context
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
