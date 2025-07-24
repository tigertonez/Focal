
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
import type { EngineOutput, EngineInput, Product, FixedCostItem } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { InvestmentPieChart } from '@/components/app/costs/charts/InvestmentPieChart';
import { CostsInsights } from '@/components/app/costs/CostsInsights';
import { useForecast } from '@/context/ForecastContext';


function CostsPageContent({ data, inputs, t }: { data: EngineOutput, inputs: EngineInput, t: any }) {
    const router = useRouter();
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;
    const preOrder = inputs.parameters.preOrder;

    const { costSummary, monthlyCosts, revenueSummary } = data;
    
    const depositProgress = costSummary.totalVariable > 0 ? (costSummary.totalDepositsPaid / costSummary.totalVariable) * 100 : 0;
    
    const investmentData = [
      {
        name: 'Total Variable Costs',
        value: costSummary.totalVariable,
        color: 'hsl(var(--primary))',
      },
      ...inputs.fixedCosts.map(cost => ({
          name: cost.name,
          value: cost.costType === 'Monthly Cost' ? cost.amount * inputs.parameters.forecastMonths : cost.amount,
          item: cost,
      })),
    ].filter(item => item.value > 0);


    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title={t.pages.costs.title} description={t.pages.costs.description} />
            
            <section>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard 
                        label={t.pages.costs.kpi.fixed}
                        value={formatCurrency(costSummary.totalFixed, currency)} 
                        icon={<Building />}
                        helpTitle={t.pages.costs.kpi.fixed}
                        help={t.pages.costs.kpi.fixedHelp}
                    />
                    <KpiCard 
                        label={t.pages.costs.kpi.variable}
                        value={formatCurrency(costSummary.totalVariable, currency)} 
                        icon={<Package />}
                        helpTitle={t.pages.costs.kpi.variable}
                        help={t.pages.costs.kpi.variableHelp}
                    />
                    <KpiCard 
                        label={t.pages.costs.kpi.operating}
                        value={formatCurrency(costSummary.totalOperating, currency)} 
                        icon={<Activity />}
                        helpTitle={t.pages.costs.kpi.operating}
                        help={t.pages.costs.kpi.operatingHelp}
                    />
                    <KpiCard 
                        label={t.pages.costs.kpi.avgCost}
                        value={formatCurrency(costSummary.avgCostPerUnit, currency)} 
                        icon={<Calculator />}
                        helpTitle={t.pages.costs.kpi.avgCost}
                        help={t.pages.costs.kpi.avgCostHelp}
                    />
                </div>
                 {isManualMode && costSummary.totalVariable > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{t.pages.costs.progress}</span>
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
                        <CardTitle>{t.pages.costs.charts.timeline}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyCosts} currency={currency} />
                    </CardContent>
                </Card>
            </section>

             <section className="grid md:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">{t.pages.costs.breakdown.fixed}</h2>
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
                                   label={t.pages.costs.breakdown.totalFixed}
                                   value={formatCurrency(costSummary.totalFixed, currency)}
                                   className="font-bold pt-2"
                               />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">{t.pages.costs.charts.investment}</h2>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-primary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.59L12 15.17l-1.41 1.42L9.17 18l-2.83-2.83 1.41-1.41L9.17 15.17l1.41-1.42L12 15.17l2.83-2.83 1.41 1.41L14.83 18l1.41-1.41.01.01.01-.01zM12 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>
                                    {t.pages.costs.charts.investment}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                <InvestmentPieChart data={investmentData} currency={currency} />
                            </CardContent>
                         </Card>
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{t.pages.costs.breakdown.variable}</h2>
                     <Card>
                        <CardContent className="p-4 space-y-4">
                            {costSummary.variableCosts.map(product => (
                                <div key={product.name} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <CostRow label={t.pages.costs.breakdown.plannedUnits} value={product.plannedUnits.toLocaleString()} />
                                    <CostRow label={t.pages.costs.breakdown.unitCost} value={formatCurrency(product.unitCost, currency)} />
                                    <CostRow label={t.pages.costs.breakdown.productionCost} value={formatCurrency(product.totalProductionCost, currency)} />
                                    <CostRow label={t.pages.costs.breakdown.depositPaid.replace('{month}', preOrder ? '0' : '1')} value={formatCurrency(product.depositPaid, currency)} />
                                    <CostRow label={t.pages.costs.breakdown.finalPayment.replace('{month}', preOrder ? '1' : '1')} value={formatCurrency(product.remainingCost, currency)} />
                                </div>
                            ))}
                            <Separator className="my-2" />
                            <CostRow 
                               label={t.pages.costs.breakdown.totalVariable}
                               value={formatCurrency(costSummary.totalVariable, currency)}
                               className="font-bold pt-2"
                           />
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="pt-4">
              <CostsInsights costSummary={costSummary} revenueSummary={revenueSummary} currency={currency} />
            </section>

            <footer className="flex justify-end mt-8 pt-6 border-t">
              <Button onClick={() => router.push('/profit')}>
                {t.pages.costs.footer} <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

export default function CostsPage() {
    const { t } = useForecast();
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
        return <CostsPageSkeleton t={t} />;
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        {error} {t.errors.calculationErrorDescription}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!data || !inputs) {
        return <CostsPageSkeleton t={t} />;
    }

    return <CostsPageContent data={data} inputs={inputs} t={t} />;
}
