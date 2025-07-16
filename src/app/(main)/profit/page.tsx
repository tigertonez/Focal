
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
import { ProductProfitTable } from '@/components/app/profit/ProductProfitTable';
import { ProfitInsights } from '@/components/app/profit/ProfitInsights';

function ProfitPageContent({ data, inputs }: { data: EngineOutput, inputs: EngineInput }) {
  const router = useRouter();
  const { profitSummary, revenueSummary, costSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialRevenue = inputs.products.reduce((acc, p) => acc + (p.plannedUnits || 0) * (p.sellPrice || 0), 0);
  const potentialGrossProfit = potentialRevenue - costSummary.totalVariable;

  const achievedGrossProfit = profitSummary.totalGrossProfit;
  const profitProgress = potentialGrossProfit > 0 ? (achievedGrossProfit / potentialGrossProfit) * 100 : 0;
  
  let totalMarginSum = 0;
  let productsWithRevenue = 0;

  inputs.products.forEach((product) => {
      const revenueData = revenueSummary.productBreakdown.find(p => p.name === product.productName);
      const productRevenue = revenueData?.totalRevenue || 0;
      
      if (productRevenue > 0) {
          const unitsSold = revenueData?.totalSoldUnits || 0;
          const productCogs = unitsSold * (product.unitCost || 0);
          const grossProfit = productRevenue - productCogs;
          const netProfit = grossProfit - (costSummary.totalFixed * (productRevenue / revenueSummary.totalRevenue)) - ((profitSummary.totalOperatingProfit - profitSummary.totalNetProfit) * (productRevenue / revenueSummary.totalRevenue));
          const netMargin = (netProfit / productRevenue) * 100;
          
          totalMarginSum += netMargin;
          productsWithRevenue++;
      }
  });

  const averageNetMargin = productsWithRevenue > 0 ? totalMarginSum / productsWithRevenue : 0;
  
  const netMarginTitle = "Average Net Margin";
  const netMarginTooltip = "The average of the net profit margins from each of your products. This KPI gives a general sense of product-level profitability, but it isn't weighted by revenue.";

  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title="Profit Analysis" description="Analysis of your gross, operating, and net profit." />
      
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Total Gross Profit" 
            value={formatCurrency(profitSummary.totalGrossProfit, currency)} 
            icon={<TrendingUp />} 
            helpTitle="What is Gross Profit?"
            help="Total Revenue minus the direct Cost of Goods Sold (COGS). It measures how efficiently you produce and sell your products before other expenses."
          />
          <KpiCard 
            label="Total Operating Profit" 
            value={formatCurrency(profitSummary.totalOperatingProfit, currency)} 
            icon={<Briefcase />}
            helpTitle="What is Operating Profit?"
            help="Gross Profit minus all fixed operating costs (like salaries and rent). This shows the profit from core business operations."
          />
          <KpiCard 
            label="Total Net Profit" 
            value={formatCurrency(profitSummary.totalNetProfit, currency)} 
            icon={<Landmark />}
            helpTitle="What is Net Profit?"
            help="The final 'bottom-line' profit after all expenses, including taxes, have been deducted from revenue. This is your company's actual profit."
          />
          <KpiCard 
            label="Avg. Net Margin" 
            value={`${averageNetMargin.toFixed(1)}%`} 
            icon={<Target />} 
            helpTitle={netMarginTitle}
            help={netMarginTooltip} 
          />
        </div>
        {potentialGrossProfit > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Achieved vs. Potential Gross Profit</span>
              <span className="font-medium text-foreground">
                 Achieved: {formatCurrency(achievedGrossProfit, currency)} of {formatCurrency(potentialGrossProfit, currency)} Potential
              </span>
            </div>
            <Progress value={profitProgress} className="h-2" />
          </div>
        )}
      </section>

      <section>
         <Card>
            <CardHeader>
                <CardTitle>Cumulative Operating Profit</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-0">
               <ProfitBreakdownChart data={data} currency={currency} />
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

        <section className="pt-4">
            <ProfitInsights data={data} currency={currency} />
        </section>

      <footer className="flex justify-end mt-8 pt-6 border-t">
        <Button onClick={() => router.push('/cash-flow')}>
          Continue to Cash Flow <ArrowRight className="ml-2" />
        </Button>
      </footer>
    </div>
  );
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
