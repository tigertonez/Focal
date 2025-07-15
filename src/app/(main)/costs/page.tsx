
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { useCosts } from '@/hooks/useCosts';
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CostRow } from '@/components/app/costs/CostRow';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { CostsPageSkeleton } from '@/components/app/costs/CostsPageSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CostsPage() {
    const { inputs } = useForecast();
    const { costSummary, error, isLoading } = useCosts();

    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;
    const preOrder = inputs.parameters.preOrder;

    if (isLoading) {
        return <CostsPageSkeleton />;
    }

    if (error && !costSummary) {
        return (
             <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Calculation Error</AlertTitle>
                    <AlertDescription>
                        {error} Please correct the issues on the Inputs page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!costSummary) {
        return <CostsPageSkeleton />;
    }
    
    const depositProgress = costSummary.totalVariable > 0 ? (costSummary.totalDepositsPaid / costSummary.totalVariable) * 100 : 0;
    
    const totalFixedCostsFromInputs = inputs.fixedCosts.reduce((acc, cost) => {
        if (cost.paymentSchedule === 'Up-Front') {
            return acc + cost.amount;
        }
        if (cost.paymentSchedule === 'Monthly' || cost.paymentSchedule === 'According to Sales') {
            const months = inputs.parameters.preOrder ? inputs.parameters.forecastMonths : inputs.parameters.forecastMonths;
            return acc + (cost.amount * months);
        }
         if (cost.paymentSchedule === 'Quarterly') {
            const months = inputs.parameters.preOrder ? inputs.parameters.forecastMonths : inputs.parameters.forecastMonths;
            const quarters = Math.ceil(months / 3);
            return acc + (cost.amount * quarters);
        }
        return acc + cost.amount;
    }, 0);


    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title="Cost Analysis" description="Breakdown of your operating costs." />
            
             {error && (
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Input Warning</AlertTitle>
                    <AlertDescription>
                        {error} The chart below may not be up-to-date.
                    </AlertDescription>
                </Alert>
             )}


            <section>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Fixed Costs" value={formatCurrency(costSummary.totalFixed, currency)} />
                    <KpiCard label="Total Variable Costs" value={formatCurrency(costSummary.totalVariable, currency)} />
                    <KpiCard label="Total Operating Costs" value={formatCurrency(costSummary.totalOperating, currency)} />
                    <KpiCard label="Avg. Cost per Unit" value={formatCurrency(costSummary.avgCostPerUnit, currency)} />
                </div>
                 {isManualMode && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Total Deposits Paid by You</span>
                            <span>{depositProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={depositProgress} />
                    </div>
                )}
            </section>
            
            <section className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Fixed Cost Breakdown</h2>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            {inputs.fixedCosts.map(cost => (
                               <CostRow 
                                   key={cost.id}
                                   label={`${cost.name} (${cost.paymentSchedule})`}
                                   value={formatCurrency(cost.amount, currency)}
                               />
                            ))}
                            <Separator className="my-2" />
                            <CostRow 
                               label="Total Forecasted Fixed"
                               value={formatCurrency(costSummary.totalFixed, currency)}
                               className="font-bold pt-2"
                           />
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Variable Cost Breakdown (per Product)</h2>
                     <Card>
                        <CardContent className="p-4 space-y-4">
                            {costSummary.variableCosts.map(product => (
                                <div key={product.name} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <CostRow label="Planned Units" value={product.plannedUnits.toLocaleString()} />
                                    <CostRow label="Unit Cost" value={formatCurrency(product.unitCost, currency)} />
                                    <CostRow label="Total Production Cost" value={formatCurrency(product.totalProductionCost, currency)} />
                                    <CostRow label={`Deposit Paid (Month ${preOrder ? 0 : '1'})`} value={formatCurrency(product.depositPaid, currency)} />
                                    <CostRow label={`Final Payment (Month ${preOrder ? 1 : '2'})`} value={formatCurrency(product.remainingCost, currency)} />
                                </div>
                            ))}
                            <Separator className="my-2" />
                            <CostRow 
                               label="Total Variable"
                               value={formatCurrency(costSummary.totalVariable, currency)}
                               className="font-bold pt-2"
                           />
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
