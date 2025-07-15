
'use client';

import { useMemo } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { type Product, type FixedCostItem } from '@/lib/types';

// Mock data structures as the engine is not fully implemented
interface CostSummary {
    totalFixed: number;
    totalVariable: number;
    totalOperating: number;
    avgCostPerUnit: number;
    fixedCosts: Array<{ name: string; amount: number }>;
    planningBuffer: number;
    variableCosts: Array<{
        name: string;
        plannedUnits: number;
        unitCost: number;
        totalProductionCost: number;
        depositPaid: number;
        remainingCost: number;
    }>;
}

interface MonthlyCost {
    deposits: number;
    otherFixed: number;
    production: number;
    marketing: number;
    total: number;
}

export const useCosts = () => {
    const { inputs } = useForecast();

    const { costSummary, monthlyCosts, depositProgress, error } = useMemo(() => {
        try {
            // Safety Guards
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
            const variableCosts = inputs.products.map(product => {
                const plannedUnits = product.plannedUnits || 0;
                const unitCost = product.unitCost || 0;
                const totalProductionCost = plannedUnits * unitCost;
                const depositPaid = totalProductionCost * (product.depositPct / 100);
                const remainingCost = totalProductionCost - depositPaid;
                
                totalPlannedUnits += plannedUnits;
                totalDepositsPaid += depositPaid;

                return {
                    name: product.productName,
                    plannedUnits,
                    unitCost,
                    totalProductionCost,
                    depositPaid,
                    remainingCost
                };
            });
            const totalVariable = variableCosts.reduce((acc, p) => acc + p.totalProductionCost, 0);

            // --- Summary ---
            const totalOperating = totalFixed + totalVariable;
            const avgCostPerUnit = totalPlannedUnits > 0 ? totalVariable / totalPlannedUnits : 0;

            const summary: CostSummary = {
                totalFixed,
                totalVariable,
                totalOperating,
                avgCostPerUnit,
                fixedCosts: inputs.fixedCosts,
                planningBuffer,
                variableCosts
            };

            // --- Monthly Timeline (Placeholder) ---
            const months = inputs.parameters.forecastMonths;
            const monthlyFixed = totalFixed / months;
            const monthlyVariable = totalVariable / months;
            const timeline: MonthlyCost[] = Array.from({ length: months }, (_, i) => ({
                deposits: totalDepositsPaid / months,
                otherFixed: monthlyFixed,
                production: monthlyVariable,
                marketing: 0, // Placeholder
                total: monthlyFixed + monthlyVariable
            }));
            
            // --- Deposit Progress ---
            const progress = totalVariable > 0 ? (totalDepositsPaid / totalVariable) * 100 : 0;
            

            return { costSummary: summary, monthlyCosts: timeline, depositProgress: progress, error: null };

        } catch (e: any) {
            return { costSummary: null, monthlyCosts: [], depositProgress: 0, error: e.message };
        }
    }, [inputs]);

    return { costSummary, monthlyCosts, depositProgress, error };
};
