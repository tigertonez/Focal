
'use client';

import React from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { CostsPageSkeleton } from '@/components/app/costs/CostsPageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, getProductColor } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyTimelineChart } from '@/components/app/costs/charts/MonthlyTimelineChart';
import { Separator } from '@/components/ui/separator';
import { CostRow } from '@/components/app/costs/CostRow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ArrowRight, Building, Package, Activity, Calculator, ArrowLeft } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { InvestmentPieChart } from '@/components/app/costs/charts/InvestmentPieChart';
import { CostsInsights } from '@/components/app/costs/CostsInsights';
import { useForecast } from '@/context/ForecastContext';


function CostsPageContent({ data, inputs, t }: { data: EngineOutput, inputs: EngineInput, t: any }) {
    const router = useRouter();
    const isManualMode = inputs.realtime.dataSource === 'Manual';
    const currency = inputs.parameters.currency;
    const preOrder = inputs.company?.production === 'preorder';

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
                       <MonthlyTimelineChart data={monthlyCosts} currency={currency} />
                    </CardContent>
                </Card>
            </section>

             <section className="grid md:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-8">
                    <div className="space-y-2">
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {t.pages.costs.charts.investment}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                <InvestmentPieChart data={investmentData} currency={currency} />
                            </CardContent>
                         </Card>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">{t.pages.costs.breakdown.fixed}</h2>
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                {costSummary.fixedCosts.map(cost => (
                                   <CostRow 
                                       key={cost.id}
                                       label={`${cost.name} (${cost.costType === 'Monthly Cost' ? 'monthly' : 'one-time'})`}
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
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{t.pages.costs.breakdown.variable}</h2>
                     <Card>
                        <CardContent className="p-4 space-y-4">
                            {inputs.products.map(p => {
                                const productCost = costSummary.variableCosts.find(vc => vc.name === p.productName);
                                if (!productCost) return null;

                                return (
                                    <div key={p.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(p) }} />
                                            {p.productName}
                                        </h3>
                                        <CostRow label={t.pages.costs.breakdown.plannedUnits} value={productCost.plannedUnits.toLocaleString()} />
                                        <CostRow label={t.pages.costs.breakdown.unitCost} value={formatCurrency(productCost.unitCost, currency)} />
                                        <CostRow label={t.pages.costs.breakdown.productionCost} value={formatCurrency(productCost.totalProductionCost, currency)} />
                                        <CostRow label={t.pages.costs.breakdown.depositPaid.replace('{month}', preOrder ? '0' : '1')} value={formatCurrency(productCost.depositPaid, currency)} />
                                        <CostRow label={t.pages.costs.breakdown.finalPayment.replace('{month}', preOrder ? '1' : '1')} value={formatCurrency(productCost.remainingCost, currency)} />
                                    </div>
                                )
                            })}
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

            <footer className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => router.push('/revenue')}>
                  <ArrowLeft className="mr-2" /> Back to Revenue
              </Button>
              <Button onClick={() => router.push('/profit')}>
                {t.pages.costs.footer} <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

export default function CostsPage() {
    const { t, financials, inputs: contextInputs } = useForecast();

    if (financials.isLoading) {
        return <CostsPageSkeleton t={t} />;
    }

    if (financials.error) {
        return (
            <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        {financials.error} {t.errors.calculationErrorDescription}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!financials.data || !contextInputs) {
        return <CostsPageSkeleton t={t} />;
    }

    return <CostsPageContent data={financials.data} inputs={contextInputs} t={t} />;
}
