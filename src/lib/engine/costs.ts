
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema } from '@/lib/types';

// In a real scenario, this would come from a more complex revenue calculation engine.
// This function generates a normalized sales distribution over the forecast period.
const getSalesWeights = (months: number, salesModel: 'launch' | 'even' | 'seasonal' | 'growth'): number[] => {
    let weights = Array(months).fill(0);

    switch (salesModel) {
        case 'launch':
            if (months > 0) weights[0] = 0.6;
            if (months > 1) weights[1] = 0.3;
            if (months > 2) weights[2] = 0.1;
            break;
        case 'even':
            weights = Array(months).fill(1 / months);
            break;
        case 'seasonal': // Simple bell curve
            const mid = (months - 1) / 2;
            for (let i = 0; i < months; i++) {
                weights[i] = Math.exp(-Math.pow(i - mid, 2) / (2 * Math.pow(months / 4, 2)));
            }
            break;
        case 'growth':
            for (let i = 0; i < months; i++) {
                weights[i] = i + 1;
            }
            break;
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    // Normalize weights to ensure they sum to 1
    return totalWeight > 0 ? weights.map(w => w / totalWeight) : Array(months).fill(0);
};

// Aggregate sales weights from all products
const getAggregatedSalesWeights = (inputs: EngineInput): number[] => {
    const { forecastMonths } = inputs.parameters;
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalValue = 0;

    inputs.products.forEach(p => {
        const productValue = (p.plannedUnits || 0) * (p.sellPrice || 0);
        const productWeights = getSalesWeights(forecastMonths, p.salesModel || 'launch');
        productWeights.forEach((weight, i) => {
            aggregatedWeights[i] += weight * productValue;
        });
        totalValue += productValue;
    });

    if (totalValue === 0) return Array(forecastMonths).fill(1 / forecastMonths);

    return aggregatedWeights.map(w => w / totalValue);
};

const buildFixedCostTimeline = (inputs: EngineInput): Record<string, number>[] => {
    const { preOrder, forecastMonths } = inputs.parameters;
    // Month 0 is always present. Total months is forecastMonths + 1 if NOT pre-order (M0 for upfront, M1-12 for sales)
    // If pre-order, M0 is a sales month. So total months is just forecastMonths.
    const timelineDuration = preOrder ? forecastMonths : forecastMonths + 1;
    const salesStartMonth = preOrder ? 0 : 1;
    
    // Initialize timeline with empty cost objects for each month
    const timeline: Record<string, number>[] = Array.from({ length: timelineDuration }, (_, i) => ({ month: i }));

    const salesWeights = getAggregatedSalesWeights(inputs);

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Up-Front';
        
        switch (schedule) {
            case 'Up-Front':
                timeline[0][cost.name] = (timeline[0][cost.name] || 0) + cost.amount;
                break;
            
            case 'Monthly':
                if (forecastMonths > 0) {
                    const monthlyAmount = cost.amount / forecastMonths;
                    for (let i = 0; i < forecastMonths; i++) {
                        const timelineIndex = salesStartMonth + i;
                        if (timeline[timelineIndex]) {
                           timeline[timelineIndex][cost.name] = (timeline[timelineIndex][cost.name] || 0) + monthlyAmount;
                        }
                    }
                }
                break;

            case 'Quarterly':
                const quarters = Math.ceil(forecastMonths / 3);
                if (quarters > 0) {
                    const quarterlyAmount = cost.amount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        const startMonthInSales = q * 3;
                        const timelineIndex = salesStartMonth + startMonthInSales;
                        if (timeline[timelineIndex]) {
                            timeline[timelineIndex][cost.name] = (timeline[timelineIndex][cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'According to Sales':
                 for (let i = 0; i < forecastMonths; i++) {
                    const timelineIndex = salesStartMonth + i;
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
                 throw new Error(`Product "${p.productName || 'Unnamed'}" must have a Unit Cost and Sales Price.`);
            }
            if (p.unitCost > p.sellPrice && p.productName) {
                throw new Error(`Product "${p.productName}" has a Unit Cost higher than its Sales Price, which will result in a loss.`);
            }
        });

        const { preOrder, forecastMonths } = inputs.parameters;
        
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
        const monthlyTimeline = buildFixedCostTimeline(inputs);
        
        // --- Add variable costs to the timeline ---
        // Deposit is always paid in Month 0
        monthlyTimeline[0]['Deposits'] = (monthlyTimeline[0]['Deposits'] || 0) + totalDepositsPaid;

        // Final payment depends on pre-order
        const finalPaymentMonth = preOrder ? 1 : 2; 
        if (monthlyTimeline[finalPaymentMonth]) {
            monthlyTimeline[finalPaymentMonth]['Final Payments'] = (monthlyTimeline[finalPaymentMonth]['Final Payments'] || 0) + totalFinalPayments;
        } else {
            // Handle edge case where timeline is too short for final payment
            const lastMonth = monthlyTimeline.length - 1;
            monthlyTimeline[lastMonth]['Final Payments'] = (monthlyTimeline[lastMonth]['Final Payments'] || 0) + totalFinalPayments;
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
        
        // Validate and clean the monthly data, filling in missing keys for every month
        const allKeys = new Set<string>(['month']);
        monthlyTimeline.forEach(monthData => {
            Object.keys(monthData).forEach(key => allKeys.add(key));
        });

        const cleanedMonthlyCosts = monthlyTimeline.map(monthData => {
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
