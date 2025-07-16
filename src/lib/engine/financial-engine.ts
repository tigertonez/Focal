


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
const getAggregatedSalesWeights = (inputs: EngineInput, timelineMonths: number[]): number[] => {
    const { forecastMonths } = inputs.parameters;
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const salesTimeline = timelineMonths.filter(m => m >= 1); // Sales models apply from M1 onwards for costs
    const aggregatedWeights = Array(salesTimeline.length).fill(0);
    let totalValue = 0;

    inputs.products.forEach(p => {
        const productValue = isManualMode ? (p.plannedUnits || 0) * (p.sellPrice || 0) : (p.sellPrice || 0);
        const productWeights = getSalesWeights(salesTimeline.length, p.salesModel || 'launch');
        productWeights.forEach((weight, i) => {
            aggregatedWeights[i] += weight * productValue;
        });
        totalValue += productValue;
    });

    if (totalValue === 0) return Array(salesTimeline.length).fill(1 / salesTimeline.length);

    return aggregatedWeights.map(w => w / totalValue);
};

const buildFixedCostTimeline = (inputs: EngineInput, timelineMonths: number[]): Record<string, number>[] => {
    const { forecastMonths } = inputs.parameters;
    const timeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));
    const hasMonthZero = timelineMonths.includes(0);

    const salesWeights = getAggregatedSalesWeights(inputs, timelineMonths);

    inputs.fixedCosts.forEach(cost => {
        let schedule = cost.paymentSchedule || 'Paid Up-Front';
        let startMonthChoice = cost.startMonth || 'Month 1';

        // Override: if 'Paid Up-Front', it must be handled as a one-time payment
        if (schedule === 'Paid Up-Front') {
            const upFrontMonth = timeline.find(t => t.month === 0);
            if (upFrontMonth) {
                const totalCost = cost.costType === 'Monthly Cost' ? cost.amount * forecastMonths : cost.amount;
                upFrontMonth[cost.name] = (upFrontMonth[cost.name] || 0) + totalCost;
            }
            return; // Skip remaining logic for this cost
        }

        // Determine the actual starting month for allocations
        let allocationStartMonth = (startMonthChoice === 'Month 0' && hasMonthZero) ? 0 : 1;
        
        const allocationTimeline = timeline.filter(t => t.month >= allocationStartMonth);
        const totalCostAmount = cost.costType === 'Monthly Cost' ? cost.amount * allocationTimeline.length : cost.amount;
        const totalAllocationMonths = allocationTimeline.length;

        switch (schedule) {
            case 'Allocated Monthly':
                if (totalAllocationMonths > 0) {
                    const monthlyAmount = cost.costType === 'Monthly Cost' ? cost.amount : totalCostAmount / totalAllocationMonths;
                    allocationTimeline.forEach(month => {
                        month[cost.name] = (month[cost.name] || 0) + monthlyAmount;
                    });
                }
                break;

            case 'Allocated Quarterly':
                const quarters = Math.ceil(totalAllocationMonths / 3);
                if (quarters > 0) {
                    const quarterlyAmount = totalCostAmount / quarters;
                    for (let q = 0; q < quarters; q++) {
                        const monthIndex = q * 3;
                        if (monthIndex < allocationTimeline.length) {
                           allocationTimeline[monthIndex][cost.name] = (allocationTimeline[monthIndex][cost.name] || 0) + quarterlyAmount;
                        }
                    }
                }
                break;

            case 'Allocated According to Sales':
                const salesCostTimeline = timeline.filter(t => t.month >= 1);
                salesCostTimeline.forEach((month, i) => {
                    if (salesWeights[i] !== undefined) {
                        const distributedAmount = totalCostAmount * salesWeights[i];
                        month[cost.name] = (month[cost.name] || 0) + distributedAmount;
                    }
                });
                break;
        }
    });

    return timeline;
};


