
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { RevenuePageSkeleton } from '@/components/app/revenue/RevenuePageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Users, Target } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart'; // Re-using for revenue timeline
import { RevenuePieChart } from '@/components/app/revenue/charts/RevenuePieChart';
import { getFinancials } from '@/lib/get-financials';

function RevenuePageContent({ data, inputs }: { data: EngineOutput; inputs: EngineInput }) {
    const currency = inputs.parameters.currency;
    const { revenueSummary, monthlyRevenue } = data;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <SectionHeader title="Revenue Analysis" description="Breakdown of your revenue projections." />

            <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Total Revenue" value={formatCurrency(revenueSummary.totalRevenue, currency)} />
                    <KpiCard label="Total Units Sold" value={revenueSummary.totalSoldUnits.toLocaleString()} icon={<Users />} />
                    <KpiCard label="Avg. Revenue per Unit" value={formatCurrency(revenueSummary.avgRevenuePerUnit, currency)} />
                    <KpiCard label="Sell-Through Target" value={`${inputs.products[0]?.sellThrough || 0}%`} icon={<Target />} />
                </div>
            </section>
            
            <section className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyRevenue} currency={currency} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Product</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full flex justify-center items-center">
                       <RevenuePieChart data={revenueSummary.productBreakdown} currency={currency} />
                    </CardContent>
                </Card>
            </section>

             <section className="space-y-2 pt-4">
                <h2 className="text-xl font-semibold">Revenue Breakdown by Product</h2>
                <Card>
                    <CardContent className="p-4 space-y-4">
                        {revenueSummary.productBreakdown.map(product => (
                            <div key={product.name} className="flex justify-between items-center text-sm border-b pb-2 last:border-b-0 last:pb-0">
                                <div className="space-y-1">
                                    <h3 className="font-semibold">{product.name}</h3>
                                    <p className="text-muted-foreground">{product.totalSoldUnits.toLocaleString()} units sold</p>
                                </div>
                                <div className="font-bold text-lg">
                                    {formatCurrency(product.totalRevenue, currency)}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
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
                </div>
            </div>
        )
    }

    return <RevenuePageContent data={data} inputs={inputs} />;
}
