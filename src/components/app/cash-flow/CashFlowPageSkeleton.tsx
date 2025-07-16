
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, CalendarClock, CircleOff, Banknote } from 'lucide-react';

export function CashFlowPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Cash Flow" description="Monthly cash flow and runway." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Ending Cash Balance" value={<Skeleton className="h-7 w-28" />} icon={<Wallet />} />
          <KpiCard label="Cash Runway" value={<Skeleton className="h-7 w-24" />} icon={<CalendarClock />} />
          <KpiCard label="Net Burn" value={<Skeleton className="h-7 w-20" />} icon={<CircleOff />} />
          <KpiCard label="Funding Needed" value={<Skeleton className="h-7 w-24" />} icon={<Banknote />} />
        </div>
      </section>
      
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-end gap-2">
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-2/3 w-full" />
                <Skeleton className="h-1/4 w-full" />
                <Skeleton className="h-3/4 w-full" />
                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-1/3 w-full" />
            </div>
          </CardContent>
        </Card>
      </section>
      
       <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cash Flow Statement</h2>
        <Card>
            <CardContent className="p-2">
                <Skeleton className="h-60 w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
