
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RevenuePageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Revenue" description="Detailed revenue projections." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={<Skeleton className="h-7 w-24" />} />
          <KpiCard label="Avg. Revenue per Unit" value={<Skeleton className="h-7 w-20" />} />
          <KpiCard label="Lifetime Value (LTV)" value={<Skeleton className="h-7 w-24" />} />
          <KpiCard label="Customer Acquisition Cost (CAC)" value={<Skeleton className="h-7 w-20" />} />
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Timeline</CardTitle>
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
            <CardTitle>Revenue by Product</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
             <Skeleton className="h-48 w-48 rounded-full" />
          </CardContent>
        </Card>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Revenue Breakdown</h2>
        <Card>
            <CardContent className="p-2">
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
