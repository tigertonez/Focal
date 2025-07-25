
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { RevenuePageSkeleton } from '@/components/app/revenue/RevenuePageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber, getProductColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Users, Target, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import type { EngineOutput, EngineInput, Product } from '@/lib/types';
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart';
import { getFinancials } from '@/lib/get-financials';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RevenueInsights } from '@/components/app/revenue/RevenueInsights';
import { useForecast } from '@/context/ForecastContext';
import { RevenueBreakdownPieChart } from '@/components/app/revenue/charts/RevenueBreakdownPieChart';

function RevenuePageContent({ data, inputs, t }: { data: EngineOutput; inputs: EngineInput, t: any }) {
    const router = useRouter();
    const currency = inputs.parameters.currency;
    const { revenueSummary, monthlyRevenue, monthlyUnitsSold } = data;

    const productChartConfig: Record<string, { label: string }> = {};
    inputs.products.forEach((p) => {
        productChartConfig[p.productName] = { label: p.productName };
    });
    
    const potentialRevenue = inputs.products.reduce((acc, p) => acc + (p.plannedUnits! * p.sellPrice!), 0);
    const revenueProgress = potentialRevenue > 0 ? (revenueSummary.totalRevenue / potentialRevenue) * 100 : 0;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title={t.pages.revenue.title} description={t.pages.revenue.description} />

            <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard 
                        label={t.pages.revenue.kpi.totalRevenue}
                        value={formatCurrency(revenueSummary.totalRevenue, currency)} 
                        icon={<TrendingUp />}
                        helpTitle={t.pages.revenue.kpi.totalRevenue}
                        help={t.pages.revenue.kpi.totalRevenueHelp}
                    />
                    <KpiCard 
                        label={t.pages.revenue.kpi.totalUnits}
                        value={formatNumber(revenueSummary.totalSoldUnits)} 
                        icon={<Users />}
                        helpTitle={t.pages.revenue.kpi.totalUnits}
                        help={t.pages.revenue.kpi.totalUnitsHelp}
                    />
                    <KpiCard 
                        label={t.pages.revenue.kpi.avgRevenue}
                        value={formatCurrency(revenueSummary.avgRevenuePerUnit, currency)} 
                        icon={<DollarSign />}
                        helpTitle={t.pages.revenue.kpi.avgRevenue}
                        help={t.pages.revenue.kpi.avgRevenueHelp}
                    />
                    <KpiCard 
                        label={t.pages.revenue.kpi.avgSellThrough}
                        value={`${(inputs.products.reduce((acc, p) => acc + (p.sellThrough || 0), 0) / inputs.products.length).toFixed(0)}%`} 
                        icon={<Target />}
                        helpTitle={t.pages.revenue.kpi.avgSellThrough}
                        help={t.pages.revenue.kpi.avgSellThroughHelp}
                    />
                </div>
                 {potentialRevenue > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{t.pages.revenue.progress}</span>
                             <span className="font-medium text-foreground">
                                {formatCurrency(revenueSummary.totalRevenue, currency)} of {formatCurrency(potentialRevenue, currency)}
                            </span>
                        </div>
                        <Progress value={revenueProgress} className="h-2" />
                    </div>
                )}
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Revenue Contribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[350px] w-full">
                        <RevenueBreakdownPieChart data={revenueSummary.productBreakdown} currency={currency} inputs={inputs} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t.pages.revenue.charts.timeline}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyRevenue} currency={currency} configOverrides={productChartConfig} />
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t.pages.revenue.charts.units}</CardTitle>
                    </CardHeader>
                     <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyUnitsSold} configOverrides={productChartConfig} formatAs="number" />
                    </CardContent>
                </Card>
            </section>
            
            {/* Mobile Table - simplified */}
            <section className="md:hidden">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.pages.revenue.table.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3 pl-2">Product</TableHead>
                                    <TableHead className="text-right">Units</TableHead>
                                    <TableHead className="text-right">S-T %</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right pr-2">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revenueSummary.productBreakdown.map((product) => {
                                    const inputProduct = inputs.products.find(p => p.productName === product.name);
                                    if (!inputProduct) return null;
                                    
                                    const sellThrough = (inputProduct.sellThrough || 0);
                                    
                                    return (
                                        <TableRow key={product.name}>
                                            <TableCell className="font-medium flex items-center gap-2 pl-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(inputProduct) }} />
                                                <span className="truncate">{product.name}</span>
                                            </TableCell>
                                            <TableCell className="text-right">{formatNumber(product.totalSoldUnits)}</TableCell>
                                            <TableCell className="text-right">{sellThrough.toFixed(0)}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(inputProduct.sellPrice, currency, true)}</TableCell>
                                            <TableCell className="text-right font-bold pr-2">{formatCurrency(product.totalRevenue, currency, true)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>
            
            {/* Desktop Table */}
            <section className="hidden md:block">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.pages.revenue.table.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3">Product</TableHead>
                                    <TableHead className="text-right">Units Sold</TableHead>
                                    <TableHead className="text-right">Sell-Through %</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revenueSummary.productBreakdown.map((product) => {
                                    const inputProduct = inputs.products.find(p => p.productName === product.name);
                                    if (!inputProduct) return null;
                                    
                                    const sellThrough = (inputProduct.sellThrough || 0);
                                    
                                    return (
                                        <TableRow key={product.name}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(inputProduct) }} />
                                                <span>{product.name}</span>
                                            </TableCell>
                                            <TableCell className="text-right">{formatNumber(product.totalSoldUnits)}</TableCell>
                                            <TableCell className="text-right">{sellThrough.toFixed(0)}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(inputProduct.sellPrice, currency)}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(product.totalRevenue, currency)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <section className="pt-4">
              <RevenueInsights revenueSummary={revenueSummary} currency={currency} />
            </section>

            <footer className="flex justify-end mt-8 pt-6 border-t">
              <Button onClick={() => router.push('/costs')}>
                {t.pages.revenue.footer} <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

export default function RevenuePage() {
    const { t } = useForecast();
    const [financials, setFinancials] = useState<{ data: EngineOutput | null; inputs: EngineInput | null; error: string | null; isLoading: boolean }>({
        data: null,
        inputs: null,
        error: null,
        isLoading: true,
    });
    const router = useRouter();

    useEffect(() => {
        const result = getFinancials();
        setFinancials({ ...result, isLoading: false });
    }, []);

    const { data, inputs, error, isLoading } = financials;

    if (isLoading) {
        return <RevenuePageSkeleton t={t} />;
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
        return <RevenuePageSkeleton t={t} />;
    }

    if (data.revenueSummary.totalRevenue === 0) {
        return (
             <div className="p-4 md:p-8">
                <SectionHeader title={t.pages.revenue.title} description={t.pages.revenue.description} />
                <div className="text-center text-muted-foreground mt-16">
                    <p>{t.errors.noRevenue}</p>
                    <p className="text-sm">{t.errors.noRevenueDescription}</p>
                     <Button onClick={() => router.push('/costs')} className="mt-4">
                        {t.errors.continueToCosts} <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        )
    }

    return <RevenuePageContent data={data} inputs={inputs} t={t} />;
}
