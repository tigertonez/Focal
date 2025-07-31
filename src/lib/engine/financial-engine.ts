

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow, type BusinessHealth, RevenueSummarySchema, CostSummarySchema, type BusinessHealthScoreKpi, ProfitSummarySchema, CashFlowSummarySchema } from '@/lib/types';
import type { MonthlyCost } from '@/lib/types';


// =================================================================
// Cents-based arithmetic helpers to avoid floating point issues
// =================================================================

const toCents = (val: number | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    // Multiply by 100 and round to the nearest integer to prevent precision errors.
    return Math.round(val * 100);
}

const fromCents = (val: number): number => {
    // Simply divide by 100 to get the dollar/euro value.
    return val / 100;
}


// =================================================================
// Timeline Calculation Helpers
// =================================================================

const createTimeline = (inputs: EngineInput) => {
    const { forecastMonths } = inputs.parameters;
    const preOrder = inputs.company?.production === 'preorder';

    // Timeline for all calculations (costs, cash flow etc.)
    const timelineMonths = preOrder
      ? Array.from({ length: forecastMonths + 1 }, (_, i) => i)
      : Array.from({ length: forecastMonths }, (_, i) => i + 1);

    // Sales can happen from M0 in pre-order, otherwise start from M1.
    const salesTimeline = preOrder
        ? Array.from({ length: forecastMonths + 1 }, (_, i) => i)
        : Array.from({ length: forecastMonths }, (_, i) => i + 1);
    
    return {
        forecastMonths,
        requiresMonthZero: preOrder,
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
             if (months > 2) {
                weights[2] = 0.1;
             } else if (months === 2) {
                weights[1] += 0.1; // Add the remainder to the last available month
             } else if (months === 1) {
                weights[0] += 0.4; // Add all to the first month
             }
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

const calculateRevenue = (inputs: EngineInput, timeline: Timeline, monthlyUnitsTimeline: Record<string, number>[]) => {
    const { products } = inputs;
    const { timelineMonths } = timeline;

    const monthlyRevenueTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    const productBreakdown = products.map(product => {
        const soldUnitsData = monthlyUnitsTimeline.map(m => m[product.productName] || 0);
        const totalSoldUnits = soldUnitsData.reduce((sum, units) => sum + units, 0);
        const totalRevenue = toCents(totalSoldUnits * (product.sellPrice || 0));

        timelineMonths.forEach((month, i) => {
             const revenueTimelineMonth = monthlyRevenueTimeline.find(m => m.month === month);
             if (revenueTimelineMonth) {
                 revenueTimelineMonth[product.productName] = toCents(soldUnitsData[i] * (product.sellPrice || 0));
             }
        });

        return { name: product.productName, totalRevenue, totalSoldUnits };
    });

    const totalSoldUnits = productBreakdown.reduce((sum, p) => sum + p.totalSoldUnits, 0);
    const totalRevenue = productBreakdown.reduce((sum, p) => sum + p.totalRevenue, 0);

    const revenueSummary = {
        totalRevenue: fromCents(totalRevenue),
        avgRevenuePerUnit: totalSoldUnits > 0 ? fromCents(totalRevenue / totalSoldUnits) : 0,
        totalSoldUnits,
        productBreakdown: productBreakdown.map(p => ({...p, totalRevenue: fromCents(p.totalRevenue)})),
        ltv: 0,
        cac: 0,
    };

    const allRevenueKeys = new Set<string>(['month', ...products.map(p => p.productName)]);
    const monthlyRevenue = monthlyRevenueTimeline.map(monthData => {
        const completeMonth: Record<string, any> = { month: monthData.month };
        allRevenueKeys.forEach(key => {
            if (key !== 'month') {
                completeMonth[key] = fromCents(monthData[key] || 0);
            }
        });
        return MonthlyRevenueSchema.parse(completeMonth);
    });

    return { revenueSummary, monthlyRevenue, monthlyRevenueTimeline }; // Return cents-based timeline
};

const calculateUnitsSold = (inputs: EngineInput, timeline: Timeline) => {
    const { products } = inputs;
    const { timelineMonths, salesTimeline } = timeline;
    const isManualMode = inputs.realtime.dataSource === 'Manual';

    const monthlyUnitsTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    products.forEach(product => {
        const isLowVolume = product.plannedUnits !== undefined && product.plannedUnits >= 1 && product.plannedUnits <= 10;

        if (isLowVolume) {
            if (product.plannedUnits && product.estimatedSales) {
                product.sellThrough = (product.estimatedSales / product.plannedUnits) * 100;
            } else {
                product.sellThrough = 0;
            }
        }

        if (isManualMode && isLowVolume) {
            const soldUnits = Math.round(product.estimatedSales || 0);
            const saleMonth = product.saleMonth === 0 || product.saleMonth ? product.saleMonth : 1; // Default to month 1
            const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === saleMonth);
            if (unitsTimelineMonth) {
                unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + soldUnits;
            }
        } else if (isManualMode) {
            if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting.`);
            }

            // --- AXIOM ENFORCEMENT & ROBUST DISTRIBUTION ---
            // 1. Calculate the EXACT total units to sell. This is the source of truth.
            const totalUnitsToSell = Math.round((product.plannedUnits || 0) * ((product.sellThrough || 0) / 100));
            const salesWeights = getSalesWeights(salesTimeline.length, product.salesModel || 'launch');

            // 2. Calculate the initial distribution with flooring, and track the error.
            let distributedUnits = 0;
            const monthlyUnitDistribution = salesWeights.map(weight => {
                const unitsForMonth = Math.floor(totalUnitsToSell * weight);
                distributedUnits += unitsForMonth;
                return unitsForMonth;
            });

            // 3. Calculate the remainder and distribute it intelligently.
            let remainder = totalUnitsToSell - distributedUnits;
            if (remainder > 0) {
                // Create an array of month indices, sorted by their weight, to distribute remainder to most significant months first.
                const sortedMonthIndices = salesWeights
                    .map((weight, index) => ({ weight, index }))
                    .sort((a, b) => b.weight - a.weight)
                    .map(item => item.index);

                // Distribute the remainder one by one to the months with the highest weights.
                for (let i = 0; i < remainder; i++) {
                    const monthIndexToIncrement = sortedMonthIndices[i % sortedMonthIndices.length];
                    monthlyUnitDistribution[monthIndexToIncrement]++;
                }
            }
            // --- END OF NEW LOGIC ---

            salesTimeline.forEach((month, i) => {
                const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === month);
                if (unitsTimelineMonth) {
                    unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + monthlyUnitDistribution[i];
                }
            });
        }
    });

    const allUnitKeys = new Set<string>(['month', ...products.map(p => p.productName)]);
    const monthlyUnitsSold = monthlyUnitsTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allUnitKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyUnitsSoldSchema.parse(completeMonth);
    }).filter(Boolean);

    return { monthlyUnitsSold, monthlyUnitsTimeline };
};


// =================================================================
// Cost Calculation Engine
// =================================================================

const buildFixedCostTimeline = (inputs: EngineInput, timeline: Timeline): Record<string, number>[] => {
    const { timelineMonths } = timeline;
    const monthlyCostTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'monthly_from_m0';

        let startMonth = 1;
        if (schedule.endsWith('_m0')) startMonth = 0;

        // Handle one-time, up-front payments
        if (schedule === 'up_front_m0') {
             const totalCost = cost.costType === 'Monthly Cost' ? toCents(cost.amount * timeline.forecastMonths) : toCents(cost.amount);
             const upFrontMonth = monthlyCostTimeline.find(t => t.month === 0);
             if(upFrontMonth) upFrontMonth[cost.name] = (upFrontMonth[cost.name] || 0) + totalCost;
             return;
        }

        // Handle monthly allocated costs
        const allocationTimeline = monthlyCostTimeline.filter(t => t.month >= startMonth);
        if (cost.costType === 'Monthly Cost') {
             allocationTimeline.forEach(month => { month[cost.name] = (month[cost.name] || 0) + toCents(cost.amount); });
        } else { // Total for Period, allocated monthly
            const totalCostAmount = toCents(cost.amount);
            const monthlyAmount = allocationTimeline.length > 0 ? Math.floor(totalCostAmount / allocationTimeline.length) : 0;
            let remainder = allocationTimeline.length > 0 ? totalCostAmount % allocationTimeline.length : 0;

            allocationTimeline.forEach((month, index) => {
                let amountThisMonth = monthlyAmount;
                if(remainder > 0) {
                    amountThisMonth++;
                    remainder--;
                }
                month[cost.name] = (month[cost.name] || 0) + amountThisMonth;
            });
        }
    });
    return monthlyCostTimeline;
};

const calculateCosts = (inputs: EngineInput, timeline: Timeline, monthlyUnitsSold: Record<string, number>[]) => {
    const preOrder = inputs.company?.production === 'preorder';
    const monthlyCostTimeline = buildFixedCostTimeline(inputs, timeline);
    let totalPlannedUnits = 0, totalVariableCost = 0;

    const variableCostBreakdown = inputs.products.map(product => {
        const plannedUnits = product.plannedUnits || 0;
        const totalProductionCost = toCents(plannedUnits * (product.unitCost || 0));
        const depositPaid = Math.round(totalProductionCost * ((product.depositPct || 0) / 100));

        if (product.costModel === 'monthly') {
            monthlyCostTimeline.forEach(month => {
                const unitsThisMonth = (monthlyUnitsSold.find(u => u.month === month.month) || {})[product.productName] || 0;
                if (unitsThisMonth > 0) {
                    month[product.productName] = (month[product.productName] || 0) + toCents(unitsThisMonth * (product.unitCost || 0));
                }
            });
        } else {
            const remainingCost = totalProductionCost - depositPaid;
            if (preOrder) {
                const month0 = monthlyCostTimeline.find(t => t.month === 0);
                if (month0) month0['Deposits'] = (month0['Deposits'] || 0) + depositPaid;

                const month1 = monthlyCostTimeline.find(t => t.month === 1);
                if (month1) month1['Final Payments'] = (month1['Final Payments'] || 0) + remainingCost;
            } else {
                const month1 = monthlyCostTimeline.find(t => t.month === 1);
                if (month1) month1['Final Payments'] = (month1['Final Payments'] || 0) + totalProductionCost;
            }
        }

        totalPlannedUnits += plannedUnits;
        totalVariableCost += totalProductionCost;

        return {
            name: product.productName, plannedUnits, unitCost: fromCents(toCents(product.unitCost)),
            totalProductionCost: fromCents(totalProductionCost),
            depositPaid: fromCents(depositPaid),
            remainingCost: fromCents(totalProductionCost - depositPaid)
        };
    });

    const totalDepositsPaid = variableCostBreakdown.reduce((sum, p) => sum + toCents(p.depositPaid), 0);

    // Calculate total fixed cost for each item for the entire period
    const calculatedFixedCosts = inputs.fixedCosts.map(cost => {
        let totalAmount = 0;
        if (cost.costType === 'Monthly Cost') {
             // For monthly costs, the total is amount * forecast duration
             totalAmount = cost.amount * inputs.parameters.forecastMonths;
        } else { // 'Total for Period'
            totalAmount = cost.amount;
        }
        return { ...cost, amount: totalAmount };
    });

    const totalFixedCostInPeriod = calculatedFixedCosts.reduce((total, cost) => total + toCents(cost.amount), 0);

    const cogsOfSoldGoods = inputs.products.reduce((total, product) => {
        const unitsSoldForProduct = monthlyUnitsSold.reduce((sum, month) => sum + (month[product.productName] || 0), 0);
        return total + toCents(unitsSoldForProduct * (product.unitCost || 0));
    }, 0);
    const cogsOfUnsoldGoods = totalVariableCost - cogsOfSoldGoods;

    const costSummary = {
        totalFixed: fromCents(totalFixedCostInPeriod),
        totalVariable: fromCents(totalVariableCost),
        totalOperating: fromCents(totalFixedCostInPeriod + cogsOfSoldGoods), // Corrected: OpCost for P&L is Fixed + COGS
        avgCostPerUnit: totalPlannedUnits > 0 ? fromCents(totalVariableCost / totalPlannedUnits) : 0,
        fixedCosts: calculatedFixedCosts,
        variableCosts: variableCostBreakdown,
        totalDepositsPaid: fromCents(totalDepositsPaid),
        totalFinalPayments: fromCents(totalVariableCost - totalDepositsPaid),
        cogsOfUnsoldGoods: fromCents(cogsOfUnsoldGoods),
        cogsOfSoldGoods: fromCents(cogsOfSoldGoods),
    };

    const allCostKeys = new Set<string>(['month', 'Deposits', 'Final Payments', ...inputs.fixedCosts.map(c => c.name), ...inputs.products.filter(p => p.costModel === 'monthly').map(p => p.productName)]);
    const monthlyCosts = monthlyCostTimeline.map(monthData => {
        const completeMonth: Record<string, any> = { month: monthData.month };
        allCostKeys.forEach(key => {
            if (key !== 'month') {
                completeMonth[key] = fromCents(monthData[key] || 0);
            }
        });
        return MonthlyCostSchema.parse(completeMonth);
    }) as MonthlyCost[];

    return { costSummary, monthlyCosts, monthlyCostTimeline }; // Return cents-based timeline
};


// =================================================================
// Profit & Cash Flow Calculation Engine
// =================================================================

const calculateProfitAndCashFlow = (
    inputs: EngineInput,
    timeline: Timeline,
    revenueData: ReturnType<typeof calculateRevenue>,
    costData: ReturnType<typeof calculateCosts>,
    monthlyUnitsSold: Record<string, number>[]
) => {
    const { timelineMonths } = timeline;
    const { revenueSummary, monthlyRevenueTimeline } = revenueData;
    const { costSummary, monthlyCostTimeline } = costData;
    const { taxRate, accountingMethod, forecastMonths } = inputs.parameters;

    // --- START: PROFIT CALCULATION ---
    const totalRevenueCents = toCents(revenueSummary.totalRevenue);

    const variableCostsForPL = accountingMethod === 'cogs'
        ? toCents(costSummary.cogsOfSoldGoods)
        : toCents(costSummary.totalVariable);

    const totalGrossProfit = totalRevenueCents - variableCostsForPL;

    // Corrected Total Fixed Cost Calculation for P&L
    const totalFixedCostForPL = inputs.fixedCosts.reduce((acc, cost) => {
        if (cost.costType === 'Monthly Cost') {
            return acc + toCents(cost.amount * forecastMonths);
        }
        return acc + toCents(cost.amount);
    }, 0);


    const totalOperatingProfit = totalGrossProfit - totalFixedCostForPL;

    const businessIsProfitable = totalOperatingProfit > 0;
    const totalTaxAmount = businessIsProfitable ? Math.round(totalOperatingProfit * (taxRate / 100)) : 0;
    const totalNetProfit = totalOperatingProfit - totalTaxAmount;

    let cumulativeOperatingProfit = 0;
    let profitBreakEvenMonth: number | null = null;
    let cumulativeTax = 0;

    // Monthly Fixed Cost for P&L (consistent allocation)
    const monthlyFixedCostForPL = totalFixedCostForPL / forecastMonths;

    const monthlyProfit: MonthlyProfit[] = timelineMonths.map((month) => {
        if (month === 0) {
            return { month, grossProfit: 0, operatingProfit: 0, netProfit: 0, plOperatingCosts: 0, tax: 0 };
        }

        const revenueThisMonth = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);

        let variableCostsThisMonth = 0;
        if (accountingMethod === 'cogs') {
            const unitsSoldThisMonth = monthlyUnitsSold.find(u => u.month === month) || {};
            for (const product of inputs.products) {
                 variableCostsThisMonth += toCents((unitsSoldThisMonth[product.productName] || 0) * (product.unitCost || 0));
            }
        } else { // Conservative ("total_costs")
             for (const product of inputs.products) {
                if (product.costModel === 'monthly') {
                    const unitsSoldThisMonth = monthlyUnitsSold.find(u => u.month === month) || {};
                    variableCostsThisMonth += toCents((unitsSoldThisMonth[product.productName] || 0) * (product.unitCost || 0));
                } else { // Batch costs are fully expensed in Month 1 for P&L
                    if (month === 1) {
                         variableCostsThisMonth += toCents((product.plannedUnits || 0) * (product.unitCost || 0));
                    }
                }
            }
        }

        const plOperatingCosts = monthlyFixedCostForPL + variableCostsThisMonth;
        const grossProfit = revenueThisMonth - variableCostsThisMonth;
        const operatingProfit = grossProfit - monthlyFixedCostForPL;

        const prevCumulativeProfit = cumulativeOperatingProfit;
        cumulativeOperatingProfit += operatingProfit;

        let tax = 0;
        if (businessIsProfitable && cumulativeOperatingProfit > 0) {
            const taxableProfitThisPeriod = Math.max(0, cumulativeOperatingProfit) - Math.max(0, prevCumulativeProfit);
            if (taxableProfitThisPeriod > 0) {
                tax = Math.round(taxableProfitThisPeriod * (taxRate / 100));
            }
        }
        cumulativeTax += tax;

        const netProfit = operatingProfit - tax;

        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
        }

        return {
            month,
            grossProfit: fromCents(grossProfit),
            operatingProfit: fromCents(operatingProfit),
            netProfit: fromCents(netProfit),
            plOperatingCosts: fromCents(plOperatingCosts),
            tax: fromCents(tax),
        };
    });
    
    // Final check for tax rounding issues
    const finalTaxAdjustment = totalTaxAmount - cumulativeTax;
    if (Math.abs(finalTaxAdjustment) > 0 && monthlyProfit.length > 1) {
        const lastMonthProfit = monthlyProfit[monthlyProfit.length -1];
        lastMonthProfit.tax += fromCents(finalTaxAdjustment);
        lastMonthProfit.netProfit -= fromCents(finalTaxAdjustment);
    }
    

    const profitSummary = {
        totalGrossProfit: fromCents(totalGrossProfit),
        totalOperatingProfit: fromCents(totalOperatingProfit),
        totalNetProfit: fromCents(totalNetProfit),
        grossMargin: totalRevenueCents > 0 ? (totalGrossProfit / totalRevenueCents) * 100 : 0,
        operatingMargin: totalRevenueCents > 0 ? (totalOperatingProfit / totalRevenueCents) * 100 : 0,
        netMargin: totalRevenueCents > 0 ? (totalNetProfit / totalRevenueCents) * 100 : 0,
        breakEvenMonth: profitBreakEvenMonth,
    };

    // --- END: PROFIT CALCULATION ---


    // --- START: CASH FLOW CALCULATION ---
    let cumulativeCash = 0, peakFundingNeed = 0;

    const monthlyCashFlow: MonthlyCashFlow[] = timelineMonths.map(month => {
        const cashIn = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);

        const costsForMonth = monthlyCostTimeline.find(c => c.month === month) || {};
        const cashOutCosts = Object.entries(costsForMonth).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);

        const taxPaymentCents = toCents((monthlyProfit.find(p => p.month === month)?.tax || 0));

        const netCashFlow = cashIn - cashOutCosts - taxPaymentCents;

        cumulativeCash += netCashFlow;

        if (cumulativeCash < peakFundingNeed) peakFundingNeed = cumulativeCash;

        return {
            month,
            netCashFlow: fromCents(netCashFlow),
            cumulativeCash: fromCents(cumulativeCash)
        };
    });

    let cashPositiveMonth: number | null = null;
    const lastNegativeMonthIndex = monthlyCashFlow.map(cf => cf.cumulativeCash).findLastIndex(c => c < 0);

    if (lastNegativeMonthIndex === -1 && monthlyCashFlow[0] && monthlyCashFlow[0].cumulativeCash >= 0) {
        cashPositiveMonth = monthlyCashFlow[0].month;
    }
    else if (lastNegativeMonthIndex < monthlyCashFlow.length - 1) {
         cashPositiveMonth = monthlyCashFlow[lastNegativeMonthIndex + 1].month;
    }

    const avgMonthlyBurnRate = fromCents(totalFixedCostForPL) / timeline.forecastMonths;
    const finalEndingCash = fromCents(cumulativeCash);

    const runway = finalEndingCash > 0 && avgMonthlyBurnRate > 0
        ? finalEndingCash / avgMonthlyBurnRate
        : (finalEndingCash > 0 ? Infinity : 0);

    const cashFlowSummary = {
        endingCashBalance: finalEndingCash,
        potentialCashBalance: 0,
        peakFundingNeed: fromCents(Math.abs(peakFundingNeed)),
        runway: isFinite(runway) ? runway : 0,
        cashPositiveMonth: cashPositiveMonth,
        estimatedTaxes: fromCents(totalTaxAmount),
    };

    return { profitSummary, monthlyProfit, cashFlowSummary, monthlyCashFlow };
};


// =================================================================
// Business Health Score Calculation
// =================================================================

const normalize = (value: number, min: number, max: number, inverse: boolean = false): number => {
    const clampedValue = Math.max(min, Math.min(value, max));
    const normalized = (clampedValue - min) / (max - min);
    const score = (inverse ? 1 - normalized : normalized) * 100;
    return Math.max(0, Math.min(score, 100));
};

const calculateBusinessHealth = (
    inputs: EngineInput,
    summaries: {
        revenue: ReturnType<typeof RevenueSummarySchema.parse>,
        cost: ReturnType<typeof CostSummarySchema.parse>,
        profit: ReturnType<typeof ProfitSummarySchema.parse>,
        cash: ReturnType<typeof CashFlowSummarySchema.parse>
    }
): BusinessHealth => {
    const weights = {
        netMargin: 0.25, cashRunway: 0.20, contributionMargin: 0.15,
        peakFunding: 0.15, sellThrough: 0.15, breakEven: 0.10,
    };

    const netMargin = summaries.profit.netMargin;
    const cashRunway = summaries.cash.runway;

    // Contribution Margin is Revenue minus the COGS of *sold* items.
    const contributionMargin = summaries.revenue.totalRevenue > 0 ?
      ((summaries.revenue.totalRevenue - summaries.cost.cogsOfSoldGoods) / summaries.revenue.totalRevenue) * 100
      : 0;

    const peakFundingNeed = summaries.cash.peakFundingNeed;
    const avgSellThrough = inputs.products.length > 0
        ? inputs.products.reduce((acc, p) => acc + (p.sellThrough || 0), 0) / inputs.products.length
        : 0;
    const breakEvenMonths = summaries.profit.breakEvenMonth || inputs.parameters.forecastMonths + 1;

    const kpis: BusinessHealthScoreKpi[] = [
        {
            label: 'Net Margin',
            value: normalize(netMargin, 0, 25),
            weight: weights.netMargin,
            tooltip: 'Measures final profit as a % of revenue. Scored on a scale from 0% (score: 0) to 25%+ (score: 100).'
        },
        {
            label: 'Cash Runway',
            value: normalize(cashRunway, 0, 12),
            weight: weights.cashRunway,
            tooltip: 'Months of operation your cash reserves can cover based on your fixed costs. Scored on a scale from 0 months (score: 0) to 12+ months (score: 100).'
        },
        {
            label: 'Contribution Margin',
            value: normalize(contributionMargin, 10, 60),
            weight: weights.contributionMargin,
            tooltip: 'Measures per-unit profitability (Revenue - COGS). Scored on a scale from 10% (score: 0) to 60%+ (score: 100).'
        },
        {
            label: 'Peak Funding',
            value: normalize(peakFundingNeed, 0, summaries.revenue.totalRevenue * 0.5, true),
            weight: weights.peakFunding,
            tooltip: 'The minimum capital needed. Scored inversely; a lower need (relative to revenue) is better.'
        },
        {
            label: 'Sell-Through',
            value: normalize(avgSellThrough, 50, 100),
            weight: weights.sellThrough,
            tooltip: 'The % of inventory you expect to sell. Scored on a scale from 50% (score: 0) to 100% (score: 100).'
        },
        {
            label: 'Break-Even',
            value: normalize(breakEvenMonths, 1, 12, true),
            weight: weights.breakEven,
            tooltip: 'The months until profitability. Scored inversely; a shorter time to break-even is better (12 months = 0, 1 month = 100).'
        },
    ];

    const finalScore = kpis.reduce((acc, kpi) => acc + (kpi.value * kpi.weight), 0);

    return {
        score: finalScore,
        kpis,
    };
};


// =================================================================
// Main Financial Engine Orchestrator
// =================================================================

export function calculateFinancials(inputs: EngineInput, isPotentialCalculation = false): EngineOutput {
    try {
        if (!inputs || !inputs.parameters || !inputs.products) throw new Error('Inputs not available.');
        if (inputs.parameters.forecastMonths > 36 || inputs.parameters.forecastMonths < 1) throw new Error('Forecast Months must be between 1 and 36.');
        inputs.products.forEach(p => {
             if (p.unitCost === undefined || p.sellPrice === undefined) throw new Error(`Product "${p.productName || 'Unnamed'}" must have a Unit Cost and Sales Price.`);
             if (p.unitCost > p.sellPrice && p.productName) console.warn(`Product "${p.productName}" has a Unit Cost higher than its Sales Price.`);
        });

        const timeline = createTimeline(inputs);
        const { monthlyUnitsSold, monthlyUnitsTimeline } = calculateUnitsSold(inputs, timeline);
        const revenueData = calculateRevenue(inputs, timeline, monthlyUnitsTimeline);
        const costData = calculateCosts(inputs, timeline, monthlyUnitsSold);
        const profitAndCashFlowData = calculateProfitAndCashFlow(inputs, timeline, revenueData, costData, monthlyUnitsSold);

        const achievedResult = {
            revenueSummary: revenueData.revenueSummary,
            monthlyRevenue: revenueData.monthlyRevenue,
            monthlyUnitsSold,
            costSummary: costData.costSummary,
            monthlyCosts: costData.monthlyCosts,
            ...profitAndCashFlowData
        };

        if (isPotentialCalculation) {
            return {
                ...achievedResult,
                businessHealth: undefined,
            };
        }

        const potentialInputs = JSON.parse(JSON.stringify(inputs));
        potentialInputs.products.forEach((p: Product) => {
            p.sellThrough = 100;
            if (p.plannedUnits >= 1 && p.plannedUnits <= 10) {
                p.estimatedSales = p.plannedUnits;
            }
        });

        const potentialResult = calculateFinancials(potentialInputs, true);

        const healthScore = calculateBusinessHealth(inputs, {
            revenue: achievedResult.revenueSummary,
            cost: achievedResult.costSummary,
            profit: achievedResult.profitSummary,
            cash: achievedResult.cashFlowSummary
        });

        const finalResult: EngineOutput = {
            ...achievedResult,
            cashFlowSummary: {
                ...achievedResult.cashFlowSummary,
                potentialCashBalance: potentialResult.cashFlowSummary.endingCashBalance
            },
            profitSummary: {
                ...achievedResult.profitSummary,
                potentialGrossProfit: potentialResult.profitSummary.totalGrossProfit,
            },
            businessHealth: healthScore,
        };

        return finalResult;

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
