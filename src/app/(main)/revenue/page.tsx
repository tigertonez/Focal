
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { RevenuePageSkeleton } from '@/components/app/revenue/RevenuePageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Users, Target, ArrowRight } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart';
import { getFinancials } from '@/lib/get-financials';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function RevenuePageContent({ data, inputs }: { data: EngineOutput; inputs: EngineInput }) {
    const router = useRouter();
    const currency = inputs.parameters.currency;
    const { revenueSummary, monthlyRevenue, monthlyUnitsSold } = data;

    const productChartConfig: Record<string, { label: string }> = {};
    inputs.products.forEach((p) => {
        productChartConfig[p.productName] = { label: p.productName };
    });
    
    const potentialRevenue = inputs.products.reduce((acc, p) => acc + (p.plannedUnits * p.sellPrice), 0);
    const revenueProgress = potentialRevenue > 0 ? (revenueSummary.totalRevenue / potentialRevenue) * 100 : 0;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title="Revenue Analysis" description="Breakdown of your revenue projections." />

            <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard 
                        label="Total Revenue" 
                        value={formatCurrency(revenueSummary.totalRevenue, currency)} 
                        help="Trend vs. previous period will be shown here when historical data is available."
                    />
                    <KpiCard label="Total Units Sold" value={formatNumber(revenueSummary.totalSoldUnits)} icon={<Users />} />
                    <KpiCard label="Avg. Revenue per Unit" value={formatCurrency(revenueSummary.avgRevenuePerUnit, currency)} />
                    <KpiCard label="Avg. Sell-Through" value={`${(inputs.products.reduce((acc, p) => acc + (p.sellThrough || 0), 0) / inputs.products.length).toFixed(0)}%`} icon={<Target />} />
                </div>
                 {potentialRevenue > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Forecasted vs. Potential Revenue</span>
                             <span className="font-medium text-foreground">
                                {formatCurrency(revenueSummary.totalRevenue, currency)} of {formatCurrency(potentialRevenue, currency)}
                            </span>
                        </div>
                        <Progress value={revenueProgress} className="h-2" />
                    </div>
                )}
            </section>
            
            <section className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyRevenue} currency={currency} configOverrides={productChartConfig} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Monthly Units Sold</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyUnitsSold} configOverrides={productChartConfig} formatAs="number" />
                    </CardContent>
                </Card>
            </section>
            
            <section>
                 <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Product</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                    <TableHead className="text-right">Share</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revenueSummary.productBreakdown.map((product) => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(product.totalRevenue, currency)}</TableCell>
                                        <TableCell className="text-right">
                                            {revenueSummary.totalRevenue > 0 
                                                ? `${((product.totalRevenue / revenueSummary.totalRevenue) * 100).toFixed(1)}%`
                                                : 'N/A'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <footer className="flex justify-end mt-8 pt-6 border-t">
              <Button onClick={() => router.push('/costs')}>
                Continue to Costs <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

export default function RevenuePage() {
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
        return <RevenuePageSkeleton />;
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
        return <RevenuePageSkeleton />;
    }

    if (data.revenueSummary.totalRevenue === 0) {
        return (
             <div className="p-4 md:p-8">
                <SectionHeader title="Revenue" description="Detailed revenue projections." />
                <div className="text-center text-muted-foreground mt-16">
                    <p>No revenue data to display.</p>
                    <p className="text-sm">Complete the product information on the Inputs page to see your revenue forecast.</p>
                     <Button onClick={() => router.push('/costs')} className="mt-4">
                        Continue to Costs <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        )
    }

    return <RevenuePageContent data={data} inputs={inputs} />;
}
