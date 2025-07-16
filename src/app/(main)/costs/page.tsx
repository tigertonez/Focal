
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CostsPageSkeleton } from '@/components/app/costs/CostsPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart';
import { Separator } from '@/components/ui/separator';
import { CostRow } from '@/components/app/costs/CostRow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ArrowRight, Building, Package, Activity, Calculator } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function CostsPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
    const router = useRouter();
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;
    const preOrder = inputs.parameters.preOrder;

    const { costSummary, monthlyCosts } = data;
    
    const depositProgress = costSummary.totalVariable > 0 ? (costSummary.totalDepositsPaid / costSummary.totalVariable) * 100 : 0;
    
    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title="Cost Analysis" description="Breakdown of your operating costs." />
            
            <section>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard 
                        label="Total Fixed Costs" 
                        value={formatCurrency(costSummary.totalFixed, currency)} 
                        icon={<Building />}
                        helpTitle="Total Fixed Costs"
                        help="Recurring, predictable expenses that don't change with sales volume (e.g., salaries, rent). This is your company's baseline cost."
                    />
                    <KpiCard 
                        label="Total Variable Costs" 
                        value={formatCurrency(costSummary.totalVariable, currency)} 
                        icon={<Package />}
                        helpTitle="Total Variable Costs"
                        help="Costs that are directly tied to the number of units you produce (e.g., unit cost, manufacturing deposits). This scales with production."
                    />
                    <KpiCard 
                        label="Total Operating Costs" 
                        value={formatCurrency(costSummary.totalOperating, currency)} 
                        icon={<Activity />}
                        helpTitle="Total Operating Costs"
                        help="The total of all expenses required to run the business (Fixed Costs + Variable Costs)."
                    />
                    <KpiCard 
                        label="Avg. var. Cost per Unit" 
                        value={formatCurrency(costSummary.avgCostPerUnit, currency)} 
                        icon={<Calculator />}
                        helpTitle="Avg. Variable Cost per Unit"
                        help="The average variable cost to produce one unit across all your products (Total Variable Costs / Total Planned Units)."
                    />
                </div>
                 {isManualMode && costSummary.totalVariable > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Production Deposit Paid</span>
                             <span className="font-medium text-foreground">
                                {formatCurrency(costSummary.totalDepositsPaid, currency)} of {formatCurrency(costSummary.totalVariable, currency)}
                            </span>
                        </div>
                        <Progress value={depositProgress} />
                    </div>
                )}
            </section>
            
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Cost Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyCosts} currency={currency} />
                    </CardContent>
                </Card>
            </section>

             <section className="grid md:grid-cols-1 gap-8 pt-4">
                 <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Fixed Cost Breakdown</h2>
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            {costSummary.fixedCosts.map(cost => (
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
                                    <CostRow label={`Final Payment (Month ${preOrder ? 1 : '1'})`} value={formatCurrency(product.remainingCost, currency)} />
                                </div>
                            ))}
                            <Separator className="my-2" />
                            <CostRow 
                               label="Total Variable Costs"
                               value={formatCurrency(costSummary.totalVariable, currency)}
                               className="font-bold pt-2"
                           />
                        </CardContent>
                    </Card>
                </div>
            </section>

            <footer className="flex justify-end mt-8 pt-6 border-t">
              <Button onClick={() => router.push('/profit')}>
                Continue to Profit <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

export default function CostsPage() {
    const [financials, setFinancials] = useState<{ data: EngineOutput | null; inputs: EngineInput | null; error: string | null; isLoading: boolean }>({
        data: null,
        inputs: null,
        error: null,
        isLoading: true,
    });

    useEffect(() => {
        const result = getFinancials();
        setFinancials({ ...result, isLoading: false });
    }, []);

    const { data, inputs, error, isLoading } = financials;

    if (isLoading) {
        return <CostsPageSkeleton />;
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Calculation Error</AlertTitle>
                    <AlertDescription>
                        {error} Please correct the issues on the Inputs page and try again.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!data || !inputs) {
        return <CostsPageSkeleton />;
    }

    return <CostsPageContent data={data} inputs={inputs} />;
}
