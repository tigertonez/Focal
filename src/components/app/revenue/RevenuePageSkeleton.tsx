
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

export function RevenuePageSkeleton({ t }: {t: any}) {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title={t.pages.revenue.title} description={t.pages.revenue.description} />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={t.pages.revenue.kpi.totalRevenue} value={<Skeleton className="h-7 w-24" />} icon={<TrendingUp />} />
          <KpiCard label={t.pages.revenue.kpi.totalUnits} value={<Skeleton className="h-7 w-20" />} icon={<Users />} />
          <KpiCard label={t.pages.revenue.kpi.avgRevenue} value={<Skeleton className="h-7 w-24" />} icon={<DollarSign />} />
          <KpiCard label={t.pages.revenue.kpi.avgSellThrough} value={<Skeleton className="h-7 w-20" />} icon={<Target />} />
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t.pages.revenue.charts.timeline}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-end gap-2">
                <Skeleton className="h-1/3 w-full" />
                <Skeleton className="h-2/3 w-full" />
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-3/4 w-full" />
                <Skeleton className="h-1/4 w-full" />
                <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>{t.pages.revenue.charts.units}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-72 w-full flex items-end gap-2">
                    <Skeleton className="h-1/3 w-full" />
                    <Skeleton className="h-2/3 w-full" />
                    <Skeleton className="h-1/2 w-full" />
                    <Skeleton className="h-3/4 w-full" />
                    <Skeleton className="h-1/4 w-full" />
                    <Skeleton className="h-full w-full" />
                </div>
            </CardContent>
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">{t.pages.revenue.table.title}</h2>
        <Card>
            <CardContent className="p-2">
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
