

import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Briefcase, Landmark, Target } from 'lucide-react';


export function ProfitPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Profit" description="Analysis of your gross, operating, and net profit." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Gross Profit" value={<Skeleton className="h-7 w-24" />} icon={<TrendingUp />} />
          <KpiCard label="Total Operating Profit" value={<Skeleton className="h-7 w-24" />} icon={<Briefcase />} />
          <KpiCard label="Total Net Profit" value={<Skeleton className="h-7 w-24" />} icon={<Landmark />} />
          <KpiCard label="Net Margin" value={<Skeleton className="h-7 w-20" />} icon={<Target />} />
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Operating Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full flex items-end gap-2 p-4">
                <Skeleton className="h-1/3 w-full" />
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-2/3 w-full" />
                <Skeleton className="h-1/4 w-full" />
                <Skeleton className="h-3/4 w-full" />
                <Skeleton className="h-1/2 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How Profit is Calculated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full p-4 space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section>
         <Card>
            <CardHeader>
              <CardTitle>Product-Level Profitability</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
