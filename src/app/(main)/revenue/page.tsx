
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { RevenuePageSkeleton } from '@/components/app/revenue/RevenuePageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Users, Target, ArrowRight } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { CostTimelineChart } from '@/components/app/costs/charts/CostTimelineChart'; // Re-using for revenue timeline
import { getFinancials } from '@/lib/get-financials';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function RevenuePageContent({ data, inputs }: { data: EngineOutput; inputs: EngineInput }) {
    const router = useRouter();
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
            
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                       <CostTimelineChart data={monthlyRevenue} currency={currency} />
                    </CardContent>
                </Card>
            </section>

            <footer className="flex justify-end mt-8 pt-6 border-t">
              <Button onClick={() => router.push('/profit')}>
                Continue to Profit <ArrowRight className="ml-2" />
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