function calculateScenario(inputs: EngineInput): EngineOutput {
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
    
    // --- TIMELINE SETUP ---
    const hasDeposits = inputs.products.some(p => (p.depositPct || 0) > 0);
    const useMonthZero = preOrder || hasDeposits;
    
    const timelineMonths = useMonthZero
      ? Array.from({ length: forecastMonths + 1 }, (_, i) => i) // M0, M1, ..., M12
      : Array.from({ length: forecastMonths }, (_, i) => i + 1); // M1, M2, ..., M12

    const revenueTimeline = useMonthZero
        ? Array.from({ length: forecastMonths }, (_, i) => i) // M0 to M11
        : Array.from({ length: forecastMonths }, (_, i) => i + 1); // M1 to M12
    
    // --- REVENUE & UNITS CALCULATIONS ---
    const monthlyRevenueTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));
    const monthlyUnitsTimeline: Record<string, number>[] = timelineMonths.map(m => ({ month: m }));
    
    const productBreakdown = inputs.products.map(product => {
        let soldUnits = 0;
        let totalRevenue = 0;
        
        if (isManualMode) {
            if (product.plannedUnits === undefined || product.sellThrough === undefined || product.salesModel === undefined) {
                throw new Error(`Product "${product.productName}" is missing required fields for manual forecasting (plannedUnits, sellThrough, or salesModel).`);
            }
            soldUnits = (product.plannedUnits || 0) * ((product.sellThrough || 0) / 100);
            totalRevenue = soldUnits * (product.sellPrice || 0);
            
            // Sales models are applied to the full revenue timeline (M0-11 or M1-12)
            const salesWeights = getSalesWeights(revenueTimeline.length, product.salesModel || 'launch');

            revenueTimeline.forEach((month, i) => {
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
        
        return {
            name: product.productName,
            totalRevenue,
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
    
    const allRevenueKeys = new Set<string>(['month', ...inputs.products.map(p => p.productName)]);
    const monthlyRevenue = monthlyRevenueTimeline.map(monthData => {
        const completeMonth: Record<string, any> = {};
        allRevenueKeys.forEach(key => { completeMonth[key] = monthData[key] || 0; });
        return MonthlyRevenueSchema.parse(completeMonth);
    }).filter(Boolean);

    const allUnitKeys = new Set<string>(['month', ...inputs.products.map(p => p.productName)]);
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
    
    const monthlyCostTimeline = buildFixedCostTimeline(inputs, timelineMonths);
    
    // Deposit payment is ALWAYS in Month 0 if it exists and there are deposits
    if (useMonthZero && totalDepositsPaid > 0) {
        const depositMonth = monthlyCostTimeline.find(t => t.month === 0);
        if (depositMonth) {
            depositMonth['Deposits'] = (depositMonth['Deposits'] || 0) + totalDepositsPaid;
        }
    }
    
    // Final payment is ALWAYS in Month 1
    const finalPaymentMonthData = monthlyCostTimeline.find(t => t.month === 1);
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
    
    const allCostKeys = new Set<string>(['month', 'Deposits', 'Final Payments', ...inputs.fixedCosts.map(c => c.name)]);
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
    
    for (const month of timelineMonths) {
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

        cumulativeOperatingProfit += operatingProfit;
        if (profitBreakEvenMonth === null && cumulativeOperatingProfit > 0 && month >= 1) {
            profitBreakEvenMonth = month;
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
    
    for (const month of timelineMonths) {
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

        if (cashBreakEvenMonth === null && cumulativeCash > 0 && month >= 1) {
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
        potentialCashBalance: 0, // This will be calculated and added in the main function
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
}


export function calculateFinancials(inputs: EngineInput): EngineOutput {
    try {
        // 1. Calculate the "Achieved" scenario with user's original inputs
        const achievedResult = calculateScenario(inputs);

        // 2. Create inputs for the "Potential" scenario
        const potentialInputs = JSON.parse(JSON.stringify(inputs)); // Deep copy
        potentialInputs.products.forEach((p: Product) => {
            p.sellThrough = 100;
        });
        
        // 3. Calculate the "Potential" scenario
        const potentialResult = calculateScenario(potentialInputs);

        // 4. Augment the "Achieved" result with the potential cash balance
        achievedResult.cashFlowSummary.potentialCashBalance = potentialResult.cashFlowSummary.endingCashBalance;

        return achievedResult;

    } catch (e: any) {
        console.error("Error in financial calculation:", e);
        throw new Error(e.message || 'An unknown error occurred in financial calculation.');
    }
}
