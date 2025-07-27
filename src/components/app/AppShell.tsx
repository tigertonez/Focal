
'use client';

import { ForecastProvider, useForecast } from '@/context/ForecastContext';
import { SideNav } from '@/components/app/SideNav';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isPdfMode = searchParams.get('pdf') === '1';
  const { isCopilotOpen } = useForecast();

  // Add data-pdf-ready attribute when the app is ready for PDF rendering
  useEffect(() => {
    if (isPdfMode) {
      // A short delay to ensure all content and charts have rendered
      const timer = setTimeout(() => {
        document.body.setAttribute('data-pdf-ready', '1');
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [isPdfMode]);

  return (
    <div className="flex h-screen bg-background">
      {!isPdfMode && <SideNav />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {!isPdfMode && isCopilotOpen && <FinancialCopilot />}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ForecastProvider>
      <AppShellContent>{children}</AppShellContent>
    </ForecastProvider>
  );
}
