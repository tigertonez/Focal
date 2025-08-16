
'use client';

import { useForecast } from '@/context/ForecastContext';
import { FinancialCopilot } from '@/components/app/FinancialCopilot';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import {
  LineChart,
  ShoppingCart,
  DollarSign,
  Landmark,
  Wallet,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { DRAFT_STORAGE_KEY, REPORT_STORAGE_KEY } from '@/lib/constants';
import { EngineInputSchema } from '@/lib/types';

const MobileNavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </Link>
    );
};


function MobileNav() {
    const { t } = useForecast();
    const navItems = [
      { href: '/inputs', icon: LineChart, label: t.nav.inputs },
      { href: '/revenue', icon: DollarSign, label: t.nav.revenue },
      { href: '/costs', icon: ShoppingCart, label: t.nav.costs },
      { href: '/profit', icon: Landmark, label: t.nav.profit },
      { href: '/cash-flow', icon: Wallet, label: t.nav.cashFlow },
      { href: '/summary', icon: LayoutGrid, label: t.nav.summary },
    ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden h-16 bg-card border-t" data-hide-in-pdf="true">
      <div className="grid h-full grid-cols-6 max-w-lg mx-auto">
        {navItems.map(item => <MobileNavLink key={item.href} {...item} />)}
      </div>
    </nav>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPdfMode = searchParams.get('pdf') === '1';
  const { isCopilotOpen, setInputs, setFinancials, calculateFinancials, financials } = useForecast();

  // This effect runs only on the client to restore state from localStorage.
  // This is the definitive fix for the hydration error.
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      const savedReport = localStorage.getItem(REPORT_STORAGE_KEY);

      if (savedReport) {
          const parsedReport = JSON.parse(savedReport);
          setFinancials({ data: parsedReport, error: null, isLoading: false });
          // If we have a report, we should also have a draft that created it.
          if (savedDraft) {
              const parsedDraft = JSON.parse(savedDraft);
              const result = EngineInputSchema.safeParse(parsedDraft);
              if (result.success) {
                  setInputs(result.data);
              }
          }
      } else if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          const result = EngineInputSchema.safeParse(parsedDraft);
          if (result.success) {
              setInputs(result.data);
              // If there's a draft but no report, recalculate it.
              const reportData = calculateFinancials(result.data);
              setFinancials({ data: reportData, error: null, isLoading: false });
          } else {
              localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
      }
    } catch (e) {
      console.error("Failed to load state from local storage", e);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(REPORT_STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount.


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

  // Proactively pre-fetch all main report pages for instant navigation
  useEffect(() => {
    const reportPages = ['/revenue', '/costs', '/profit', '/cash-flow', '/summary'];
    reportPages.forEach(page => {
        router.prefetch(page);
    });
  }, [router]);

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <div className="flex flex-1 flex-col">
        {!isPdfMode && <Header />}
        <main className="flex-1 pt-16 pb-16 lg:pb-0">
            {children}
        </main>
         {!isPdfMode && <MobileNav />}
      </div>
      {!isPdfMode && isCopilotOpen && <FinancialCopilot />}
    </div>
  );
}
