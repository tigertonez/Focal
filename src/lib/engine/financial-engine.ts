

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow } from '@/lib/types';
import type { MonthlyCost } from '@/lib/types';


// =================================================================
// Timeline Calculation Helpers
// =================================================================

/**
 * Creates a timeline object based on forecast parameters.
 * This is the single source of truth for all date-related calculations.
 * @param inputs The user-provided forecast inputs.
 * @returns An object containing all relevant month arrays for the forecast.
 */
const createTimeline = (inputs: EngineInput) => {
    const { forecastMonths, preOrder } = inputs.parameters;
    
    // Month 0 is required if pre-order mode is on, OR if any product has a deposit.
    const requiresMonthZero = preOrder || inputs.products.some(p => (p.depositPct || 0) > 0);

    // If month 0 is required, the timeline runs from 0 to forecastMonths (e.g., 0-12 for a 12-month forecast).
    // The actual sales period (for weights) is still the number of forecast months.
    const timelineMonths = requiresMonthZero
      ? Array.from({ length: forecastMonths + 1 }, (_, i) => i) 
      : Array.from({ length: forecastMonths }, (_, i) => i + 1);

    const salesTimeline = requiresMonthZero
        ? Array.from({ length: forecastMonths + 1 }, (_, i) => i)
        : Array.from({ length: forecastMonths }, (_, i) => i + 1);
    
    return {
        forecastMonths,
        requiresMonthZero,
        timelineMonths,
        salesTimeline,
    };
};

type Timeline = ReturnType<typeof createTimeline>;


// =================================================================
// Revenue Calculation Engine
// =================================================================

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
        case 'seasonal': 
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
    return totalWeight > 0 ? weights.map(w => w / totalWeight) : Array(months).fill(0);
};

