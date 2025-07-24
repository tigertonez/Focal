
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryPageSkeleton({ t }: { t: any }) {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title={t.pages.summary.title} description={t.pages.summary.description} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-72 mt-1" /></CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center justify-center">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24 mt-2" />
                </div>
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Skeleton className="h-48 rounded-lg" />

    </div>
  );
}
