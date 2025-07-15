
import { KpiCard } from '@/components/app/KpiCard';
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CostsPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Cost Analysis" description="Breakdown of your operating costs." />

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Fixed Costs" value={<Skeleton className="h-7 w-24" />} />
          <KpiCard label="Total Variable Costs" value={<Skeleton className="h-7 w-24" />} />
          <Kpi_Card label="Total Operating Costs" value={<Skeleton className="h-7 w-24" />} />
          <Kpi_Card label="Avg. Cost per Unit" value={<Skeleton className="h-7 w-20" />} />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Timeline</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Variable Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
             <Skeleton className="h-48 w-48 rounded-full" />
          </CardContent>
        </Card>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cost Timeline</h2>
        <Card>
            <CardContent className="p-2">
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div>
            <h2 className="text-xl font-semibold mb-2">Fixed Cost Breakdown</h2>
            <Card>
                <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">Variable Cost Breakdown</h2>
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

// A simple skeleton for the KpiCard that doesn't need to be a separate component
const Kpi_Card = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold font-headline">
          {value}
        </div>
      </CardContent>
    </Card>
)