const calculateRevenue = (inputs: EngineInput, timeline: Timeline) => {
    const { products } = inputs;
    const { timelineMonths, salesTimeline } = timeline;
    const isManualMode = inputs.realtime.dataSource === 'Manual';

    const monthlyRevenueTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));
    const monthlyUnitsTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    const productBreakdown = products.map(product => {
        let soldUnits = 0;
        let totalRevenue = 0;
        
        if (isManualMode) {
            if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting.`);
            }
            soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
            totalRevenue = soldUnits * (product.sellPrice || 0);
            
            const salesWeights = getSalesWeights(salesTimeline.length, product.salesModel || 'launch');

            salesTimeline.forEach((month, i) => {
                 let monthlyProductUnits = soldUnits * salesWeights[i];
                 
                 const revenueTimelineMonth = monthlyRevenueTimeline.find(m => m.month === month);
                 if (revenueTimelineMonth) {
                     revenueTimelineMonth[product.productName] = (revenueTimelineMonth[product.productName] || 0) + (monthlyProductUnits * (product.sellPrice || 0));
                 }
 
                 const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === month);
                 if (unitsTimelineMonth) {
                     unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + monthlyProductUnits;
                 }
            });
        }
        
        return { name: product.productName, totalRevenue, totalSoldUnits: soldUnits };
    });
    
    const totalSoldUnits = productBreakdown.reduce((sum, p) => sum + p.totalSoldUnits, 0);
    const totalRevenue = productBreakdown.reduce((sum, p) => sum + p.totalRevenue, 0);

    const revenueSummary = {
        totalRevenue,
        avgRevenuePerUnit: totalSoldUnits > 0 ? totalRevenue / totalSoldUnits : 0,
        totalSoldUnits,
        productBreakdown,
        ltv: 0,
        cac: 0,
    };
    
    const allRevenueKeys = new Set<string>(['month', ...products.map(p => p.productName)]);
    const monthlyRevenue = monthlyRevenueTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allRevenueKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyRevenueSchema.parse(completeMonth);
    }).filter(Boolean);

    const allUnitKeys = new Set<string>(['month', ...products.map(p => p.productName)]);
    const monthlyUnitsSold = monthlyUnitsTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allUnitKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyUnitsSoldSchema.parse(completeMonth);
    }).filter(Boolean);
    
    return { revenueSummary, monthlyRevenue, monthlyUnitsSold };
};


// =================================================================
// Cost Calculation Engine
// =================================================================

const getAggregatedSalesWeights = (inputs: EngineInput, timeline: Timeline, startMonth: number): number[] => {
    const { salesTimeline } = timeline;
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    
    const relevantSalesTimeline = salesTimeline.filter(m => m >= startMonth);
    const aggregatedWeights = Array(relevantSalesTimeline.length).fill(0);
    let totalValue = 0;

    inputs.products.forEach(p => {
        const productValue = isManualMode ? (p.plannedUnits || 0) * (p.sellPrice || 0) : (p.sellPrice || 0);
        const productWeights = getSalesWeights(relevantSalesTimeline.length, p.salesModel || 'launch');
        productWeights.forEach((weight, i) => {
            aggregatedWeights[i] += weight * productValue;
        });
        totalValue += productValue;
    });

    if (totalValue === 0) return Array(relevantSalesTimeline.length).fill(1 / relevantSalesTimeline.length);
    return aggregatedWeights.map(w => w / totalValue);
};

const buildFixedCostTimeline = (inputs: EngineInput, timeline: Timeline): Record<string, number>[] => {
    const { timelineMonths, requiresMonthZero } = timeline;
    const monthlyCostTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Paid Up-Front';
        
        // Handle "Paid Up-Front" separately as a special case. It always happens in Month 0 if available.
        if (schedule === 'Paid Up-Front') {
            if (requiresMonthZero) {
                const upFrontMonth = monthlyCostTimeline.find(t => t.month === 0);
                if (upFrontMonth) {
                    const totalCost = cost.costType === 'Monthly Cost' ? cost.amount * timeline.forecastMonths : cost.amount;
                    upFrontMonth[cost.name] = (upFrontMonth[cost.name] || 0) + totalCost;
                }
            }
            return; // Stop processing for this cost item.
        }

        // --- Decision Tree for Start Month ---
        // Determine the starting month for all other allocation schedules.
        let allocationStartMonth = 1; // Default to Month 1
        if (requiresMonthZero) {
             // If month 0 exists, respect the user's choice.
            if (cost.startMonth === 'Month 0') {
                allocationStartMonth = 0;
            } else if (cost.startMonth === 'Up-front') {
                 // Treat "Up-front" selection as Month 0 for allocation purposes
                allocationStartMonth = 0;
            } else {
                // Default to Month 1 if not specified otherwise
                allocationStartMonth = 1;
            }
        }
        
        const allocationTimeline = monthlyCostTimeline.filter(t => t.month >= allocationStartMonth);
        const totalCostAmount = cost.costType === 'Monthly Cost' ? cost.amount * allocationTimeline.length : cost.amount;
        
        switch (schedule) {
            case 'Allocated Monthly':
                const monthlyAmount = (cost.costType === 'Monthly Cost' || allocationTimeline.length === 0) ? cost.amount : totalCostAmount / allocationTimeline.length;
                allocationTimeline.forEach(month => { month[cost.name] = (month[cost.name] || 0) + monthlyAmount; });
                break;

            case 'Allocated Quarterly':
                const quarters = Math.ceil(allocationTimeline.length / 3);
                if (quarters > 0) {
                    const quarterlyAmount = totalCostAmount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        if (q * 3 < allocationTimeline.length) {
                           allocationTimeline[q * 3][cost.name] = (allocationTimeline[q * 3][cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated According to Sales':
                const salesWeights = getAggregatedSalesWeights(inputs, timeline, allocationStartMonth);
                allocationTimeline.forEach((month, i) => {
                    if (salesWeights[i] !== undefined) {
                        month[cost.name] = (month[cost.name] || 0) + (totalCostAmount * salesWeights[i]);
                    }
                });
                break;
        }
    });
    return monthlyCostTimeline;
};

const calculateCosts = (inputs: EngineInput, timeline: Timeline) => {
    let totalPlannedUnits = 0, totalDepositsPaid = 0, totalFinalPayments = 0, totalVariableCost = 0;

    const variableCostBreakdown = inputs.products.map(product => {
        const plannedUnits = product.plannedUnits || 0;
        const totalProductionCost = plannedUnits * (product.unitCost || 0);
        const depositPaid = totalProductionCost * ((product.depositPct || 0) / 100);
        
        totalPlannedUnits += plannedUnits;
        totalDepositsPaid += depositPaid;
        totalFinalPayments += (totalProductionCost - depositPaid);
        totalVariableCost += totalProductionCost;

        return {
            name: product.productName, plannedUnits, unitCost: product.unitCost, totalProductionCost,
            depositPaid, remainingCost: totalProductionCost - depositPaid
        };
    });

    const monthlyFixedCostTimeline = buildFixedCostTimeline(inputs, timeline);
    
    // Add variable costs (deposits and final payments) to the timeline
    if (timeline.requiresMonthZero && totalDepositsPaid > 0) {
        const depositMonth = monthlyFixedCostTimeline.find(t => t.month === 0);
        if (depositMonth) depositMonth['Deposits'] = (depositMonth['Deposits'] || 0) + totalDepositsPaid;
    }
    
    const finalPaymentMonth = monthlyFixedCostTimeline.find(t => t.month === 1);
    if (finalPaymentMonth) finalPaymentMonth['Final Payments'] = (finalPaymentMonth['Final Payments'] || 0) + totalFinalPayments;
    
    // Calculate total fixed cost based on what's actually allocated in the timeline.
    const totalFixedCostInPeriod = inputs.fixedCosts.reduce((sum, cost) => {
        const startMonth = (timeline.requiresMonthZero && (cost.startMonth === 'Month 0' || cost.startMonth === 'Up-front')) ? 0 : 1;
        const allocationLength = timeline.timelineMonths.filter(m => m >= startMonth).length;
        
        if (cost.paymentSchedule === 'Paid Up-Front') {
            return sum + (cost.costType === 'Monthly Cost' ? cost.amount * timeline.forecastMonths : cost.amount);
        }
        
        return sum + (cost.costType === 'Monthly Cost' ? cost.amount * allocationLength : cost.amount)
    }, 0);


    const costSummary = {
        totalFixed: totalFixedCostInPeriod, totalVariable: totalVariableCost,
        totalOperating: totalFixedCostInPeriod + totalVariableCost,
        avgCostPerUnit: totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0,
        fixedCosts: inputs.fixedCosts, variableCosts: variableCostBreakdown,
        totalDepositsPaid, totalFinalPayments,
    };
    
    const allCostKeys = new Set<string>(['month', 'Deposits', 'Final Payments', ...inputs.fixedCosts.map(c => c.name)]);
    const monthlyCosts = monthlyFixedCostTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allCostKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyCostSchema.parse(completeMonth);
    }).filter(Boolean) as MonthlyCost[];
    
    return { costSummary, monthlyCosts };
};


// =================================================================
// Profit & Cash Flow Calculation Engine
// =================================================================

const calculateProfitAndCashFlow = (inputs: EngineInput, timeline: Timeline, revenueData: ReturnType<typeof calculateRevenue>, costData: ReturnType<typeof calculateCosts>) => {
    const { timelineMonths } = timeline;
    const { monthlyRevenue, monthlyUnitsSold, revenueSummary } = revenueData;
    const { monthlyCosts, costSummary } = costData;
    const { taxRate } = inputs.parameters;

    // Profit Calculation
    const monthlyProfit: MonthlyProfit[] = [];
    let cumulativeOperatingProfit = 0, profitBreakEvenMonth: number | null = null;
    
    for (const month of timelineMonths) {
        const totalMonthlyRevenue = Object.values(monthlyRevenue.find(r => r.month === month) || {})
            .reduce((s, v) => typeof v === 'number' ? s + v : s, 0);

        const totalMonthlyFixedCosts = Object.keys(monthlyCosts.find(c => c.month === month) || {})
            .filter(k => k !== 'month' && k !== 'Deposits' && k !== 'Final Payments')
            .reduce((s, k) => s + ((monthlyCosts.find(c => c.month === month) || {})[k] || 0), 0);
        
        const monthlyCOGS = Object.keys(monthlyUnitsSold.find(u => u.month === month) || {})
            .filter(k => k !== 'month')
            .reduce((s, pName) => {
                const product = inputs.products.find(p => p.productName === pName);
                const units = (monthlyUnitsSold.find(u => u.month === month) || {})[pName] || 0;
                return s + (units * (product?.unitCost || 0));
            }, 0);
        
        const grossProfit = totalMonthlyRevenue - monthlyCOGS;
        const operatingProfit = grossProfit - totalMonthlyFixedCosts;
        const netProfit = operatingProfit > 0 ? operatingProfit * (1 - (taxRate / 100)) : operatingProfit;
        
        monthlyProfit.push({ month, grossProfit, operatingProfit, netProfit });
        cumulativeOperatingProfit += operatingProfit;
        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
        }
    }
    
    const totalGrossProfit = monthlyProfit.reduce((s, p) => s + p.grossProfit, 0);
    const totalOperatingProfit = monthlyProfit.reduce((s, p) => s + p.operatingProfit, 0);
    const totalNetProfit = monthlyProfit.reduce((s, p) => s + p.netProfit, 0);

    const profitSummary = {
        totalGrossProfit, totalOperatingProfit, totalNetProfit,
        grossMargin: revenueSummary.totalRevenue > 0 ? (totalGrossProfit / revenueSummary.totalRevenue) * 100 : 0,
        operatingMargin: revenueSummary.totalRevenue > 0 ? (totalOperatingProfit / revenueSummary.totalRevenue) * 100 : 0,
        netMargin: revenueSummary.totalRevenue > 0 ? (totalNetProfit / revenueSummary.totalRevenue) * 100 : 0,
        breakEvenMonth: profitBreakEvenMonth,
    };

    // Cash Flow Calculation
    const monthlyCashFlow: MonthlyCashFlow[] = [];
    let cumulativeCash = 0, peakFundingNeed = 0, cashBreakEvenMonth: number | null = null;
    
    for (const month of timelineMonths) {
        const cashIn = Object.values(monthlyRevenue.find(r => r.month === month) || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);
        const cashOutCosts = Object.values(monthlyCosts.find(c => c.month === month) || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);
        const profitMonth = monthlyProfit.find(p => p.month === month);
        const cashOutTax = (profitMonth?.netProfit || 0) < (profitMonth?.operatingProfit || 0) ? (profitMonth?.operatingProfit || 0) - (profitMonth?.netProfit || 0) : 0;

        const netCashFlow = cashIn - cashOutCosts - cashOutTax;
        cumulativeCash += netCashFlow;

        if (cumulativeCash < peakFundingNeed) peakFundingNeed = cumulativeCash;
        if (cashBreakEvenMonth === null && cumulativeCash > 0 && month >= 1) cashBreakEvenMonth = month;

        monthlyCashFlow.push({ month, netCashFlow, cumulativeCash });
    }
    
    const avgMonthlyFixedCost = costSummary.totalFixed / timeline.forecastMonths;
    const runway = cumulativeCash > 0 && avgMonthlyFixedCost > 0 ? cumulativeCash / avgMonthlyFixedCost : (cumulativeCash > 0 ? Infinity : 0);

    const cashFlowSummary = {
        endingCashBalance: cumulativeCash, potentialCashBalance: 0,
        peakFundingNeed: Math.abs(peakFundingNeed),
        runway: isFinite(runway) ? runway : 0,
        breakEvenMonth: cashBreakEvenMonth,
    };
    
    return { profitSummary, monthlyProfit, cashFlowSummary, monthlyCashFlow };
};


// =================================================================
// Main Financial Engine Orchestrator
// =================================================================

function calculateScenario(inputs: EngineInput): EngineOutput {
    const timeline = createTimeline(inputs);
    const revenueData = calculateRevenue(inputs, timeline);
    const costData = calculateCosts(inputs, timeline);
    const profitAndCashFlowData = calculateProfitAndCashFlow(inputs, timeline, revenueData, costData);

    return {
        revenueSummary: revenueData.revenueSummary,
        monthlyRevenue: revenueData.monthlyRevenue,
        monthlyUnitsSold: revenueData.monthlyUnitsSold,
        costSummary: costData.costSummary,
        monthlyCosts: costData.monthlyCosts,
        profitSummary: profitAndCashFlowData.profitSummary,
        monthlyProfit: profitAndCashFlowData.monthlyProfit,
        cashFlowSummary: profitAndCashFlowData.cashFlowSummary,
        monthlyCashFlow: profitAndCashFlowData.monthlyCashFlow,
    };
}

export function calculateFinancials(inputs: EngineInput): EngineOutput {
    try {
        if (!inputs || !inputs.parameters || !inputs.products) throw new Error('Inputs not available.');
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) throw new Error('Forecast Months must be between 1 and 36.');
        inputs.products.forEach(p => {
             if (p.unitCost === undefined || p.sellPrice === undefined) throw new Error(`Product "${p.productName || 'Unnamed'}" must have a Unit Cost and Sales Price.`);
             if (p.unitCost > p.sellPrice && p.productName) console.warn(`Product "${p.productName}" has a Unit Cost higher than its Sales Price.`);
        });

        const achievedResult = calculateScenario(inputs);

        const potentialInputs = JSON.parse(JSON.stringify(inputs));
        potentialInputs.products.forEach((p: Product) => { p.sellThrough = 100; });
        
        const potentialResult = calculateScenario(potentialInputs);

        achievedResult.cashFlowSummary.potentialCashBalance = potentialResult.cashFlowSummary.endingCashBalance;
        return achievedResult;

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
