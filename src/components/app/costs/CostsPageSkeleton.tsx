
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Package, Activity, Calculator } from 'lucide-react';

export function CostsPageSkeleton({ t }: {t: any}) {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title={t.pages.costs.title} description={t.pages.costs.description} />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={t.pages.costs.kpi.fixed} value={<Skeleton className="h-7 w-24" />} icon={<Building />} />
          <KpiCard label={t.pages.costs.kpi.variable} value={<Skeleton className="h-7 w-24" />} icon={<Package />} />
          <KpiCard label={t.pages.costs.kpi.operating} value={<Skeleton className="h-7 w-24" />} icon={<Activity />} />
          <KpiCard label={t.pages.costs.kpi.avgCost} value={<Skeleton className="h-7 w-20" />} icon={<Calculator />} />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </section>
      
      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t.pages.costs.charts.timeline}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-end gap-2">
                <Skeleton className="h-1/3 w-full" />
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-2/3 w-full" />
                <Skeleton className="h-1/4 w-full" />
                <Skeleton className="h-3/4 w-full" />
                <Skeleton className="h-1/2 w-full" />
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8 pt-4">
        <div>
            <h2 className="text-xl font-semibold mb-2">{t.pages.costs.breakdown.fixed}</h2>
            <Card>
                <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">{t.pages.costs.breakdown.variable}</h2>
            <Card>
                <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
