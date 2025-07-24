
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingDown, CalendarClock, Banknote } from 'lucide-react';

export function CashFlowPageSkeleton({ t }: {t: any}) {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title={t.pages.cashFlow.title} description={t.pages.cashFlow.description} />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={t.pages.cashFlow.kpi.ending} value={<Skeleton className="h-7 w-28" />} icon={<Wallet />} />
          <KpiCard label={t.pages.cashFlow.kpi.peak} value={<Skeleton className="h-7 w-24" />} icon={<TrendingDown />} />
          <KpiCard label={t.pages.cashFlow.kpi.breakEven} value={<Skeleton className="h-7 w-20" />} icon={<CalendarClock />} />
          <KpiCard label={t.pages.cashFlow.kpi.runway} value={<Skeleton className="h-7 w-24" />} icon={<Banknote />} />
        </div>
      </section>
      
      <section className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.pages.cashFlow.charts.cumulative}</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <div className="h-full w-full flex items-end gap-2 p-4">
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-2/3 w-full" />
                <Skeleton className="h-1/4 w-full" />
                <Skeleton className="h-3/4 w-full" />
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-1/3 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>{t.pages.cashFlow.table.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <Skeleton className="h-60 w-full" />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>{t.insights.cashFlow.title}</CardTitle>
              <div className="text-sm text-muted-foreground pt-1.5">
                <Skeleton className="h-4 w-48" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
