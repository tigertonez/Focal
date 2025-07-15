
import { SectionHeader } from '@/components/app/SectionHeader';

export default function CostsPage() {
  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Costs" description="Breakdown of fixed and variable costs." />
       <div className="text-center text-muted-foreground">
        <p>Cost analysis will be displayed here.</p>
      </div>
    </div>
  );
}
