
import { type EngineInput, type EngineOutput, type FixedCostItem, type Product, MonthlyCostSchema, MonthlyRevenueSchema, MonthlyUnitsSoldSchema, type MonthlyProfit } from '@/lib/types';
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

        const { preOrder, forecastMonths, taxRate } = inputs.parameters;
        const isManualMode = inputs.realtime.dataSource === 'Manual';
        const salesStartMonth = preOrder ? 0 : 1;
        
        // --- REVENUE & UNITS CALCULATIONS ---
        const timelineDuration = preOrder ? forecastMonths + 1 : forecastMonths;
        const monthlyRevenueTimeline: Record<string, number>[] = Array.from({ length: timelineDuration }, (_, i) => ({ month: preOrder ? i : i + 1 }));
        const monthlyUnitsTimeline: Record<string, number>[] = Array.from({ length: timelineDuration }, (_, i) => ({ month: preOrder ? i : i + 1 }));
        
        const productBreakdown = inputs.products.map(product => {
            let soldUnits = 0;
            let totalRevenue = 0;
            let salesWeights: number[] = [];

            if (isManualMode) {
                // FORECAST LOGIC
                if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                    throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting (plannedUnits, sellThrough, or salesModel).`);
                }
                soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
                totalRevenue = soldUnits * (product.sellPrice || 0);
                salesWeights = getSalesWeights(forecastMonths, product.salesModel || 'launch');
            } else {
                // REAL-TIME LOGIC (Future-proofed)
                soldUnits = 0;
                totalRevenue = 0;
                salesWeights = getSalesWeights(forecastMonths, 'even'); 
            }

            for (let i = 0; i < forecastMonths; i++) {
                const currentMonthIndexInSales = i;
                const timelineMonthIndex = preOrder ? currentMonthIndexInSales + 1 : currentMonthIndexInSales;
                
                const revenueTimelineMonth = monthlyRevenueTimeline[timelineMonthIndex];
                 if (revenueTimelineMonth) {
                    const monthlyProductRevenue = totalRevenue * salesWeights[i];
                    revenueTimelineMonth[product.productName] = (revenueTimelineMonth[product.productName] || 0) + monthlyProductRevenue;
                }

                const unitsTimelineMonth = monthlyUnitsTimeline[timelineMonthIndex];
                if (unitsTimelineMonth) {
                    const monthlyProductUnits = soldUnits * salesWeights[i];
                    unitsTimelineMonth[product.productName] = (unitsTimelineMonth[product.productName] || 0) + monthlyProductUnits;
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
            // Adjust for monthly cost type
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
            if (!preOrder && completeMonth.month === 0) {
                return null;
            }
            return MonthlyCostSchema.parse(completeMonth);
        }).filter(Boolean) as MonthlyCost[];


        // --- PROFIT CALCULATIONS ---
        const monthlyProfit: MonthlyProfit[] = [];
        let breakEvenMonth: number | null = null;
        let cumulativeOperatingProfit = 0;

        for (let i = 0; i < timelineDuration; i++) {
            const month = preOrder ? i : i + 1;
            
            const currentRevenue = monthlyRevenue.find(r => r.month === month);
            const currentCosts = monthlyCosts.find(c => c.month === month);

            const totalMonthlyRevenue = currentRevenue ? Object.values(currentRevenue).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0) - currentRevenue.month : 0;
            const totalMonthlyCosts = currentCosts ? Object.values(currentCosts).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0) - currentCosts.month : 0;
            
            // Note: Variable costs are tied to production schedule (deposits/final payments), not sales.
            // For profit calculation, we should use COGS (Cost of Goods Sold) which is tied to sales.
            // Simplified COGS: (total variable cost / total planned units) * units sold this month
            const currentUnitsSold = monthlyUnitsSold.find(u => u.month === month);
            const totalMonthlyUnitsSold = currentUnitsSold ? Object.values(currentUnitsSold).filter(v => typeof v === 'number').reduce((s, v) => s + v, 0) - currentUnitsSold.month : 0;
            const avgVariableCostPerUnit = totalPlannedUnits > 0 ? totalVariableCost / totalPlannedUnits : 0;
            const monthlyCOGS = totalMonthlyUnitsSold * avgVariableCostPerUnit;

            const grossProfit = totalMonthlyRevenue - monthlyCOGS;
            const operatingProfit = grossProfit - totalMonthlyCosts; // Fixed costs are already in monthlyCosts
            const netProfit = operatingProfit > 0 ? operatingProfit * (1 - (taxRate / 100)) : operatingProfit;
            
            monthlyProfit.push({
                month,
                grossProfit,
                operatingProfit,
                netProfit
            });

            cumulativeOperatingProfit += operatingProfit;
            if (breakEvenMonth === null && cumulativeOperatingProfit > 0) {
                breakEvenMonth = month;
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
            breakEvenMonth,
        };


        // --- CASH FLOW (PLACEHOLDERS) ---
        return { 
            costSummary,
            monthlyCosts,
            revenueSummary,
            monthlyRevenue,
            monthlyUnitsSold,
            profitSummary,
            monthlyProfit,
            // Placeholders for future data
            cashFlowSummary: { endingCashBalance: 0, runway: 0 },
            monthlyCashFlow: [],
        };

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
