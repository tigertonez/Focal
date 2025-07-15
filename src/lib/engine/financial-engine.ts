
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema } from '@/lib/types';
import type { MonthlyCost } from '@/lib/types';

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
    const timelineDuration = preOrder ? forecastMonths : forecastMonths + 1;
    const salesStartMonth = preOrder ? 0 : 1;
    const salesMonths = forecastMonths;

    const timeline: Record<string, number>[] = Array.from({ length: timelineDuration }, (_, i) => ({ month: preOrder ? i : i }));

    if (!preOrder) {
        // Shift months to be 1-based if not pre-order
        for(let i=0; i < timeline.length; i++) {
            timeline[i].month = i + 1;
        }
        // Remove month 0
        timeline.shift();
    }


    const salesWeights = getAggregatedSalesWeights(inputs);

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Paid Up-Front';
        
        switch (schedule) {
            case 'Paid Up-Front':
                const firstMonth = timeline.find(t => t.month === (preOrder ? 0 : 1));
                if (firstMonth) {
                    firstMonth[cost.name] = (firstMonth[cost.name] || 0) + cost.amount;
                }
                break;
            
            case 'Allocated Monthly':
                if (salesMonths > 0) {
                    const monthlyAmount = cost.amount / salesMonths;
                    for (let i = 0; i < salesMonths; i++) {
                        const currentMonth = salesStartMonth + i;
                        const timelineMonth = timeline.find(t => t.month === currentMonth);
                        if (timelineMonth) {
                           timelineMonth[cost.name] = (timelineMonth[cost.name] || 0) + monthlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated Quarterly':
                const quarters = Math.ceil(salesMonths / 3);
                if (quarters > 0) {
                    const quarterlyAmount = cost.amount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        const startMonthInSales = q * 3;
                        const currentMonth = salesStartMonth + startMonthInSales;
                        const timelineMonth = timeline.find(t => t.month === currentMonth);
                        if (timelineMonth) {
                           timelineMonth[cost.name] = (timelineMonth[cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated According to Sales':
                 for (let i = 0; i < forecastMonths; i++) {
                    const currentMonth = salesStartMonth + i;
                    const timelineMonth = timeline.find(t => t.month === currentMonth);
                    if (timelineMonth && salesWeights[i]) {
                        const distributedAmount = cost.amount * salesWeights[i];
                        timelineMonth[cost.name] = (timelineMonth[cost.name] || 0) + distributedAmount;
                    }
                }
                break;
        }
    });

    return timeline;
};


export function calculateFinancials(inputs: EngineInput): EngineOutput {
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
                // This is a warning, not a critical error that should stop the calculation.
                console.warn(`Product "${p.productName}" has a Unit Cost higher than its Sales Price.`);
            }
        });

        const { preOrder, forecastMonths } = inputs.parameters;
        const salesStartMonth = preOrder ? 0 : 1;
        
        // --- REVENUE CALCULATIONS ---
        const timelineDuration = preOrder ? forecastMonths : forecastMonths + 1;
        const monthlyRevenueTimeline: Record<string, number>[] = Array.from({ length: timelineDuration }, (_, i) => ({ month: preOrder ? i : i }));
        if (!preOrder) {
            monthlyRevenueTimeline.shift();
            for(let i = 0; i < monthlyRevenueTimeline.length; i++) {
                monthlyRevenueTimeline[i].month = i + 1;
            }
        }

        const productBreakdown = inputs.products.map(product => {
            const soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
            const totalRevenue = soldUnits * (product.sellPrice || 0);
            const salesWeights = getSalesWeights(forecastMonths, product.salesModel || 'launch');

            for (let i = 0; i < forecastMonths; i++) {
                const currentMonth = salesStartMonth + i;
                const timelineMonth = monthlyRevenueTimeline.find(t => t.month === currentMonth);
                if (timelineMonth) {
                    const monthlyProductRevenue = totalRevenue * salesWeights[i];
                    timelineMonth[product.productName] = (timelineMonth[product.productName] || 0) + monthlyProductRevenue;
                }
            }

            return {
                name: product.productName,
                totalRevenue: totalRevenue,
                totalSoldUnits: soldUnits,
            };
        });
        
        const totalSoldUnits = productBreakdown.reduce((sum, p) => sum + p.totalSoldUnits, 0);
        const totalRevenue = productBreakdown.reduce((sum, p) => sum + p.totalRevenue, 0);
        const avgRevenuePerUnit = totalSoldUnits > 0 ? totalRevenue / totalSoldUnits : 0;

        const revenueSummary = {
            totalRevenue,
            avgRevenuePerUnit,
            totalSoldUnits,
            productBreakdown,
            ltv: 0, // Placeholder
            cac: 0, // Placeholder
        };
        
        const allRevenueKeys = new Set<string>(['month']);
        monthlyRevenueTimeline.forEach(monthData => {
            Object.keys(monthData).forEach(key => allRevenueKeys.add(key));
        });

        const monthlyRevenue = monthlyRevenueTimeline.map(monthData => {
            const completeMonth: Record<string, any> = {};
            allRevenueKeys.forEach(key => {
                completeMonth[key] = monthData[key] || 0;
            });
            return MonthlyRevenueSchema.parse(completeMonth);
        }).filter(Boolean);


        // --- COST CALCULATIONS ---
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
        
        const monthlyCostTimeline = buildFixedCostTimeline(inputs);
        
        const depositPaymentMonth = preOrder ? 0 : 1;
        const finalPaymentMonth = 1;

        const depositMonth = monthlyCostTimeline.find(t => t.month === depositPaymentMonth);
        if (depositMonth) {
            depositMonth['Deposits'] = (depositMonth['Deposits'] || 0) + totalDepositsPaid;
        }

        const finalPaymentMonthData = monthlyCostTimeline.find(t => t.month === finalPaymentMonth);
        if (finalPaymentMonthData) {
            finalPaymentMonthData['Final Payments'] = (finalPaymentMonthData['Final Payments'] || 0) + totalFinalPayments;
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
        
        const allCostKeys = new Set<string>(['month']);
        monthlyCostTimeline.forEach(monthData => {
            Object.keys(monthData).forEach(key => allCostKeys.add(key));
        });

        const monthlyCosts = monthlyCostTimeline.map(monthData => {
            const completeMonth: Record<string, any> = {};
            allCostKeys.forEach(key => {
                completeMonth[key] = monthData[key] || 0;
            });
            if (!preOrder && completeMonth.month === 0) {
                return null;
            }
            return MonthlyCostSchema.parse(completeMonth);
        }).filter(Boolean) as MonthlyCost[];


        // --- PROFIT, CASH FLOW (PLACEHOLDERS) ---
        // This section will be built out in future steps.

        return { 
            costSummary,
            monthlyCosts,
            revenueSummary,
            monthlyRevenue,
            // Placeholders for future data
            profitSummary: { grossProfit: 0, operatingProfit: 0, netProfit: 0 },
            monthlyProfit: [],
            cashFlowSummary: { endingCashBalance: 0, runway: 0 },
            monthlyCashFlow: [],
        };

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
