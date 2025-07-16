
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingDown, CalendarClock, Banknote } from 'lucide-react';

export function CashFlowPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Cash Flow Analysis" description="Monthly cash flow, funding needs, and runway." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Ending Cash Balance" value={<Skeleton className="h-7 w-28" />} icon={<Wallet />} />
          <KpiCard label="Peak Funding Need" value={<Skeleton className="h-7 w-24" />} icon={<TrendingDown />} />
          <KpiCard label="Months to Break-Even" value={<Skeleton className="h-7 w-20" />} icon={<CalendarClock />} />
          <KpiCard label="Cash Runway" value={<Skeleton className="h-7 w-24" />} icon={<Banknote />} />
        </div>
      </section>
      
      <section className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Cash Flow</CardTitle>
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
              <CardTitle>Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <Skeleton className="h-60 w-full" />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>Cash-Flow Health</CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-48" />
              </CardDescription>
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
