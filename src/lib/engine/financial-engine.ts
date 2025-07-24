

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow, type BusinessHealth, RevenueSummarySchema, CostSummarySchema, ProfitSummarySchema, CashFlowSummarySchema, type BusinessHealthScoreKpi } from '@/lib/types';
import type { MonthlyCost } from '@/lib/types';
import { formatCurrency, formatNumber } from '../utils';


// =================================================================
// Timeline Calculation Helpers
// =================================================================

const createTimeline = (inputs: EngineInput) => {
    const { forecastMonths, preOrder } = inputs.parameters;
    const requiresMonthZero = preOrder || inputs.products.some(p => (p.depositPct || 0) > 0);
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

const calculateRevenue = (inputs: EngineInput, timeline: Timeline, monthlyUnitsTimeline: Record<string, number>[]) => {
    const { products } = inputs;
    const { timelineMonths } = timeline;

    const monthlyRevenueTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    const productBreakdown = products.map(product => {
        let totalRevenue = 0;
        const soldUnitsData = monthlyUnitsTimeline.map(m => m[product.productName] || 0);
        const totalSoldUnits = soldUnitsData.reduce((sum, units) => sum + units, 0);
        totalRevenue = totalSoldUnits * (product.sellPrice || 0);
        
        timelineMonths.forEach((month, i) => {
             const revenueTimelineMonth = monthlyRevenueTimeline.find(m => m.month === month);
             if (revenueTimelineMonth) {
                 revenueTimelineMonth[product.productName] = (revenueTimelineMonth[product.productName] || 0) + (soldUnitsData[i] * (product.sellPrice || 0));
             }
        });
        
        return { name: product.productName, totalRevenue, totalSoldUnits };
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
    
    return { revenueSummary, monthlyRevenue };
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
            const soldUnits = product.estimatedSales || 0;
            const saleMonth = product.saleMonth === 0 || product.saleMonth ? product.saleMonth : 1; // Default to month 1
            const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === saleMonth);
            if (unitsTimelineMonth) {
                unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + soldUnits;
            }
        } else if (isManualMode) {
            if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting.`);
            }
            const soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
            const salesWeights = getSalesWeights(salesTimeline.length, product.salesModel || 'launch');
            
            salesTimeline.forEach((month, i) => {
                const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === month);
                if (unitsTimelineMonth) {
                    unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + (soldUnits * salesWeights[i]);
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

const getAggregatedSalesWeights = (inputs: EngineInput, timeline: Timeline, startMonth: number, monthlyUnitsSold: Record<string, number>[]): number[] => {
    const { salesTimeline } = timeline;
    const relevantSalesTimeline = salesTimeline.filter(m => m >= startMonth);
    const aggregatedWeights = Array(relevantSalesTimeline.length).fill(0);
    let totalValue = 0;

    const monthlyRevenue = relevantSalesTimeline.map(month => {
        return inputs.products.reduce((sum, p) => {
            const units = (monthlyUnitsSold.find(u => u.month === month) || {})[p.productName] || 0;
            return sum + (units * (p.sellPrice || 0));
        }, 0);
    });
    
    totalValue = monthlyRevenue.reduce((sum, rev) => sum + rev, 0);

    if (totalValue === 0) return Array(relevantSalesTimeline.length).fill(1 / relevantSalesTimeline.length);
    return monthlyRevenue.map(rev => rev / totalValue);
};

const buildFixedCostTimeline = (inputs: EngineInput, timeline: Timeline, monthlyUnitsSold: Record<string, number>[]): Record<string, number>[] => {
    const { timelineMonths, requiresMonthZero } = timeline;
    const monthlyCostTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Paid Up-Front';
        
        let allocationStartMonth = 1;
        if (requiresMonthZero && (cost.startMonth === 'Month 0' || cost.startMonth === 'Up-front')) {
            allocationStartMonth = 0;
        }

        if (schedule === 'Paid Up-Front') {
            const totalCost = cost.costType === 'Monthly Cost' ? cost.amount * timeline.forecastMonths : cost.amount;
            const upFrontMonthIndex = requiresMonthZero ? 0 : 1;
            const upFrontMonth = monthlyCostTimeline.find(t => t.month === upFrontMonthIndex);
            if(upFrontMonth) upFrontMonth[cost.name] = (upFrontMonth[cost.name] || 0) + totalCost;
            return;
        }
        
        const allocationTimeline = monthlyCostTimeline.filter(t => t.month >= allocationStartMonth);
        const totalCostAmount = cost.costType === 'Monthly Cost' 
            ? cost.amount * allocationTimeline.length
            : cost.amount;
        
        switch (schedule) {
            case 'Allocated Monthly':
                const monthlyAmount = allocationTimeline.length > 0 ? totalCostAmount / allocationTimeline.length : 0;
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
                const salesWeights = getAggregatedSalesWeights(inputs, timeline, allocationStartMonth, monthlyUnitsSold);
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

const calculateCosts = (inputs: EngineInput, timeline: Timeline, monthlyUnitsSold: Record<string, number>[]) => {
    let totalPlannedUnits = 0, totalVariableCost = 0;

    const monthlyCostTimeline = buildFixedCostTimeline(inputs, timeline, monthlyUnitsSold);
    
    inputs.products.forEach(product => {
        const plannedUnits = product.plannedUnits || 0;
        const totalProductionCost = plannedUnits * (product.unitCost || 0);

        if (product.costModel === 'batch') {
            const depositPaid = totalProductionCost * ((product.depositPct || 0) / 100);
            const remainingCost = totalProductionCost - depositPaid;
            
            if (timeline.requiresMonthZero && depositPaid > 0) {
                const depositMonth = monthlyCostTimeline.find(t => t.month === 0);
                if (depositMonth) depositMonth['Deposits'] = (depositMonth['Deposits'] || 0) + depositPaid;
            }

            const firstSaleMonthForProduct = timeline.timelineMonths.find(m => (monthlyUnitsSold.find(u => u.month === m) || {})[product.productName] > 0);
            if (firstSaleMonthForProduct !== undefined) {
                const finalPaymentMonth = monthlyCostTimeline.find(t => t.month === firstSaleMonthForProduct);
                if (finalPaymentMonth) {
                    finalPaymentMonth['Final Payments'] = (finalPaymentMonth['Final Payments'] || 0) + remainingCost;
                }
            }
        } else if (product.costModel === 'monthly') {
            // Add JIT costs to the main cost timeline
            monthlyCostTimeline.forEach(month => {
                const unitsThisMonth = (monthlyUnitsSold.find(u => u.month === month.month) || {})[product.productName] || 0;
                if (unitsThisMonth > 0) {
                    month[product.productName] = (month[product.productName] || 0) + (unitsThisMonth * (product.unitCost || 0));
                }
            });
        }
        
        totalPlannedUnits += plannedUnits;
        totalVariableCost += totalProductionCost;
    });

    const variableCostBreakdown = inputs.products.map(product => {
        const plannedUnits = product.plannedUnits || 0;
        const totalProductionCost = plannedUnits * (product.unitCost || 0);
        const depositPaid = totalProductionCost * ((product.depositPct || 0) / 100);
        return {
            name: product.productName, plannedUnits, unitCost: product.unitCost, totalProductionCost,
            depositPaid, remainingCost: totalProductionCost - depositPaid
        };
    });

    const totalDepositsPaid = variableCostBreakdown.reduce((sum, p) => sum + p.depositPaid, 0);
    const totalFinalPayments = variableCostBreakdown.reduce((sum, p) => sum + p.remainingCost, 0);
    
    const totalFixedCostInPeriod = monthlyCostTimeline.reduce((total, month) => {
        return total + Object.entries(month).reduce((monthTotal, [key, value]) => {
            if (key === 'month' || key === 'Deposits' || key === 'Final Payments') return monthTotal;
            // Exclude JIT costs from this total as they are COGS
            const isJitCost = inputs.products.some(p => p.productName === key && p.costModel === 'monthly');
            if (isJitCost) return monthTotal;
            return monthTotal + value;
        }, 0);
    }, 0);
    
    const totalCogsOfSoldGoods = inputs.products.reduce((total, product) => {
        const unitsSoldForProduct = monthlyUnitsSold.reduce((sum, month) => sum + (month[product.productName] || 0), 0);
        return total + (unitsSoldForProduct * (product.unitCost || 0));
    }, 0);
    const cogsOfUnsoldGoods = totalVariableCost - totalCogsOfSoldGoods;

    const costSummary = {
        totalFixed: totalFixedCostInPeriod, totalVariable: totalVariableCost,
        totalOperating: totalFixedCostInPeriod + totalCogsOfSoldGoods,
        avgCostPerUnit: totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0,
        fixedCosts: inputs.fixedCosts, variableCosts: variableCostBreakdown,
        totalDepositsPaid, totalFinalPayments,
        cogsOfUnsoldGoods,
    };
    
    const allCostKeys = new Set<string>(['month', 'Deposits', 'Final Payments', ...inputs.fixedCosts.map(c => c.name), ...inputs.products.filter(p => p.costModel === 'monthly').map(p => p.productName)]);
    const monthlyCosts = monthlyCostTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allCostKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyCostSchema.parse(completeMonth);
    }).filter(Boolean) as MonthlyCost[];
    
    return { costSummary, monthlyCosts };
};


// =================================================================
// Profit & Cash Flow Calculation Engine
// =================================================================

const calculateProfitAndCashFlow = (inputs: EngineInput, timeline: Timeline, revenueData: ReturnType<typeof calculateRevenue>, costData: ReturnType<typeof calculateCosts>, monthlyUnitsSold: Record<string, number>[]) => {
    const { timelineMonths } = timeline;
    const { monthlyRevenue, revenueSummary } = revenueData;
    const { monthlyCosts, costSummary } = costData;
    const { taxRate } = inputs.parameters;

    let cumulativeOperatingProfit = 0, profitBreakEvenMonth: number | null = null;
    let totalWeightedMarginSum = 0;

    const monthlyProfit: MonthlyProfit[] = timelineMonths.map(month => {
        const totalMonthlyRevenue = Object.values(monthlyRevenue.find(r => r.month === month) || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);

        const totalMonthlyFixedCosts = Object.keys(monthlyCosts.find(c => c.month === month) || {}).filter(k => k !== 'month' && k !== 'Deposits' && k !== 'Final Payments' && !inputs.products.some(p => p.productName === k)).reduce((s, k) => s + ((monthlyCosts.find(c => c.month === month) || {})[k] || 0), 0);
        
        const monthlyCOGS = inputs.products.reduce((s, p) => {
            const units = (monthlyUnitsSold.find(u => u.month === month) || {})[p.productName] || 0;
            return s + (units * (p.unitCost || 0));
        }, 0);
        
        const grossProfit = totalMonthlyRevenue - monthlyCOGS;
        const operatingProfit = grossProfit - totalMonthlyFixedCosts;
        
        const monthlyTaxes = operatingProfit > 0 ? operatingProfit * (taxRate / 100) : 0;
        const netProfit = operatingProfit - monthlyTaxes;
        
        cumulativeOperatingProfit += operatingProfit;
        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
        }

        // Calculate weighted average net margin contribution for this month
        if (totalMonthlyRevenue > 0) {
            inputs.products.forEach(p => {
                const productRevenue = (monthlyRevenue.find(r => r.month === month) || {})[p.productName] || 0;
                if (productRevenue > 0) {
                    const productCOGS = ((monthlyUnitsSold.find(u => u.month === month) || {})[p.productName] || 0) * (p.unitCost || 0);
                    const productGrossProfit = productRevenue - productCOGS;
                    const revenueShare = productRevenue / totalMonthlyRevenue;
                    const allocatedFixed = totalMonthlyFixedCosts * revenueShare;
                    const allocatedTax = monthlyTaxes * revenueShare;
                    const productNetProfit = productGrossProfit - allocatedFixed - allocatedTax;
                    const productNetMargin = productNetProfit / productRevenue;
                    totalWeightedMarginSum += productNetMargin * productRevenue;
                }
            });
        }
        
        return { month, grossProfit, operatingProfit, netProfit };
    });
    
    const totalGrossProfit = monthlyProfit.reduce((s, p) => s + p.grossProfit, 0);
    const totalOperatingProfit = monthlyProfit.reduce((s, p) => s + p.operatingProfit, 0);
    const totalNetProfit = monthlyProfit.reduce((s, p) => s + p.netProfit, 0);
    const weightedAvgNetMargin = revenueSummary.totalRevenue > 0 ? (totalWeightedMarginSum / revenueSummary.totalRevenue) * 100 : 0;

    const profitSummary = {
        totalGrossProfit, totalOperatingProfit, totalNetProfit,
        grossMargin: revenueSummary.totalRevenue > 0 ? (totalGrossProfit / revenueSummary.totalRevenue) * 100 : 0,
        operatingMargin: revenueSummary.totalRevenue > 0 ? (totalOperatingProfit / revenueSummary.totalRevenue) * 100 : 0,
        netMargin: revenueSummary.totalRevenue > 0 ? (totalNetProfit / revenueSummary.totalRevenue) * 100 : 0,
        breakEvenMonth: profitBreakEvenMonth,
        weightedAvgNetMargin,
    };

    let cumulativeCash = 0, peakFundingNeed = 0, cashBreakEvenMonth: number | null = null;
    
    const monthlyCashFlow: MonthlyCashFlow[] = timelineMonths.map(month => {
        const cashIn = Object.values(monthlyRevenue.find(r => r.month === month) || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);
        
        const costsThisMonth = monthlyCosts.find(c => c.month === month) || {};
        let cashOutCosts = Object.entries(costsThisMonth).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);

        const profitMonth = monthlyProfit.find(p => p.month === month);
        const cashOutTax = (profitMonth?.operatingProfit || 0) > 0 ? (profitMonth?.operatingProfit || 0) - (profitMonth?.netProfit || 0) : 0;

        const netCashFlow = cashIn - cashOutCosts - cashOutTax;
        cumulativeCash += netCashFlow;

        if (cumulativeCash < peakFundingNeed) peakFundingNeed = cumulativeCash;
        if (cashBreakEvenMonth === null && cumulativeCash > 0 && month >= 1) cashBreakEvenMonth = month;

        return { month, netCashFlow, cumulativeCash };
    });
    
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

function calculateScenario(inputs: EngineInput): Omit<EngineOutput, 'businessHealth'> {
    const timeline = createTimeline(inputs);
    const { monthlyUnitsSold, monthlyUnitsTimeline } = calculateUnitsSold(inputs, timeline);
    const revenueData = calculateRevenue(inputs, timeline, monthlyUnitsTimeline);
    const costData = calculateCosts(inputs, timeline, monthlyUnitsSold);
    const profitAndCashFlowData = calculateProfitAndCashFlow(inputs, timeline, revenueData, costData, monthlyUnitsSold);

    return {
        revenueSummary: revenueData.revenueSummary,
        monthlyRevenue: revenueData.monthlyRevenue,
        monthlyUnitsSold,
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
        potentialInputs.products.forEach((p: Product) => { 
            p.sellThrough = 100; 
            if (p.plannedUnits >= 1 && p.plannedUnits <= 10) {
                p.estimatedSales = p.plannedUnits;
            }
        });
        
        const potentialResult = calculateScenario(potentialInputs);
        
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
