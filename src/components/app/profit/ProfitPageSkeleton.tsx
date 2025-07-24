

import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Briefcase, Landmark, Target } from 'lucide-react';


export function ProfitPageSkeleton({ t }: {t: any}) {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title={t.pages.profit.title} description={t.pages.profit.description} />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={t.pages.profit.kpi.gross} value={<Skeleton className="h-7 w-24" />} icon={<TrendingUp />} />
          <KpiCard label={t.pages.profit.kpi.operating} value={<Skeleton className="h-7 w-24" />} icon={<Briefcase />} />
          <KpiCard label={t.pages.profit.kpi.net} value={<Skeleton className="h-7 w-24" />} icon={<Landmark />} />
          <KpiCard label={t.pages.profit.kpi.margin} value={<Skeleton className="h-7 w-20" />} icon={<Target />} />
        </div>
      </section>
      
      <section>
         <Card>
            <CardHeader>
                <CardTitle>{t.pages.profit.charts.breakdown}</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pl-0">
               <div className="h-full w-full flex items-end gap-2 p-4">
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

       <section>
          <Card>
            <CardHeader>
              <CardTitle>{t.pages.profit.table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </section>

        <section className="pt-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t.insights.profit.title}</CardTitle>
                    <CardDescription as="div"><Skeleton className="h-4 w-72" /></CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </section>
    </div>
  );
}

    