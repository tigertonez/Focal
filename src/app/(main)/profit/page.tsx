
'use client';

import React, {useEffect} from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { ProfitPageSkeleton } from '@/components/app/profit/ProfitPageSkeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, TrendingUp, Briefcase, Landmark, Target } from 'lucide-react';
import type { EngineOutput, EngineInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfitBreakdownChart } from '@/components/app/profit/charts/ProfitBreakdownChart';
import { ProductProfitTable } from '@/components/app/profit/ProductProfitTable';
import { ProfitInsights } from '@/components/app/profit/ProfitInsights';
import { useForecast } from '@/context/ForecastContext';
import { usePrintMode, signalWhenReady } from '@/lib/printMode';
import { StaticProgress } from '@/components/print/StaticProgress';
import { seedPrintColorMap } from '@/lib/printColorMap';

function ProfitPageContent({ data, inputs, t, isPrint = false }: { data: EngineOutput, inputs: EngineInput, t: any, isPrint?: boolean }) {
  const router = useRouter();
  const { profitSummary } = data;
  const currency = inputs.parameters.currency;

  const potentialGrossProfit = profitSummary.potentialGrossProfit ?? 0;
  const achievedGrossProfit = profitSummary.totalGrossProfit;
  const profitProgress = potentialGrossProfit > 0 ? (achievedGrossProfit / potentialGrossProfit) * 100 : 0;
  
  const netMargin = profitSummary.netMargin;

  const netMarginTitle = t.pages.profit.kpi.margin;
  const netMarginTooltip = t.pages.profit.kpi.marginHelp;

  useEffect(() => {
    if (isPrint) {
      seedPrintColorMap(inputs.products.map(p => p.productName));
    }
  }, [isPrint, inputs.products]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <SectionHeader title={t.pages.profit.title} description={t.pages.profit.description} />
      
      <section style={{ breakInside: 'avoid' }}>
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
            value={`${netMargin.toFixed(1)}%`} 
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
            {isPrint ? <StaticProgress value={profitProgress} /> : <Progress value={profitProgress} className="h-2" />}
          </div>
        )}
      </section>

      <section style={{ breakInside: 'avoid' }}>
         <Card>
            <CardHeader>
                <CardTitle>{t.pages.profit.charts.breakdown}</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-0">
               <ProfitBreakdownChart data={data} currency={currency} isAnimationActive={!isPrint} isPrint={isPrint} />
            </CardContent>
        </Card>
      </section>

       <section style={{ breakInside: 'avoid' }}>
          <Card>
            <CardHeader>
              <CardTitle>{t.pages.profit.table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductProfitTable data={data} inputs={inputs} t={t} isPrint={isPrint} />
            </CardContent>
          </Card>
        </section>

        <section className="pt-4" data-no-print={isPrint} style={{ breakInside: 'avoid' }}>
            <ProfitInsights data={data} currency={currency} isPrint={isPrint} />
        </section>

      <footer className="flex justify-between mt-8 pt-6 border-t" data-no-print="true">
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
  const { t, financials, inputs, ensureForecastReady } = useForecast();
  const { isPrint, lang } = usePrintMode();

  React.useEffect(() => {
    if (!isPrint) return;
    (async () => {
        await signalWhenReady({ ensureForecastReady, root: document });
    })();
  }, [isPrint, ensureForecastReady]);

  if (financials.isLoading && !isPrint) {
    return <ProfitPageSkeleton t={t} />;
  }

  if (financials.error && !isPrint) {
    return (
      <div className="p-4 md:p-8" data-report-root>
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

  if (!financials.data || !inputs) {
    return (
        <div className="p-4 md:p-8 text-center" data-report-root>
            <Alert><AlertTitle>{t.errors.noData}</AlertTitle></Alert>
        </div>
    );
  }

  return (
    <div data-report-root>
      <ProfitPageContent data={financials.data} inputs={inputs} t={t} isPrint={isPrint} />
    </div>
  );
}
