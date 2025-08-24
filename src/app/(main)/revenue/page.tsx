

'use client';

import React, { useEffect, useMemo } from 'react';
import { SectionHeader } from '@/components/app/SectionHeader';
import { RevenuePageSkeleton } from '@/components/app/revenue/RevenuePageSkeleton';
import { KpiCard } from '@/components/app/KpiCard';
import { formatCurrency, formatNumber, getProductColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Users, Target, ArrowRight, TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';
import type { EngineOutput, EngineInput, Product, MonthlyRevenue, MonthlyUnitsSold } from '@/lib/types';
import { MonthlyRevenueTimeline } from '@/components/app/revenue/charts/MonthlyRevenueTimeline';
import { MonthlyUnitsSoldChart } from '@/components/app/revenue/charts/MonthlyUnitsSoldChart';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RevenueInsights } from '@/components/app/revenue/RevenueInsights';
import { useForecast } from '@/context/ForecastContext';
import { usePrintMode } from '@/lib/printMode';
import { StaticProgress } from '@/components/print/StaticProgress';
import { resolveToHex } from '@/lib/printColors';


function RevenuePageContent({ data, inputs, t, isPrint = false }: { data: EngineOutput; inputs: EngineInput, t: any, isPrint?: boolean }) {
    const router = useRouter();
    const currency = inputs.parameters.currency;
    const { revenueSummary, monthlyRevenue, monthlyUnitsSold } = data;
    
    const potentialRevenue = inputs.products.reduce((acc, p) => acc + (p.plannedUnits! * p.sellPrice!), 0);
    const revenueProgress = potentialRevenue > 0 ? (revenueSummary.totalRevenue / potentialRevenue) * 100 : 0;
    
    const { monthlyRevenueById, monthlyUnitsSoldById, seriesKeys, seriesHexColors } = useMemo(() => {
        const idKeys = inputs.products.map(p => p.id);
        
        const hexColors: Record<string, string> = {};
        if (isPrint) {
          inputs.products.forEach(p => {
            hexColors[p.id] = resolveToHex(getProductColor(p));
          });
        }

        const mapDataToId = <T extends MonthlyRevenue | MonthlyUnitsSold>(data: T[]) => {
            return data.map(monthData => {
                const newMonth: Record<string, any> = { month: monthData.month };
                inputs.products.forEach(p => {
                    newMonth[p.id] = monthData[p.productName] ?? 0;
                });
                return newMonth;
            });
        };

        return {
            monthlyRevenueById: mapDataToId(monthlyRevenue),
            monthlyUnitsSoldById: mapDataToId(monthlyUnitsSold),
            seriesKeys: idKeys,
            seriesHexColors: hexColors,
        };
    }, [isPrint, monthlyRevenue, monthlyUnitsSold, inputs.products]);

    return (
        <div className="p-4 md:p-8 space-y-6" data-revenue-root>
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
                        {isPrint ? <StaticProgress value={revenueProgress} /> : <Progress value={revenueProgress} className="h-2" />}
                    </div>
                )}
            </section>
            
            {/* --- Charts Section --- */}
            <section className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.pages.revenue.charts.timeline}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-auto p-0 sm:p-6 sm:pt-0">
                        <MonthlyRevenueTimeline 
                            data={monthlyRevenueById} 
                            currency={currency} 
                            isPrint={isPrint} 
                            seriesKeys={seriesKeys} 
                            inputs={inputs}
                            seriesHexColors={seriesHexColors}
                        />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.pages.revenue.charts.units}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-auto p-0 sm:p-6 sm:pt-0">
                        <MonthlyUnitsSoldChart 
                            data={monthlyUnitsSoldById}
                            isPrint={isPrint} 
                            seriesKeys={seriesKeys} 
                            inputs={inputs} 
                            seriesHexColors={seriesHexColors}
                        />
                        </CardContent>
                    </Card>
                </div>
            </section>

             {/* --- Table Section (Mobile & Desktop) --- */}
            <section>
                 <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle>{t.pages.revenue.table.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0 md:p-6 md:pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left pl-2 md:pl-4 pr-0 w-[200px]">Product</TableHead>
                                    <TableHead className="text-center">Units Sold</TableHead>
                                    <TableHead className="text-center">Sell-Through</TableHead>
                                    <TableHead className="text-center">Price</TableHead>
                                    <TableHead className="text-right pr-2 md:pr-4">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revenueSummary.productBreakdown.map((product) => {
                                    const inputProduct = inputs.products.find(p => p.productName === product.name);
                                    if (!inputProduct) return null;
                                    
                                    const sellThrough = (inputProduct.sellThrough || 0);
                                    
                                    return (
                                        <TableRow key={product.name}>
                                            <TableCell className="font-medium text-left pl-2 md:pl-4 pr-0">
                                                <div className="flex items-center justify-start gap-2">
                                                   <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(inputProduct) }} />
                                                   <span className="font-semibold">{product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{formatNumber(product.totalSoldUnits)}</TableCell>
                                            <TableCell className="text-center">{sellThrough.toFixed(0)}%</TableCell>
                                            <TableCell className="text-center">{formatCurrency(inputProduct.sellPrice || 0, currency)}</TableCell>
                                            <TableCell className="text-right font-bold pr-2 md:pr-4">{formatCurrency(product.totalRevenue, currency)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <section className="pt-4" data-no-print={isPrint}>
              <RevenueInsights revenueSummary={revenueSummary} currency={currency} isPrint={isPrint} />
            </section>

            <footer className="flex justify-between mt-8 pt-6 border-t" data-no-print="true">
               <Button variant="outline" onClick={() => router.push('/inputs')}>
                  <ArrowLeft className="mr-2" /> Back to Inputs
              </Button>
              <Button onClick={() => router.push('/costs')}>
                {t.pages.revenue.footer} <ArrowRight className="ml-2" />
              </Button>
            </footer>
        </div>
    );
}

async function waitForRechartsReady(rootSelector: string, timeoutMs: number): Promise<boolean> {
  const root = document.querySelector(rootSelector);
  if (!root) return false;

  return new Promise((resolve) => {
    let attempts = 0;
    const interval = 60;
    const maxAttempts = timeoutMs / interval;

    const check = () => {
      const svgs = Array.from(root.querySelectorAll('svg.recharts-surface'));
      const allVisible = svgs.length >= 2 && svgs.every(s => {
        try {
          const box = s.getBBox();
          return box.width > 0 && box.height > 0;
        } catch { return false; }
      });

      if (allVisible || attempts >= maxAttempts) {
        clearInterval(timer);
        if (!allVisible) console.warn(`[waitForRechartsReady] Timeout for selector "${rootSelector}"`);
        resolve(allVisible);
      }
      attempts++;
    };
    const timer = setInterval(check, interval);
  });
}

export default function RevenuePage() {
    const { t, financials, inputs, ensureForecastReady } = useForecast();
    const router = useRouter();
    const { isPrint } = usePrintMode();

    React.useEffect(() => {
        if (!isPrint) return;
        (async () => {
            await ensureForecastReady();
            await document.fonts?.ready;
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            window.dispatchEvent(new Event('resize'));
            
            const ok = await waitForRechartsReady('[data-revenue-root]', 4000);
            (window as any).__REVENUE_READY__ = ok;
        })();
    }, [isPrint, ensureForecastReady]);


    if (financials.isLoading && !isPrint) {
        return <div data-report-root data-route="/revenue"><RevenuePageSkeleton t={t} /></div>;
    }

    if (financials.error && !isPrint) {
        return (
            <div className="p-4 md:p-8" data-report-root data-route="/revenue">
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
            <div className="p-4 md:p-8 text-center" data-report-root data-route="/revenue">
                <Alert><AlertTitle>{t.errors.noData}</AlertTitle></Alert>
            </div>
        );
    }

    if (financials.data.revenueSummary.totalRevenue === 0) {
        return (
             <div className="p-4 md:p-8" data-report-root data-route="/revenue">
                <SectionHeader title={t.pages.revenue.title} description={t.pages.revenue.description} />
                <div className="text-center text-muted-foreground mt-16">
                    <p>{t.errors.noRevenue}</p>
                    <p className="text-sm">{t.errors.noRevenueDescription}</p>
                     <Button onClick={() => router.push('/costs')} className="mt-4" data-no-print="true">
                        {t.errors.continueToCosts} <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div data-report-root data-route="/revenue">
            <RevenuePageContent data={financials.data} inputs={inputs} t={t} isPrint={isPrint} />
        </div>
    );
}

