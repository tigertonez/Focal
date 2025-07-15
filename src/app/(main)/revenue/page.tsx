
import { SectionHeader } from '@/components/app/SectionHeader';

export default function RevenuePage() {
  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Revenue" description="Detailed revenue projections." />
      <div className="text-center text-muted-foreground">
        <p>Revenue analysis will be displayed here.</p>
      </div>
    </div>
  );
}
