
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

const CostTimelineTable = ({ monthlyCosts, currency, isManualMode }: { monthlyCosts: any[], currency: string, isManualMode: boolean }) => (
    <div className="overflow-x-auto">
        <div className="text-sm text-muted-foreground min-w-[600px]">
            <div className="grid grid-cols-6 gap-4 font-semibold p-2 rounded-t-md">
                <span>Month</span>
                {isManualMode && <span>Deposits</span>}
                <span>Other Fixed</span>
                <span>Production</span>
                <span>Marketing</span>
                <span>Total</span>
            </div>
            <div className="space-y-1">
                {monthlyCosts.map((month, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 p-2 bg-muted/50 rounded-md">
                        <span>{i + 1}</span>
                        {isManualMode && <span>{formatCurrency(month.deposits, currency)}</span>}
                        <span>{formatCurrency(month.otherFixed, currency)}</span>
                        <span>{formatCurrency(month.production, currency)}</span>
                        <span>{formatCurrency(month.marketing, currency)}</span>
                        <span className="font-semibold">{formatCurrency(month.total, currency)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function CostsPage() {
    const { inputs } = useForecast();
    const { costSummary, monthlyCosts, depositProgress, error } = useCosts();

    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;

    if (error) {
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
        return (
            <div className="p-4 md:p-8">
                <p>Loading cost analysis...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title="Cost Analysis" description="Breakdown of your operating costs." />

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
                            <span>Deposits Paid by Customers</span>
                            <span>{depositProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={depositProgress} />
                    </div>
                )}
            </section>
            
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Cost Timeline</h2>
                <CostTimelineTable monthlyCosts={monthlyCosts} currency={currency} isManualMode={isManualMode} />
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">Fixed Cost Breakdown</h2>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    {costSummary.fixedCosts.map(cost => (
                       <CostRow 
                           key={cost.name}
                           label={cost.name}
                           value={formatCurrency(cost.amount, currency)}
                           percentage={(cost.amount / costSummary.totalFixed * 100).toFixed(1)}
                       />
                    ))}
                    <div className="pt-2 border-t">
                       <CostRow 
                           label="Planning Buffer"
                           value={formatCurrency(costSummary.planningBuffer, currency)}
                           percentage={(costSummary.planningBuffer / costSummary.totalFixed * 100).toFixed(1)}
                       />
                    </div>
                    <div className="pt-2 border-t font-bold">
                       <CostRow 
                           label="Total Fixed"
                           value={formatCurrency(costSummary.totalFixed, currency)}
                       />
                    </div>
                </div>
            </section>
            
            <section className="space-y-2">
                <h2 className="text-xl font-semibold">Variable Cost Breakdown</h2>
                 <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    {costSummary.variableCosts.map(product => (
                        <div key={product.name} className="space-y-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <CostRow label="Planned Units" value={product.plannedUnits.toLocaleString()} />
                            <CostRow label="Unit Cost" value={formatCurrency(product.unitCost, currency)} />
                            <CostRow label="Total Production Cost" value={formatCurrency(product.totalProductionCost, currency)} />
                            {isManualMode && (
                                <>
                                    <CostRow label="Deposit Paid" value={formatCurrency(product.depositPaid, currency)} />
                                    <CostRow label="Remaining Cost" value={formatCurrency(product.remainingCost, currency)} />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
