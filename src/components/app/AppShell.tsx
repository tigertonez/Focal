
'use client';

import { ForecastProvider } from '@/context/ForecastContext';
import { SideNav } from '@/components/app/SideNav';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ForecastProvider>
      <div className="flex h-screen bg-background">
        <SideNav />
        <main className="flex-1 overflow-auto relative">
          {children}
          <FinancialCopilot />
        </main>
      </div>
    </ForecastProvider>
  );
}
