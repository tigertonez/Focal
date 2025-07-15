
import { SideNav } from '@/components/app/SideNav';
import { ForecastProvider } from '@/context/ForecastContext';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForecastProvider>
      <div className="relative flex min-h-screen bg-background">
        <SideNav />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <FinancialCopilot />
      </div>
    </ForecastProvider>
  );
}
