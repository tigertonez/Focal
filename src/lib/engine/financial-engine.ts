

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow, type BusinessHealth, RevenueSummarySchema, CostSummarySchema, type BusinessHealthScoreKpi, ProfitSummarySchema, CashFlowSummarySchema, ProductProfitabilitySchema, type ProductProfitability } from '@/lib/types';
import type { MonthlyCost } from '@/lib/types';
import { getProductColor } from '../utils';


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
        const sellThrough = product.sellThrough || 100; // Default to 100% for free plan
        const salesModel = product.salesModel || 'launch'; // Default for free plan

        const totalUnitsToSell = Math.round((product.plannedUnits || 0) * (sellThrough / 100));
        const salesWeights = getSalesWeights(salesTimeline.length, salesModel);

        let distributedUnits = 0;
        const monthlyUnitDistribution = salesWeights.map(weight => {
            const unitsForMonth = Math.floor(totalUnitsToSell * weight);
            distributedUnits += unitsForMonth;
            return unitsForMonth;
        });

        let remainder = totalUnitsToSell - distributedUnits;
        if (remainder > 0) {
            const sortedMonthIndices = salesWeights
                .map((weight, index) => ({ weight, index }))
                .sort((a, b) => b.weight - a.weight)
                .map(item => item.index);

            for (let i = 0; i < remainder; i++) {
                const monthIndexToIncrement = sortedMonthIndices[i % sortedMonthIndices.length];
                monthlyUnitDistribution[monthIndexToIncrement]++;
            }
        }

        salesTimeline.forEach((month, i) => {
            const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === month);
            if (unitsTimelineMonth) {
                unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + monthlyUnitDistribution[i];
            }
        });
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

const buildFixedCostTimeline = (
    inputs: EngineInput, 
    timeline: Timeline, 
    monthlyRevenueTimeline: Record<string, number>[],
    isForPL: boolean = false
): Record<string, number>[] => {
    const { timelineMonths } = timeline;
    const monthlyCostTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));

    const marketingCosts = inputs.fixedCosts.filter(cost => cost.name.toLowerCase().includes('marketing'));
    const otherFixedCosts = inputs.fixedCosts.filter(cost => !cost.name.toLowerCase().includes('marketing'));
    
    // --- Allocate Non-Marketing Costs ---
    otherFixedCosts.forEach(cost => {
        const costAmountCents = toCents(cost.amount);
        const schedule = cost.paymentSchedule || 'monthly_from_m0';
        const startMonth = schedule.endsWith('_m0') ? 0 : 1;
        
        if (schedule === 'up_front_m0') {
            const targetMonth = monthlyCostTimeline.find(t => t.month === startMonth);
            if(targetMonth) {
                targetMonth[cost.name] = (targetMonth[cost.name] || 0) + costAmountCents;
            }
        } else { // Monthly schedules
             const allocationTimeline = monthlyCostTimeline.filter(t => t.month >= startMonth);
             if (cost.costType === 'Monthly Cost') {
                  allocationTimeline.forEach(month => { month[cost.name] = (month[cost.name] || 0) + costAmountCents; });
             } else { // Total for Period, allocated evenly over payment months
                if (allocationTimeline.length > 0) {
                     const monthlyAmount = Math.floor(costAmountCents / allocationTimeline.length);
                     let remainder = costAmountCents % allocationTimeline.length;
                     allocationTimeline.forEach((month, i) => {
                         let amountThisMonth = monthlyAmount;
                         if(remainder > 0) {
                             amountThisMonth++;
                             remainder--;
                         }
                         month[cost.name] = (month[cost.name] || 0) + amountThisMonth;
                     });
                }
             }
        }
    });

    // --- Allocate Marketing Costs based on Revenue Share ---
    marketingCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'monthly_from_m0';
        const startMonth = schedule.endsWith('_m0') ? 0 : 1;
        const allocationMonths = timelineMonths.filter(m => m >= startMonth);

        const totalRevenueForMarketing = allocationMonths.reduce((total, monthNum) => {
            const revMonth = monthlyRevenueTimeline.find(r => r.month === monthNum);
            return total + (revMonth ? Object.values(revMonth).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0) : 0);
        }, 0);
        
        const totalMarketingCost = toCents(cost.amount);

        if (totalRevenueForMarketing > 0) {
            let distributedMarketingCost = 0;
            allocationMonths.forEach(m => {
                const revMonth = monthlyRevenueTimeline.find(r => r.month === m);
                if (revMonth) {
                    const monthRevenue = Object.values(revMonth).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0);
                    const revenueShare = monthRevenue / totalRevenueForMarketing;
                    const marketingForMonth = Math.round(totalMarketingCost * revenueShare);
                    
                    const costMonth = monthlyCostTimeline.find(c => c.month === m);
                    if (costMonth) {
                        costMonth[cost.name] = (costMonth[cost.name] || 0) + marketingForMonth;
                        distributedMarketingCost += marketingForMonth;
                    }
                }
            });
            const remainder = totalMarketingCost - distributedMarketingCost;
            if (remainder !== 0) {
                let maxRev = -1, monthWithMaxRev = -1;
                allocationMonths.forEach(m => {
                     const revMonth = monthlyRevenueTimeline.find(r => r.month === m);
                     const monthRevenue = revMonth ? Object.values(revMonth).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0) : 0;
                     if(monthRevenue > maxRev) {
                         maxRev = monthRevenue;
                         monthWithMaxRev = m;
                     }
                });
                
                const monthToAddRemainder = monthWithMaxRev !== -1 ? monthWithMaxRev : allocationMonths[0];
                if (monthToAddRemainder !== undefined) {
                    const monthEntry = monthlyCostTimeline.find(entry => entry.month === monthToAddRemainder);
                    if (monthEntry) monthEntry[cost.name] = (monthEntry[cost.name] || 0) + remainder;
                }
            }
        } else {
             if (allocationMonths.length > 0) {
                const monthlyAmount = Math.floor(totalMarketingCost / allocationMonths.length);
                let remainder = totalMarketingCost % allocationMonths.length;
                allocationMonths.forEach(m => {
                     const monthEntry = monthlyCostTimeline.find(entry => entry.month === m);
                     if (monthEntry) {
                        let amountThisMonth = monthlyAmount;
                        if(remainder > 0) {
                            amountThisMonth++;
                            remainder--;
                        }
                        monthEntry[cost.name] = (monthEntry[cost.name] || 0) + amountThisMonth;
                     }
                 });
             }
        }
    });

    return monthlyCostTimeline;
};

