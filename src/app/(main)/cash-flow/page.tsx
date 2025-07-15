
import { SectionHeader } from '@/components/app/SectionHeader';

export default function CashFlowPage() {
  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Cash Flow" description="Monthly cash flow and runway." />
       <div className="text-center text-muted-foreground">
        <p>Cash flow analysis will be displayed here.</p>
      </div>
    </div>
  );
}
