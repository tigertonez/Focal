
'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { ProfitPageSkeleton } from '@/components/app/profit/ProfitPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, Briefcase, Landmark, Target } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfitBreakdownChart } from '@/components/app/profit/charts/ProfitBreakdownChart';
import { ProfitLayersChart } from '@/components/app/profit/charts/ProfitLayersChart';
import { ProductProfitTable } from '@/components/app/profit/ProductProfitTable';

function ProfitPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();
  const { profitSummary, monthlyProfit, revenueSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialGrossProfit = revenueSummary.totalRevenue - data.costSummary.totalVariable;
  const profitProgress = potentialGrossProfit > 0 ? (profitSummary.totalGrossProfit / potentialGrossProfit) * 100 : 0;
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title="Profit Analysis" description="Analysis of your gross, operating, and net profit." />
      
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Gross Profit" value={formatCurrency(profitSummary.totalGrossProfit, currency)} icon={<TrendingUp />} />
          <KpiCard label="Total Operating Profit" value={formatCurrency(profitSummary.totalOperatingProfit, currency)} icon={<Briefcase />} />
          <KpiCard label="Total Net Profit" value={formatCurrency(profitSummary.totalNetProfit, currency)} icon={<Landmark />} />
          <KpiCard label="Net Margin" value={`${(profitSummary.netMargin || 0).toFixed(1)}%`} icon={<Target />} />
        </div>
        {potentialGrossProfit > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Achieved vs. Potential Gross Profit</span>
              <span className="font-medium text-foreground">
                {formatCurrency(profitSummary.totalGrossProfit, currency)} of {formatCurrency(potentialGrossProfit, currency)}
              </span>
            </div>
            <Progress value={profitProgress} className="h-2" />
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-8">
         <Card>
            <CardHeader>
                <CardTitle>Cumulative Operating Profit</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-0">
               <ProfitBreakdownChart data={data} currency={currency} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>How Profit is Calculated</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full flex items-center">
                <ProfitLayersChart data={profitSummary} currency={currency} totalRevenue={revenueSummary.totalRevenue} />
            </CardContent>
        </Card>
      </section>

       <section>
          <Card>
            <CardHeader>
              <CardTitle>Product-Level Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductProfitTable data={data} inputs={inputs} />
            </CardContent>
          </Card>
        </section>

      <footer className="flex justify-end mt-8 pt-6 border-t">
        <Button onClick={() => router.push('/cash-flow')}>
          Continue to Cash Flow <ArrowRight className="ml-2" />
        </Button>
      </footer>
    </div>
  )
}

export default function ProfitPage() {
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
    return <ProfitPageSkeleton />;
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
    return <ProfitPageSkeleton />;
  }

  return <ProfitPageContent data={data} inputs={inputs} />;
}
