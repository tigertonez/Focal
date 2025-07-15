
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart';
import { ChartWrapper } from '@/components/app/ChartWrapper';
import { CostsPageSkeleton } from '@/components/app/costs/CostsPageSkeleton';


const CostTimelineTable = ({ monthlyCosts, currency, preOrder }: { monthlyCosts: any[], currency: string, preOrder: boolean }) => (
    <div className="overflow-x-auto rounded-lg border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Month</TableHead>
                    <TableHead>Deposits Paid</TableHead>
                    <TableHead>Final Payments</TableHead>
                    <TableHead>Fixed Costs</TableHead>
                    <TableHead className="text-right">Total Monthly Cost</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {monthlyCosts.map((month, i) => (
                    <TableRow key={i}>
                        <TableCell className="font-medium">{preOrder ? month.month : month.month + 1}</TableCell>
                        <TableCell>{formatCurrency(month.deposits, currency)}</TableCell>
                        <TableCell>{formatCurrency(month.finalPayments, currency)}</TableCell>
                        <TableCell>{formatCurrency(month.fixed, currency)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(month.total, currency)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

export default function CostsPage() {
    const { inputs } = useForecast();
    const { costSummary, monthlyCosts, error } = useCosts();

    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;
    const preOrder = inputs.parameters.preOrder;

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
    
    if (!costSummary || !monthlyCosts) {
        return <CostsPageSkeleton />;
    }
    
    const depositProgress = costSummary.totalVariable > 0 ? (costSummary.totalDepositsPaid / costSummary.totalVariable) * 100 : 0;
    const totalBaseFixedCosts = costSummary.fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);


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
                            <span>Total Deposits Paid by You</span>
                            <span>{depositProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={depositProgress} />
                    </div>
                )}
            </section>
            
            <section>
                <ChartWrapper title="Monthly Cost Timeline">
                    <CostTimelineChart data={monthlyCosts} currency={currency} preOrder={preOrder} />
                </ChartWrapper>
            </section>
            
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Cost Timeline</h2>
                <CostTimelineTable monthlyCosts={monthlyCosts} currency={currency} preOrder={inputs.parameters.preOrder} />
            </section>

            <section className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Fixed Cost Breakdown</h2>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        {costSummary.fixedCosts.map(cost => (
                           <CostRow 
                               key={cost.name}
                               label={cost.name}
                               value={formatCurrency(cost.amount, currency)}
                           />
                        ))}
                         {costSummary.planningBuffer > 0 && (
                            <CostRow
                                label="Planning Buffer"
                                value={formatCurrency(costSummary.planningBuffer, currency)}
                            />
                        )}
                        <div className="pt-2 border-t font-bold">
                           <CostRow 
                               label="Total Fixed (Base)"
                               value={formatCurrency(totalBaseFixedCosts + costSummary.planningBuffer, currency)}
                           />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Variable Cost Breakdown (per Product)</h2>
                     <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                        {costSummary.variableCosts.map(product => (
                            <div key={product.name} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                                <h3 className="font-semibold">{product.name}</h3>
                                <CostRow label="Planned Units" value={product.plannedUnits.toLocaleString()} />
                                <CostRow label="Unit Cost" value={formatCurrency(product.unitCost, currency)} />
                                <CostRow label="Total Production Cost" value={formatCurrency(product.totalProductionCost, currency)} />
                                <CostRow label={`Deposit Paid (Month ${preOrder ? 1 : 1})`} value={formatCurrency(product.depositPaid, currency)} />
                                <CostRow label={`Final Payment (Month ${preOrder ? 2 : 2})`} value={formatCurrency(product.remainingCost, currency)} />
                            </div>
                        ))}
                         <div className="pt-2 border-t font-bold">
                           <CostRow 
                               label="Total Variable"
                               value={formatCurrency(costSummary.totalVariable, currency)}
                           />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
