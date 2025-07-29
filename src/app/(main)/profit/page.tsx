

'use client';

import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { ProfitPageSkeleton } from '@/components/app/profit/ProfitPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, TrendingUp, Briefcase, Landmark, Target } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { getFinancials } from '@/lib/get-financials';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber, getProductColor } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfitBreakdownChart } from '@/components/app/profit/charts/ProfitBreakdownChart';
import { ProductProfitTable } from '@/components/app/profit/ProductProfitTable';
import { ProfitInsights } from '@/components/app/profit/ProfitInsights';
import { useForecast } from '@/context/ForecastContext';

function ProfitPageContent({ data, inputs, t }: { data: EngineOutput, inputs: EngineInput, t: any }) {
  const router = useRouter();
  const { profitSummary, revenueSummary, costSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialGrossProfit = profitSummary.potentialGrossProfit ?? 0;
  const achievedGrossProfit = profitSummary.totalGrossProfit;
  const profitProgress = potentialGrossProfit > 0 ? (achievedGrossProfit / potentialGrossProfit) * 100 : 0;
  
  // =================================================================
  // CORRECTED WEIGHTED AVERAGE NET MARGIN CALCULATION
  // =================================================================
  const weightedNetMargin = React.useMemo(() => {
    const { productBreakdown } = revenueSummary;
    const { totalOperatingProfit, totalNetProfit } = profitSummary;
    const { totalFixed, cogsOfSoldGoods } = costSummary;

    const totalRevenue = revenueSummary.totalRevenue;
    if (totalRevenue === 0) return 0;
    
    const totalTaxAmount = totalOperatingProfit > 0 ? totalOperatingProfit - totalNetProfit : 0;

    const totalWeightedMargin = productBreakdown.reduce((acc, productRev) => {
        const productInput = inputs.products.find(p => p.productName === productRev.name);
        if (!productInput) return acc;
        
        const soldUnits = productRev.totalSoldUnits;
        const cogs = soldUnits * (productInput.unitCost || 0);
        const grossProfit = productRev.totalRevenue - cogs;
        
        const revenueShare = productRev.totalRevenue / totalRevenue;
        const allocatedFixed = totalFixed * revenueShare;
        
        const operatingProfit = grossProfit - allocatedFixed;
        
        let productTax = 0;
        if (totalOperatingProfit > 0 && operatingProfit > 0) {
            productTax = totalTaxAmount * (operatingProfit / totalOperatingProfit);
        }
        
        const netProfit = operatingProfit - productTax;
        const netMargin = productRev.totalRevenue > 0 ? (netProfit / productRev.totalRevenue) : 0;
        
        // Weight the product's net margin by its share of total revenue
        return acc + (netMargin * revenueShare);
    }, 0);

    return totalWeightedMargin * 100;
  }, [data, inputs]);
  // =================================================================

  const netMarginTitle = t.pages.profit.kpi.margin;
  const netMarginTooltip = t.pages.profit.kpi.marginHelp;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <SectionHeader title={t.pages.profit.title} description={t.pages.profit.description} />
      
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label={t.pages.profit.kpi.gross}
            value={formatCurrency(profitSummary.totalGrossProfit, currency)} 
            icon={<TrendingUp />} 
            helpTitle={t.pages.profit.kpi.gross}
            help={t.pages.profit.kpi.grossHelp}
          />
          <KpiCard 
            label={t.pages.profit.kpi.operating}
            value={formatCurrency(profitSummary.totalOperatingProfit, currency)} 
            icon={<Briefcase />}
            helpTitle={t.pages.profit.kpi.operating}
            help={t.pages.profit.kpi.operatingHelp}
          />
          <KpiCard 
            label={t.pages.profit.kpi.net}
            value={formatCurrency(profitSummary.totalNetProfit, currency)} 
            icon={<Landmark />}
            helpTitle={t.pages.profit.kpi.net}
            help={t.pages.profit.kpi.netHelp}
          />
          <KpiCard 
            label={netMarginTitle}
            value={`${weightedNetMargin.toFixed(1)}%`} 
            icon={<Target />} 
            helpTitle={netMarginTitle}
            help={netMarginTooltip} 
          />
        </div>
        {potentialGrossProfit > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t.pages.profit.progress}</span>
              <span className="font-medium text-foreground">
                 {formatCurrency(achievedGrossProfit, currency)} of {formatCurrency(potentialGrossProfit, currency)}
              </span>
            </div>
            <Progress value={profitProgress} className="h-2" />
          </div>
        )}
      </section>

      <section>
         <Card>
            <CardHeader>
                <CardTitle>{t.pages.profit.charts.breakdown}</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-0">
               <ProfitBreakdownChart data={data} currency={currency} />
            </CardContent>
        </Card>
      </section>

       <section>
          <Card>
            <CardHeader>
              <CardTitle>{t.pages.profit.table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductProfitTable data={data} inputs={inputs} t={t} />
            </CardContent>
          </Card>
        </section>

        <section className="pt-4">
            <ProfitInsights data={data} currency={currency} />
        </section>

      <footer className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={() => router.push('/costs')}>
            <ArrowLeft className="mr-2" /> Back to Costs
        </Button>
        <Button onClick={() => router.push('/cash-flow')}>
          {t.pages.profit.footer} <ArrowRight className="ml-2" />
        </Button>
      </footer>
    </div>
  );
}

export default function ProfitPage() {
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
    return <ProfitPageSkeleton t={t} />;
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
    return <ProfitPageSkeleton t={t} />;
  }

  return <ProfitPageContent data={data} inputs={inputs} t={t} />;
}
