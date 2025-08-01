
'use client';

import { useForecast } from '@/context/ForecastContext';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
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
      <div className="flex flex-1 flex-col">
        {!isPdfMode && <Header />}
        <main className="flex-1 pt-16">
            {children}
        </main>
      </div>
      {!isPdfMode && isCopilotOpen && <FinancialCopilot />}
    </div>
  );
}
