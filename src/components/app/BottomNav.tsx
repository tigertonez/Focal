'use client';

import { ForecastProvider, useForecast } from '@/context/ForecastContext';
import { SideNav } from '@/components/app/SideNav';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { MobileNav } from './MobileNav';

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
    <div className="relative flex min-h-screen w-full bg-background">
      {!isPdfMode && <SideNav />}
      <div className="flex flex-1 flex-col">
        {!isPdfMode && <MobileNav />}
        <main className="flex-1 pt-16 md:pt-0">
            {children}
        </main>
      </div>
      {!isPdfMode && isCopilotOpen && <FinancialCopilot />}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ForecastProvider>
        <Suspense>
            <AppShellContent>{children}</AppShellContent>
        </Suspense>
    </ForecastProvider>
  );
}