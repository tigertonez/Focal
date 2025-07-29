

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow, type BusinessHealth, RevenueSummarySchema, CostSummarySchema, ProfitSummarySchema, type BusinessHealthScoreKpi } from '@/lib/types';
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
    const { forecastMonths, preOrder } = inputs.parameters;
    const requiresMonthZero = preOrder;
    // Timeline for all calculations (costs, cash flow etc.)
    const timelineMonths = requiresMonthZero
      ? Array.from({ length: forecastMonths + 1 }, (_, i) => i) 
      : Array.from({ length: forecastMonths }, (_, i) => i + 1);

    // Sales can only happen from month 1 onwards, unless pre-order is active
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
            if (months > 2) {
                const remainingWeight = 0.1 / (months - 2);
                for(let i = 2; i < months; i++) weights[i] = remainingWeight;
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
            const totalUnitsToSell = Math.round((product.plannedUnits || 0) * ((product.sellThrough || 0) / 100));
            const salesWeights = getSalesWeights(salesTimeline.length, product.salesModel || 'launch');
            
            // Distribute units using integer logic to avoid floating point issues
            let distributedUnits = 0;
            const monthlyUnitDistribution = salesTimeline.map(month => {
                const unitsForMonth = Math.floor(totalUnitsToSell * salesWeights[salesTimeline.indexOf(month)]);
                distributedUnits += unitsForMonth;
                return unitsForMonth;
            });

            // Handle remainder
            let remainder = totalUnitsToSell - distributedUnits;
            let monthIndex = 0;
            while(remainder > 0) {
                monthlyUnitDistribution[monthIndex % monthlyUnitDistribution.length]++;
                remainder--;
                monthIndex++;
            }

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
    const { timelineMonths, requiresMonthZero } = timeline;
    const monthlyCostTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Paid Up-Front';
        
        let allocationStartMonth = 1;
        if (requiresMonthZero && (cost.startMonth === 'Month 0' || cost.startMonth === 'Up-front')) {
            allocationStartMonth = 0;
        }

        if (schedule === 'Paid Up-Front') {
            const totalCost = cost.costType === 'Monthly Cost' ? toCents(cost.amount * inputs.parameters.forecastMonths) : toCents(cost.amount);
            const upFrontMonth = monthlyCostTimeline.find(t => t.month === allocationStartMonth);
            if(upFrontMonth) upFrontMonth[cost.name] = (upFrontMonth[cost.name] || 0) + totalCost;
            return;
        }
        
        const allocationTimeline = monthlyCostTimeline.filter(t => t.month >= allocationStartMonth);
        
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
    const { preOrder } = inputs.parameters;
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
    const totalFinalPayments = variableCostBreakdown.reduce((sum, p) => sum + toCents(p.remainingCost), 0);
    
    const totalFixedCostInPeriod = inputs.fixedCosts.reduce((total, cost) => {
        if (cost.costType === 'Monthly Cost') {
            return total + toCents(cost.amount * inputs.parameters.forecastMonths);
        }
        return total + toCents(cost.amount); // 'Total for Period'
    }, 0);
    
    const cogsOfSoldGoods = inputs.products.reduce((total, product) => {
        const unitsSoldForProduct = monthlyUnitsSold.reduce((sum, month) => sum + (month[product.productName] || 0), 0);
        return total + toCents(unitsSoldForProduct * (product.unitCost || 0));
    }, 0);
    const cogsOfUnsoldGoods = totalVariableCost - cogsOfSoldGoods;

    const costSummary = {
        totalFixed: fromCents(totalFixedCostInPeriod),
        totalVariable: fromCents(totalVariableCost),
        totalOperating: fromCents(totalFixedCostInPeriod + totalVariableCost),
        avgCostPerUnit: totalPlannedUnits > 0 ? fromCents(totalVariableCost / totalPlannedUnits) : 0,
        fixedCosts: inputs.fixedCosts,
        variableCosts: variableCostBreakdown,
        totalDepositsPaid: fromCents(totalDepositsPaid),
        totalFinalPayments: fromCents(totalFinalPayments),
        cogsOfUnsoldGoods: fromCents(cogsOfUnsoldGoods),
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
    const { taxRate } = inputs.parameters;

    const monthlyCogs = timelineMonths.map(month => {
        const unitsSoldThisMonth = monthlyUnitsSold.find(u => u.month === month) || {};
        let cogs = 0;
        for (const product of inputs.products) {
            cogs += toCents((unitsSoldThisMonth[product.productName] || 0) * (product.unitCost || 0));
        }
        return { month, cogs };
    });

    const monthlyFixedCosts = timelineMonths.map(month => {
        const costsForMonth = monthlyCostTimeline.find(c => c.month === month) || {};
        let fixedCost = 0;
        for (const costItem of inputs.fixedCosts) {
            fixedCost += (costsForMonth[costItem.name] || 0); // Already in cents
        }
        return { month, fixedCost };
    });
    
    // First pass to determine overall profitability
    const totalRevenueCents = toCents(revenueSummary.totalRevenue);
    const cogsOfSoldGoods = monthlyCogs.reduce((acc, month) => acc + month.cogs, 0);
    const totalFixedCostCents = monthlyFixedCosts.reduce((acc, month) => acc + month.fixedCost, 0);
    const totalGrossProfit = totalRevenueCents - cogsOfSoldGoods;
    const totalOperatingProfit = totalGrossProfit - totalFixedCostCents;
    const businessIsProfitable = totalOperatingProfit > 0;

    let cumulativeOperatingProfit = 0, profitBreakEvenMonth: number | null = null;
    const monthlyProfit: MonthlyProfit[] = timelineMonths.map(month => {
        const revenueThisMonth = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);
        const cogsThisMonth = monthlyCogs.find(c => c.month === month)?.cogs || 0;
        const fixedCostsThisMonth = monthlyFixedCosts.find(f => f.month === month)?.fixedCost || 0;

        const grossProfit = revenueThisMonth - cogsThisMonth;
        const operatingProfit = grossProfit - fixedCostsThisMonth;
        
        // ** CORRECTED TAX LOGIC **
        // Only apply tax if the business is profitable OVERALL for the period
        const tax = (businessIsProfitable && operatingProfit > 0) ? Math.round(operatingProfit * (taxRate / 100)) : 0;
        const netProfit = operatingProfit - tax;

        cumulativeOperatingProfit += operatingProfit;
        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
        }

        return { 
            month, 
            grossProfit: fromCents(grossProfit), 
            operatingProfit: fromCents(operatingProfit), 
            netProfit: fromCents(netProfit) 
        };
    });
    
    const totalTaxAmount = monthlyProfit.reduce((acc, month) => {
        const operatingProfitCents = toCents(month.operatingProfit);
        const netProfitCents = toCents(month.netProfit);
        return acc + (operatingProfitCents - netProfitCents);
    }, 0);
    const totalNetProfit = totalOperatingProfit - totalTaxAmount;

    // Calculate product-level net margins and their weights
    const productMargins = inputs.products.map(product => {
        const revenueBreakdown = revenueSummary.productBreakdown.find(p => p.name === product.productName);
        if (!revenueBreakdown || revenueBreakdown.totalRevenue === 0) {
            return { weight: 0, margin: 0 };
        }
        
        const productRevenueCents = toCents(revenueBreakdown.totalRevenue);
        
        const unitsSoldForProduct = monthlyUnitsSold.reduce((sum, month) => sum + (month[product.productName] || 0), 0);
        const productCogsCents = toCents(unitsSoldForProduct * (product.unitCost || 0));
        
        const productGrossProfitCents = productRevenueCents - productCogsCents;
        
        const revenueShare = totalRevenueCents > 0 ? productRevenueCents / totalRevenueCents : 0;
        const allocatedFixedCostsCents = Math.round(totalFixedCostCents * revenueShare);
        
        const productOperatingProfitCents = productGrossProfitCents - allocatedFixedCostsCents;
        
        // ** CORRECTED TAX LOGIC for products **
        const productTaxCents = (businessIsProfitable && productOperatingProfitCents > 0)
            ? Math.round(productOperatingProfitCents * (taxRate / 100))
            : 0;
            
        const productNetProfitCents = productOperatingProfitCents - productTaxCents;
            
        const netMargin = (productRevenueCents > 0) ? (productNetProfitCents / productRevenueCents) * 100 : 0;
        
        return {
            weight: revenueShare,
            margin: netMargin,
        };
    });

    const weightedAvgNetMargin = productMargins.reduce((acc, curr) => acc + (curr.margin * curr.weight), 0);

    const profitSummary = {
        totalGrossProfit: fromCents(totalGrossProfit),
        totalOperatingProfit: fromCents(totalOperatingProfit),
        totalNetProfit: fromCents(totalNetProfit),
        grossMargin: totalRevenueCents > 0 ? (totalGrossProfit / totalRevenueCents) * 100 : 0,
        operatingMargin: totalRevenueCents > 0 ? (totalOperatingProfit / totalRevenueCents) * 100 : 0,
        netMargin: totalRevenueCents > 0 ? (totalNetProfit / totalRevenueCents) * 100 : 0,
        breakEvenMonth: profitBreakEvenMonth,
        weightedAvgNetMargin,
    };

    let cumulativeCash = 0, peakFundingNeed = 0, cashBreakEvenMonth: number | null = null;
    
    const monthlyCashFlow: MonthlyCashFlow[] = timelineMonths.map(month => {
        const cashIn = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);
        
        const costsThisMonth = monthlyCostTimeline.find(c => c.month === month) || {};
        let cashOutCosts = Object.entries(costsThisMonth).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);

        const profitMonth = monthlyProfit.find(p => p.month === month);
        const operatingProfitThisMonthCents = toCents(profitMonth?.operatingProfit);
        const netProfitThisMonthCents = toCents(profitMonth?.netProfit);
        const cashOutTax = operatingProfitThisMonthCents - netProfitThisMonthCents; // Already correctly calculated based on businessIsProfitable

        const netCashFlow = cashIn - cashOutCosts - cashOutTax;
        cumulativeCash += netCashFlow;

        if (cumulativeCash < peakFundingNeed) peakFundingNeed = cumulativeCash;
        if (cashBreakEvenMonth === null && cumulativeCash > 0 && month >= 1) cashBreakEvenMonth = month;

        return { 
            month, 
            netCashFlow: fromCents(netCashFlow), 
            cumulativeCash: fromCents(cumulativeCash) 
        };
    });
    
    const avgMonthlyFixedCost = fromCents(totalFixedCostCents) / timeline.forecastMonths;
    const finalEndingCash = fromCents(cumulativeCash);
    const runway = finalEndingCash > 0 && avgMonthlyFixedCost > 0 ? finalEndingCash / avgMonthlyFixedCost : (finalEndingCash > 0 ? Infinity : 0);

    const cashFlowSummary = {
        endingCashBalance: finalEndingCash, 
        potentialCashBalance: 0,
        peakFundingNeed: fromCents(Math.abs(peakFundingNeed)),
        runway: isFinite(runway) ? runway : 0,
        breakEvenMonth: cashBreakEvenMonth,
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
    const totalCogs = summaries.cost.totalVariable - summaries.cost.cogsOfUnsoldGoods;
    const contributionMargin = summaries.revenue.totalRevenue > 0 ? ((summaries.revenue.totalRevenue - totalCogs) / summaries.revenue.totalRevenue) * 100 : 0;
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
            tooltip: 'Months of operation your cash reserves can cover. Scored on a scale from 0 months (score: 0) to 12+ months (score: 100).'
        },
        { 
            label: 'Contribution Margin', 
            value: normalize(contributionMargin, 10, 60), 
            weight: weights.contributionMargin,
            tooltip: 'Measures per-unit profitability before fixed costs. Scored on a scale from 10% (score: 0) to 60%+ (score: 100).'
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
