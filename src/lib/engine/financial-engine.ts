

import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit, type MonthlyCashFlow } from '@/lib/types';
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
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const aggregatedWeights = Array(forecastMonths).fill(0);
    let totalValue = 0;

    inputs.products.forEach(p => {
        // In manual mode, weight by potential revenue. In RT mode, this logic would change.
        const productValue = isManualMode ? (p.plannedUnits || 0) * (p.sellPrice || 0) : (p.sellPrice || 0);
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
    const timelineDuration = forecastMonths;
    const startMonth = preOrder ? 0 : 1;

    const timeline: Record<string, number>[] = Array.from({ length: timelineDuration + (preOrder ? 1 : 0) }, (_, i) => ({ month: i + (preOrder ? 0 : 1) }));

    const salesWeights = getAggregatedSalesWeights(inputs);

    inputs.fixedCosts.forEach(cost => {
        const schedule = cost.paymentSchedule || 'Paid Up-Front';
        
        switch (schedule) {
            case 'Paid Up-Front':
                const firstMonthIndex = preOrder ? 0 : 1;
                const firstMonth = timeline.find(t => t.month === firstMonthIndex);
                if (firstMonth) {
                    firstMonth[cost.name] = (firstMonth[cost.name] || 0) + cost.amount;
                }
                break;
            
            case 'Allocated Monthly':
                if (forecastMonths > 0) {
                    const monthlyAmount = cost.costType === 'Monthly Cost' ? cost.amount : cost.amount / forecastMonths;
                    for (let i = 0; i < forecastMonths; i++) {
                        const currentMonth = startMonth + i;
                        const timelineMonth = timeline.find(t => t.month === currentMonth);
                        if (timelineMonth) {
                           timelineMonth[cost.name] = (timelineMonth[cost.name] || 0) + monthlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated Quarterly':
                const quarters = Math.ceil(forecastMonths / 3);
                if (quarters > 0) {
                    const quarterlyAmount = cost.amount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        const startMonthInSales = q * 3;
                        const currentMonth = startMonth + startMonthInSales;
                        const timelineMonth = timeline.find(t => t.month === currentMonth);
                        if (timelineMonth) {
                           timelineMonth[cost.name] = (timelineMonth[cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated According to Sales':
                 for (let i = 0; i < forecastMonths; i++) {
                    const currentMonth = startMonth + i;
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
                console.warn(`Product "${p.productName}" has a Unit Cost higher than its Sales Price.`);
            }
        });

        const { preOrder, forecastMonths, taxRate } = inputs.parameters;
        const isManualMode = inputs.realtime.dataSource === 'Manual';
        
        // --- REVENUE & UNITS CALCULATIONS ---
        const timelineDuration = forecastMonths;
        const startMonth = preOrder ? 1 : 1; // Sales always start in month 1
        
        const monthlyRevenueTimeline: Record<string, number>[] = Array.from({ length: forecastMonths + 1 }, (_, i) => ({ month: i }));
        const monthlyUnitsTimeline: Record<string, number>[] = Array.from({ length: forecastMonths + 1 }, (_, i) => ({ month: i }));
        
        const productBreakdown = inputs.products.map(product => {
            let soldUnits = 0;
            let totalRevenue = 0;
            let salesWeights: number[] = [];

            if (isManualMode) {
                if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                    throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting (plannedUnits, sellThrough, or salesModel).`);
                }
                soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
                totalRevenue = soldUnits * (product.sellPrice || 0);
                salesWeights = getSalesWeights(forecastMonths, product.salesModel || 'launch');
            } else {
                soldUnits = 0;
                totalRevenue = 0;
                salesWeights = getSalesWeights(forecastMonths, 'even'); 
            }

            for (let i = 0; i < forecastMonths; i++) {
                const currentMonth = startMonth + i;
                const revenueTimelineMonth = monthlyRevenueTimeline.find(m => m.month === currentMonth);
                 if (revenueTimelineMonth) {
                    const monthlyProductRevenue = totalRevenue * salesWeights[i];
                    revenueTimelineMonth[product.productName] = (revenueTimelineMonth[product.productName] || 0) + monthlyProductRevenue;
                }

                const unitsTimelineMonth = monthlyUnitsTimeline.find(m => m.month === currentMonth);
                if (unitsTimelineMonth) {
                    const monthlyProductUnits = soldUnits * salesWeights[i];
                    unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + monthlyProductUnits;
                }
            }
             // Handle pre-order revenue
            if (preOrder) {
                const preOrderRevenue = (totalRevenue * salesWeights[0]) / 2; // Assume half of first month sales are pre-orders
                const firstMonthRevenue = (totalRevenue * salesWeights[0]) / 2;
                
                const preOrderMonthData = monthlyRevenueTimeline.find(m => m.month === 0);
                if (preOrderMonthData) preOrderMonthData[product.productName] = (preOrderMonthData[product.productName] || 0) + preOrderRevenue;
                
                const firstMonthData = monthlyRevenueTimeline.find(m => m.month === 1);
                if (firstMonthData) firstMonthData[product.productName] = firstMonthRevenue; // Overwrite, don't add
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
            ltv: 0,
            cac: 0,
        };
        
        const allRevenueKeys = new Set<string>(['month']);
        monthlyRevenueTimeline.forEach(monthData => Object.keys(monthData).forEach(key => allRevenueKeys.add(key)));
        const monthlyRevenue = monthlyRevenueTimeline.map(monthData => {
            const completeMonth: Record<string, any> = {};
            allRevenueKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
            return MonthlyRevenueSchema.parse(completeMonth);
        }).filter(Boolean);

        const allUnitKeys = new Set<string>(['month']);
        monthlyUnitsTimeline.forEach(monthData => Object.keys(monthData).forEach(key => allUnitKeys.add(key)));
        const monthlyUnitsSold = monthlyUnitsTimeline.map(monthData => {
            const completeMonth: Record<string, any> = {};
            allUnitKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
            return MonthlyUnitsSoldSchema.parse(completeMonth);
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
        
        const totalFixedCostInPeriod = inputs.fixedCosts.reduce((sum, cost) => {
            if (cost.costType === 'Monthly Cost') {
                return sum + (cost.amount * forecastMonths);
            }
            return sum + cost.amount;
        }, 0);
        
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
            return MonthlyCostSchema.parse(completeMonth);
        }).filter(Boolean) as MonthlyCost[];


        // --- PROFIT CALCULATIONS ---
        const monthlyProfit: MonthlyProfit[] = [];
        let cumulativeOperatingProfit = 0;
        let profitBreakEvenMonth: number | null = null;
        
        const fullTimelineDuration = preOrder ? forecastMonths + 1 : forecastMonths;
        const profitStartMonth = preOrder ? 0 : 1;
        
        for (let i = 0; i < fullTimelineDuration; i++) {
            const month = profitStartMonth + i;
            
            const currentRevenueData = monthlyRevenue.find(r => r.month === month) || { month };
            const totalMonthlyRevenue = Object.values(currentRevenueData).reduce((sum, val) => typeof val === 'number' && val > 0 ? sum + val : sum, 0);

            const currentFixedCostsData = monthlyCosts.find(c => c.month === month) || { month };
            const totalMonthlyFixedCosts = Object.keys(currentFixedCostsData)
                .filter(k => k !== 'month' && k !== 'Deposits' && k !== 'Final Payments')
                .reduce((sum, key) => sum + (currentFixedCostsData[key] || 0), 0);
            
            const currentUnitsSoldData = monthlyUnitsSold.find(u => u.month === month) || { month };
            const monthlyCOGS = Object.keys(currentUnitsSoldData)
                .filter(key => key !== 'month')
                .reduce((sum, productName) => {
                    const productInfo = inputs.products.find(p => p.productName === productName);
                    const unitsSold = currentUnitsSoldData[productName] || 0;
                    const unitCost = productInfo?.unitCost || 0;
                    return sum + (unitsSold * unitCost);
                }, 0);

            const grossProfit = totalMonthlyRevenue - monthlyCOGS;
            const operatingProfit = grossProfit - totalMonthlyFixedCosts;
            const netProfit = operatingProfit > 0 ? operatingProfit * (1 - (taxRate / 100)) : operatingProfit;
            
            monthlyProfit.push({
                month,
                grossProfit,
                operatingProfit,
                netProfit
            });

            if (month >= 1) { // Only track break-even from month 1 onwards
              cumulativeOperatingProfit += operatingProfit;
              if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0) {
                  profitBreakEvenMonth = month;
              }
            }
        }
        
        const totalGrossProfit = monthlyProfit.reduce((sum, p) => sum + p.grossProfit, 0);
        const totalOperatingProfit = monthlyProfit.reduce((sum, p) => sum + p.operatingProfit, 0);
        const totalNetProfit = monthlyProfit.reduce((sum, p) => sum + p.netProfit, 0);

        const profitSummary = {
            totalGrossProfit,
            totalOperatingProfit,
            totalNetProfit,
            grossMargin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
            operatingMargin: totalRevenue > 0 ? (totalOperatingProfit / totalRevenue) * 100 : 0,
            netMargin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0,
            breakEvenMonth: profitBreakEvenMonth,
        };


        // --- CASH FLOW CALCULATIONS ---
        const monthlyCashFlow: MonthlyCashFlow[] = [];
        let cumulativeCash = 0;
        let peakFundingNeed = 0;
        let cashBreakEvenMonth: number | null = null;
        
        for (let i = 0; i < fullTimelineDuration; i++) {
            const month = profitStartMonth + i;
            
            const cashIn = Object.values(monthlyRevenue.find(r => r.month === month) || {}).reduce((sum, val) => typeof val === 'number' && val > 0 ? sum + val : sum, 0);
            const cashOutCosts = Object.values(monthlyCosts.find(c => c.month === month) || {}).reduce((sum, val) => typeof val === 'number' && val > 0 ? sum + val : sum, 0);
            const cashOutTax = (monthlyProfit.find(p => p.month === month)?.netProfit || 0) < (monthlyProfit.find(p => p.month === month)?.operatingProfit || 0) 
                ? (monthlyProfit.find(p => p.month === month)?.operatingProfit || 0) - (monthlyProfit.find(p => p.month === month)?.netProfit || 0)
                : 0;

            const netCashFlow = cashIn - cashOutCosts - cashOutTax;
            cumulativeCash += netCashFlow;

            if (cumulativeCash < peakFundingNeed) {
                peakFundingNeed = cumulativeCash;
            }

            if (cashBreakEvenMonth === null && cumulativeCash > 0 && month > 0) {
                cashBreakEvenMonth = month;
            }

            monthlyCashFlow.push({
                month,
                netCashFlow,
                cumulativeCash
            });
        }
        
        const avgMonthlyFixedCost = costSummary.totalFixed / forecastMonths;
        const runway = cumulativeCash > 0 && avgMonthlyFixedCost > 0 ? cumulativeCash / avgMonthlyFixedCost : (cumulativeCash > 0 ? Infinity : 0);

        const cashFlowSummary = {
            endingCashBalance: cumulativeCash,
            peakFundingNeed: Math.abs(peakFundingNeed),
            runway: isFinite(runway) ? runway : 0,
            breakEvenMonth: cashBreakEvenMonth,
        };

        return { 
            costSummary,
            monthlyCosts,
            revenueSummary,
            monthlyRevenue,
            monthlyUnitsSold,
            profitSummary,
            monthlyProfit,
            cashFlowSummary,
            monthlyCashFlow,
        };

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
