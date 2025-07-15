
import { SectionHeader } from '@/components/app/SectionHeader';

export default function ProfitPage() {
  return (
    <div className="p-4 md:p-8">
      <SectionHeader title="Profit" description="Analysis of gross, operating, and net profit." />
       <div className="text-center text-muted-foreground">
        <p>Profit analysis will be displayed here.</p>
      </div>
    </div>
  );
}
