
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
    const { setIsCopilotOpen, t, setLocale, locale } = useForecast();

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
                 <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
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

const MobileNav = () => {
    const { setIsCopilotOpen, t, setLocale, locale } = useForecast();

    const navItems = [
      { href: '/inputs', icon: LineChart, label: t.nav.inputs },
      { href: '/revenue', icon: DollarSign, label: t.nav.revenue },
      { href: '/costs', icon: ShoppingCart, label: t.nav.costs },
      { href: '/profit', icon: Landmark, label: t.nav.profit },
      { href: '/cash-flow', icon: Wallet, label: t.nav.cashFlow },
      { href: '/summary', icon: LayoutGrid, label: t.nav.summary },
    ];

    return (
        <header className="md:hidden flex items-center justify-between p-2 border-b bg-card sticky top-0 z-10">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                     <SheetHeader>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                     </SheetHeader>
                     <nav className="grid gap-2 text-lg font-medium">
                        <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            </div>
                            <span className="sr-only">Forecasting SaaS</span>
                        </Link>
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href} className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-auto space-y-2">
                        <Button className="w-full font-bold" variant="ghost" onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}>
                           <span className="mr-2">{locale === 'en' ? 'DE' : 'EN'}</span> {t.nav.toggleLanguage}
                        </Button>
                        <Button className="w-full" variant="accent" onClick={() => setIsCopilotOpen(true)}>
                            <Bot className="mr-2" /> {t.nav.askAI}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="flex-1 text-center font-bold flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 inline-block mr-2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                 Forecaster
            </div>
            <div className="w-10"></div>
        </header>
    );
};


export function SideNav() {
  return (
    <>
      <MobileNav />
      <DesktopNav />
    </>
  );
}
