
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Goal, Briefcase, Landmark } from 'lucide-react';


export function ProfitPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Profit" description="Analysis of gross, operating, and net profit." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Gross Profit Margin" value={<Skeleton className="h-7 w-20" />} icon={<TrendingUp />} />
          <KpiCard label="Operating Profit Margin" value={<Skeleton className="h-7 w-20" />} icon={<Briefcase />} />
          <KpiCard label="Net Profit Margin" value={<Skeleton className="h-7 w-20" />} icon={<Landmark />} />
          <KpiCard label="Break-Even Month" value={<Skeleton className="h-7 w-24" />} icon={<Goal />} />
        </div>
      </section>
      
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Profit Timelines (Gross, Operating, Net)</CardTitle>
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
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profit & Loss Statement</h2>
        <Card>
            <CardContent className="p-2">
                <Skeleton className="h-60 w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
