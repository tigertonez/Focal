
'use client';

import React, { useEffect, Suspense } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { SummaryPageSkeleton } from '@/components/app/summary/SummaryPageSkeleton';

// Import individual page content components
import InputsPage from '@/app/(main)/inputs/page';
import RevenuePage from '@/app/(main)/revenue/page';
import CostsPage from '@/app/(main)/costs/page';
import ProfitPage from '@/app/(main)/profit/page';
import CashFlowPage from '@/app/(main)/cash-flow/page';
import SummaryPage from '@/app/(main)/summary/page';

const PrintSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="py-8 px-4 border-b last:border-b-0" style={{ pageBreakInside: 'avoid' }}>
    <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
    {children}
  </section>
);

function FullReportContent() {
    const { financials, inputs, t } = useForecast();

    useEffect(() => {
        // Expose a preparation function on the window object for the parent to call.
        (window as any).__PRINT_PREP__ = async () => {
            console.log('[PDF PREP] Starting preparation...');
            // Force open common collapsible components
            document.querySelectorAll('details').forEach((d: any) => (d.open = true));
            document.querySelectorAll<HTMLElement>('[aria-expanded="false"]').forEach(btn => {
                if (btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button') {
                    btn.click?.();
                }
            });
            // Wait for fonts to be ready
            await document.fonts?.ready?.catch((err) => console.warn('[PDF PREP] Font ready error:', err));
            console.log('[PDF PREP] Preparation complete.');
        };

        // Also set a simple flag for older polling logic, and after prep is done.
        (window as any).__PRINT_READY__ = true;
        
    }, []);

    if (financials.isLoading) return <SummaryPageSkeleton t={t} />;
    
    if (financials.error || !financials.data || !inputs) {
        return (
             <div className="p-4 md:p-8">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        {financials.error || t.errors.noData}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <main id="full-report-root" style={{ maxWidth: '1200px', margin: '0 auto', background: '#fff', color: '#000' }}>
          <PrintSection title="Inputs"><InputsPage /></PrintSection>
          <PrintSection title="Revenue"><RevenuePage /></PrintSection>
          <PrintSection title="Costs"><CostsPage /></PrintSection>
          <PrintSection title="Profit"><ProfitPage /></PrintSection>
          <PrintSection title="Cash Flow"><CashFlowPage /></PrintSection>
          <PrintSection title="Summary"><SummaryPage /></PrintSection>
        </main>
    );
}


export default function FullReportPage() {
  return (
    <>
      <style>{`
        :root.print-freeze, .print-freeze * { animation: none !important; transition: none !important; }
        .print-freeze { font-synthesis: none !important; text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .print-hide, header, nav, footer, [data-hide-in-pdf="true"] { display: none !important; }
        [style*="position:sticky"], .sticky { position: static !important; top: auto !important; }
        [style*="position:fixed"] { position: static !important; }
        .overflow-hidden, .overflow-auto, .overflow-y-auto { overflow: visible !important; }
        .container { max-width: 100% !important; }
        html.pdf-mode, body.pdf-mode { background:#fff !important; }
        .pdf-mode *{ animation:none !important; transition:none !important; }
        .pdf-mode{ font-synthesis:none !important; text-rendering:geometricPrecision !important;
          -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
        .pdf-mode, .pdf-mode * {
          transform: none !important;
          caret-color: transparent !important;
        }
      `}</style>
      <Suspense fallback={<SummaryPageSkeleton t={{}} />}>
         <FullReportContent />
      </Suspense>
    </>
  );
}
