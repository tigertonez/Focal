
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  ShoppingCart,
  DollarSign,
  Landmark,
  Menu,
  FileText,
  Bot,
  Wallet,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useForecast } from '@/context/ForecastContext';


const DesktopNav = () => {
    const { setIsCopilotOpen, t, setLocale, locale, inputs } = useForecast();

    const navItems = [
      { href: '/inputs', icon: LineChart, label: t.nav.inputs },
      { href: '/revenue', icon: DollarSign, label: t.nav.revenue },
      { href: '/costs', icon: ShoppingCart, label: t.nav.costs },
      { href: '/profit', icon: Landmark, label: t.nav.profit },
      { href: '/cash-flow', icon: Wallet, label: t.nav.cashFlow },
      { href: '/summary', icon: LayoutGrid, label: t.nav.summary },
    ];

    const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
      const pathname = usePathname();
      const isActive = pathname === href || (href === '/inputs' && pathname === '/');

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-center p-3 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
                  { "bg-primary/10 text-primary": isActive }
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    return (
        <aside className="hidden md:flex flex-col items-center p-3 bg-card border-r h-screen sticky top-0">
            <Link href="/" className="p-3 mb-4">
                 <div className="bg-primary/20 text-primary p-2 rounded-lg" style={{ backgroundColor: 'var(--brand-logo-bg)', color: 'var(--brand-logo-fg)'}}>
                    {inputs.company?.logoDataUri ? (
                        <img src={inputs.company.logoDataUri} alt="Company Logo" className="h-6 w-6 object-contain" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                    )}
                 </div>
            </Link>
            <nav className="flex flex-col items-center space-y-2">
                {navItems.map(item => <NavLink key={item.href} {...item} />)}
            </nav>
            <div className="flex-grow" />
            <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" className="h-10 w-10 font-bold" onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}>
                            {locale === 'en' ? 'DE' : 'EN'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{t.nav.toggleLanguage}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="accent" size="icon" onClick={() => setIsCopilotOpen(true)}>
                            <Bot />
                            <span className="sr-only">{t.nav.askAI}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{t.nav.askAI}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
        </aside>
    );
};

export function SideNav() {
  return (
    <>
      <DesktopNav />
    </>
  );
}
