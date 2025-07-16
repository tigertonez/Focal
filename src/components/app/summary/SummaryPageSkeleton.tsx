
import { SectionHeader } from '@/components/app/SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryPageSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <SectionHeader title="Financial Summary" description="An overview of your business forecast." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      
      <Skeleton className="h-32 rounded-lg" />
      
      <Skeleton className="h-48 rounded-lg" />

    </div>
  );
}