const calculateCosts = (inputs: EngineInput, timeline: Timeline, monthlyUnitsSold: Record<string, number>[], monthlyRevenueTimeline: Record<string, number>[]) => {
    const preOrder = inputs.company?.production === 'preorder';
    const monthlyCashOutflowTimeline = buildFixedCostTimeline(inputs, timeline, monthlyRevenueTimeline, false);
    let totalPlannedUnits = 0, totalVariableCost = 0;

    const variableCostBreakdown = inputs.products.map(product => {
        const plannedUnits = product.plannedUnits || 0;
        const totalProductionCost = toCents(plannedUnits * (product.unitCost || 0));
        const depositPaid = Math.round(totalProductionCost * ((product.depositPct || 0) / 100));
        const costModel = product.costModel || 'batch';

        if (costModel === 'monthly') {
            monthlyCashOutflowTimeline.forEach(month => {
                const unitsThisMonth = (monthlyUnitsSold.find(u => u.month === month.month) || {})[product.productName] || 0;
                if (unitsThisMonth > 0) {
                    month[product.productName] = (month[product.productName] || 0) + toCents(unitsThisMonth * (product.unitCost || 0));
                }
            });
        } else {
            const remainingCost = totalProductionCost - depositPaid;
            if (preOrder) {
                const month0 = monthlyCashOutflowTimeline.find(t => t.month === 0);
                if (month0) month0['Deposits'] = (month0['Deposits'] || 0) + depositPaid;

                const month1 = monthlyCashOutflowTimeline.find(t => t.month === 1);
                if (month1) month1['Final Payments'] = (month1['Final Payments'] || 0) + remainingCost;
            } else {
                const month1 = monthlyCashOutflowTimeline.find(t => t.month === 1);
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

    const calculatedFixedCosts = inputs.fixedCosts.map(cost => {
        const schedule = cost.paymentSchedule || 'monthly_from_m0';
        let startMonth = schedule.endsWith('_m0') ? 0 : 1;
        const numPaymentMonths = cost.costType === 'Monthly Cost' 
            ? timeline.timelineMonths.filter(m => m >= startMonth).length
            : timeline.forecastMonths;

        let totalAmount = 0;
        if (cost.costType === 'Monthly Cost') {
            totalAmount = cost.amount * numPaymentMonths;
        } else { // 'Total for Period'
            totalAmount = cost.amount;
        }
        return { ...cost, amount: totalAmount };
    });

    const totalFixedCostInPeriod = calculatedFixedCosts.reduce((total, cost) => total + toCents(cost.amount), 0);
    const totalOperatingCost = totalFixedCostInPeriod + totalVariableCost;

    const cogsOfSoldGoods = inputs.products.reduce((total, product) => {
        const unitsSoldForProduct = monthlyUnitsSold.reduce((sum, month) => sum + (month[product.productName] || 0), 0);
        return total + toCents(unitsSoldForProduct * (product.unitCost || 0));
    }, 0);
    const cogsOfUnsoldGoods = totalVariableCost - cogsOfSoldGoods;

    const costSummary = {
        totalFixed: fromCents(totalFixedCostInPeriod),
        totalVariable: fromCents(totalVariableCost),
        totalOperating: fromCents(totalOperatingCost),
        avgCostPerUnit: totalPlannedUnits > 0 ? fromCents(totalVariableCost / totalPlannedUnits) : 0,
        fixedCosts: calculatedFixedCosts,
        variableCosts: variableCostBreakdown,
        totalDepositsPaid: fromCents(totalDepositsPaid),
        totalFinalPayments: fromCents(totalVariableCost - totalDepositsPaid),
        cogsOfUnsoldGoods: fromCents(cogsOfUnsoldGoods),
        cogsOfSoldGoods: fromCents(cogsOfSoldGoods),
    };

    const allCostKeys = new Set<string>(['month', 'Deposits', 'Final Payments', ...inputs.fixedCosts.map(c => c.name), ...inputs.products.filter(p => p.costModel === 'monthly').map(p => p.productName)]);
    const monthlyCosts = monthlyCashOutflowTimeline.map(monthData => {
        const completeMonth: Record<string, any> = { month: monthData.month };
        allCostKeys.forEach(key => {
            if (key !== 'month') {
                completeMonth[key] = fromCents(monthData[key] || 0);
            }
        });
        return MonthlyCostSchema.parse(completeMonth);
    }) as MonthlyCost[];

    return { costSummary, monthlyCosts, monthlyCashOutflowTimeline };
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
    const { monthlyCashOutflowTimeline, costSummary } = costData;
    const { taxRate, accountingMethod } = inputs.parameters;

    const monthlyFixedCostForPLBreakdown = buildFixedCostTimeline(inputs, timeline, monthlyRevenueTimeline, true);
    
    let cumulativeOperatingProfit = 0;
    let profitBreakEvenMonth: number | null = null;
    
    const monthlyProfit: MonthlyProfit[] = timelineMonths.map((month) => {
        const revenueThisMonth = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);
        
        let variableCostsThisMonth = 0;
        const unitsSoldThisMonth = monthlyUnitsSold.find(u => u.month === month) || {};

        if (accountingMethod === 'cogs') {
            inputs.products.forEach(p => {
                variableCostsThisMonth += toCents((unitsSoldThisMonth[p.productName] || 0) * (p.unitCost || 0));
            });
        } else { // 'total_costs' (Conservative)
             const firstMonth = timeline.requiresMonthZero ? 0 : 1;
             if (month === firstMonth) {
                 inputs.products.forEach(p => {
                     if (p.costModel === 'batch' || !p.costModel) {
                        variableCostsThisMonth += toCents((p.plannedUnits || 0) * (p.unitCost || 0));
                     }
                 });
             }
             inputs.products.forEach(p => {
                 if (p.costModel === 'monthly') {
                    variableCostsThisMonth += toCents((unitsSoldThisMonth[p.productName] || 0) * (p.unitCost || 0));
                 }
             });
        }
        
        const fixedCostsThisMonth = Object.values(monthlyFixedCostForPLBreakdown.find(m => m.month === month) || {}).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);
        
        const plOperatingCosts = fixedCostsThisMonth + variableCostsThisMonth;
        const grossProfit = revenueThisMonth - variableCostsThisMonth;
        const operatingProfit = grossProfit - fixedCostsThisMonth;

        cumulativeOperatingProfit += operatingProfit;

        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
        }

        return {
            month,
            revenue: fromCents(revenueThisMonth),
            variableCosts: fromCents(variableCostsThisMonth),
            fixedCosts: fromCents(fixedCostsThisMonth),
            grossProfit: fromCents(grossProfit),
            operatingProfit: fromCents(operatingProfit),
            netProfit: 0, // Calculated below
            plOperatingCosts: fromCents(plOperatingCosts),
            tax: 0, // Calculated below
            cumulativeOperatingProfit: fromCents(cumulativeOperatingProfit),
        };
    });
    
    const totalRevenueCents = toCents(revenueSummary.totalRevenue);
    const variableCostsForPL = monthlyProfit.reduce((sum, m) => sum + toCents(m.variableCosts), 0);
    const totalFixedCostForPL = monthlyProfit.reduce((sum, m) => sum + toCents(m.fixedCosts), 0);
    const totalOperatingCostsCents = variableCostsForPL + totalFixedCostForPL;
    const totalOperatingProfit = totalRevenueCents - totalOperatingCostsCents;
    
    const businessIsProfitable = totalOperatingProfit > 0;
    const totalTaxAmountCents = businessIsProfitable ? totalOperatingProfit * (taxRate / 100) : 0;
    const totalNetProfit = totalOperatingProfit - totalTaxAmountCents;
    
    const profitSummary = {
        totalGrossProfit: fromCents(totalRevenueCents - variableCostsForPL),
        totalOperatingProfit: fromCents(totalOperatingProfit),
        totalNetProfit: fromCents(totalNetProfit),
        grossMargin: totalRevenueCents > 0 ? ((totalRevenueCents - variableCostsForPL) / totalRevenueCents) * 100 : 0,
        operatingMargin: totalRevenueCents > 0 ? (totalOperatingProfit / totalRevenueCents) * 100 : 0,
        netMargin: totalRevenueCents > 0 ? (totalNetProfit / totalRevenueCents) * 100 : 0,
        breakEvenMonth: profitBreakEvenMonth,
    };

    // Allocate tax to profitable months for cash flow
    const profitableMonths = monthlyProfit.filter(m => m.operatingProfit > 0);
    const totalPositiveOpProfit = profitableMonths.reduce((sum, m) => sum + toCents(m.operatingProfit), 0);
    
    if (businessIsProfitable && totalPositiveOpProfit > 0) {
        let distributedTax = 0;
        monthlyProfit.forEach(m => {
            if (m.operatingProfit > 0) {
                const profitShare = toCents(m.operatingProfit) / totalPositiveOpProfit;
                const taxForMonth = Math.round(totalTaxAmountCents * profitShare);
                m.tax = fromCents(taxForMonth);
                m.netProfit = m.operatingProfit - m.tax;
                distributedTax += taxForMonth;
            } else {
                 m.netProfit = m.operatingProfit; // For unprofitable months, net profit is op profit
            }
        });
        // Distribute remainder tax
        const remainder = totalTaxAmountCents - distributedTax;
        if (remainder !== 0 && profitableMonths.length > 0) {
            const firstProfitableMonth = profitableMonths[0];
            firstProfitableMonth.tax += fromCents(remainder);
            firstProfitableMonth.netProfit -= fromCents(remainder);
        }
    } else {
         monthlyProfit.forEach(m => { m.netProfit = m.operatingProfit; });
    }


    let cumulativeCash = 0, peakFundingNeed = 0;
    const monthlyCashFlow: MonthlyCashFlow[] = timelineMonths.map(month => {
        const cashIn = Object.entries(monthlyRevenueTimeline.find(r => r.month === month) || {}).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);
        const costsForMonth = monthlyCashOutflowTimeline.find(c => c.month === month) || {};
        let cashOutCosts = Object.entries(costsForMonth).reduce((s, [key, value]) => key !== 'month' ? s + value : s, 0);
        
        const taxForMonth = toCents(monthlyProfit.find(p => p.month === month)?.tax || 0);
        const totalCashOut = cashOutCosts + taxForMonth;

        const netCashFlow = cashIn - totalCashOut;
        cumulativeCash += netCashFlow;
        if (cumulativeCash < peakFundingNeed) peakFundingNeed = cumulativeCash;

        return { month, netCashFlow: fromCents(netCashFlow), cumulativeCash: fromCents(cumulativeCash) };
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

    const runway = finalEndingCash > 0 && avgMonthlyBurnRate > 0 ? finalEndingCash / avgMonthlyBurnRate : (finalEndingCash > 0 ? Infinity : 0);

    const cashFlowSummary = {
        endingCashBalance: finalEndingCash,
        potentialCashBalance: 0,
        peakFundingNeed: fromCents(Math.abs(peakFundingNeed)),
        runway: isFinite(runway) ? runway : 0,
        cashPositiveMonth: cashPositiveMonth,
        estimatedTaxes: fromCents(totalTaxAmountCents),
    };

    const productProfitability: ProductProfitability[] = inputs.products.map(prod => {
      const revData = revenueSummary.productBreakdown.find(p => p.name === prod.productName);
      const soldUnits = revData?.totalSoldUnits || 0;
      const revenueCents = toCents(revData?.totalRevenue);

      if (revenueCents <= 0) {
        return {
          id: prod.id, productName: prod.productName, color: getProductColor(prod),
          soldUnits: 0, sellThrough: prod.sellThrough || 0, productRevenue: 0,
          grossProfit: 0, grossMargin: 0, operatingProfit: 0, operatingMargin: 0,
          netProfit: 0, netMargin: 0
        };
      }

      const costModel = prod.costModel || 'batch';
      const variableCents =
        accountingMethod === 'cogs'
          ? toCents(soldUnits * (prod.unitCost || 0))
          : (costModel === 'batch' ? toCents((prod.plannedUnits || 0) * (prod.unitCost || 0)) : toCents(soldUnits * (prod.unitCost || 0)));

      const grossProfitCents = revenueCents - variableCents;
      const grossMargin = (grossProfitCents / revenueCents) * 100;

      const revenueShare = totalRevenueCents > 0 ? revenueCents / totalRevenueCents : 0;

      const allocatedFixedCostsCents = Math.round(totalFixedCostForPL * revenueShare);
      const operatingProfitCents = grossProfitCents - allocatedFixedCostsCents;
      const operatingMargin = (operatingProfitCents / revenueCents) * 100;

      const allocatedTaxCents = Math.round(totalTaxAmountCents * revenueShare);
      const netProfitCents = operatingProfitCents - allocatedTaxCents;
      const netMargin = (netProfitCents / revenueCents) * 100;
      
      return {
        id: prod.id, productName: prod.productName, color: getProductColor(prod),
        soldUnits, sellThrough: prod.sellThrough || 100,
        productRevenue: fromCents(revenueCents), grossProfit: fromCents(grossProfitCents),
        grossMargin, operatingProfit: fromCents(operatingProfitCents),
        operatingMargin, netProfit: fromCents(netProfitCents), netMargin,
      };
    });

    if(productProfitability.length > 1) {
        const operatingMargins = new Set(productProfitability.map(p => p.operatingMargin.toFixed(5)));
        const netMargins = new Set(productProfitability.map(p => p.netMargin.toFixed(5)));
        if (operatingMargins.size === 1 && netMargins.size === 1) {
            const grossMargins = new Set(productProfitability.map(p => p.grossMargin.toFixed(5)));
            if (grossMargins.size > 1) {
                 throw new Error('ENGINE VALIDATION FAILED: All calculated product margins are identical. This indicates a critical error in cost allocation logic.');
            }
        }
    }

    return { profitSummary, monthlyProfit, cashFlowSummary, monthlyCashFlow, productProfitability };
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
        
        // Fill in defaults for free plan
        const processedInputs = JSON.parse(JSON.stringify(inputs));
        processedInputs.products.forEach((p: Product) => {
            if (p.unitCost === undefined) p.unitCost = 0;
            if (p.sellThrough === undefined) p.sellThrough = 100;
            if (!p.salesModel) p.salesModel = 'launch';
            if (!p.costModel) p.costModel = 'batch';
            if (p.depositPct === undefined) p.depositPct = 0;
        });

        const timeline = createTimeline(processedInputs);
        const { monthlyUnitsSold, monthlyUnitsTimeline } = calculateUnitsSold(processedInputs, timeline);
        const { revenueSummary, monthlyRevenue, monthlyRevenueTimeline } = calculateRevenue(processedInputs, timeline, monthlyUnitsTimeline);
        const costData = calculateCosts(processedInputs, timeline, monthlyUnitsSold, monthlyRevenueTimeline);
        const profitAndCashFlowData = calculateProfitAndCashFlow(processedInputs, timeline, { revenueSummary, monthlyRevenue, monthlyRevenueTimeline }, costData, monthlyUnitsSold);

        const achievedResult = {
            revenueSummary: revenueSummary,
            monthlyRevenue: monthlyRevenue,
            monthlyUnitsSold,
            costSummary: costData.costSummary,
            monthlyCosts: costData.monthlyCosts,
            profitSummary: profitAndCashFlowData.profitSummary,
            monthlyProfit: profitAndCashFlowData.monthlyProfit,
            cashFlowSummary: profitAndCashFlowData.cashFlowSummary,
            monthlyCashFlow: profitAndCashFlowData.monthlyCashFlow,
            productProfitability: profitAndCashFlowData.productProfitability,
        };

        if (isPotentialCalculation) {
            return {
                ...achievedResult,
                businessHealth: undefined,
            };
        }

        const potentialInputs = JSON.parse(JSON.stringify(processedInputs));
        potentialInputs.products.forEach((p: Product) => {
            p.sellThrough = 100;
        });

        const potentialResult = calculateFinancials(potentialInputs, true);

        const healthScore = calculateBusinessHealth(processedInputs, {
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
