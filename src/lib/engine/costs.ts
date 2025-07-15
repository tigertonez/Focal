
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
        const baseFixedCosts = inputs.fixedCosts.reduce((acc, cost) => acc + (cost.amount || 0), 0);
        const planningBuffer = baseFixedCosts * (inputs.parameters.planningBuffer / 100);
        const totalFixed = baseFixedCosts + planningBuffer;
        
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

        // --- Monthly Timeline (Placeholder) ---
        const months = inputs.parameters.forecastMonths;
        const monthlyFixed = totalFixed / months;
        const monthlyVariable = totalVariableCost / months;
        const timeline: MonthlyCost[] = Array.from({ length: months }, (_, i) => ({
            deposits: totalDepositsPaid / months,
            otherFixed: monthlyFixed,
            production: monthlyVariable,
            marketing: 0, // Placeholder
            total: monthlyFixed + monthlyVariable
        }));
        
        // --- Deposit Progress ---
        const depositProgress = totalVariableCost > 0 ? (totalDepositsPaid / totalVariableCost) * 100 : 0;
        
        return { costSummary, monthlyCosts: timeline, depositProgress };

    } catch (e: any) {
        // Re-throw the error to be caught by the calling function in the context
        throw new Error(e.message || 'An unknown error occurred in cost calculation.');
    }
}
