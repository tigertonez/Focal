
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  ShoppingCart,
  DollarSign,
  Landmark,
  Bot,
  Wallet,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useForecast } from '@/context/ForecastContext';

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
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="hidden md:inline">{label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="md:hidden">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


export function Header() {
    const { setIsCopilotOpen, t, setLocale, locale, inputs } = useForecast();

    const navItems = [
      { href: '/inputs', icon: LineChart, label: t.nav.inputs },
      { href: '/revenue', icon: DollarSign, label: t.nav.revenue },
      { href: '/costs', icon: ShoppingCart, label: t.nav.costs },
      { href: '/profit', icon: Landmark, label: t.nav.profit },
      { href: '/cash-flow', icon: Wallet, label: t.nav.cashFlow },
      { href: '/summary', icon: LayoutGrid, label: t.nav.summary },
    ];
    
    const brandInitials = inputs.company?.brand?.substring(0, 2).toUpperCase() || 'P';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-1">
                    <div className="bg-primary/20 text-primary p-1 rounded-lg flex items-center justify-center h-9 w-9 font-bold text-base">
                        {brandInitials}
                    </div>
                </Link>
                <nav className="flex items-center gap-1 md:gap-2">
                    {navItems.map(item => <NavLink key={item.href} {...item} />)}
                </nav>
            </div>
            
            <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-9 w-9 font-bold text-sm" onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}>
                            {locale === 'en' ? 'DE' : 'EN'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t.nav.toggleLanguage}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsCopilotOpen(true)}>
                            <Bot className="h-5 w-5" />
                            <span className="sr-only">{t.nav.askAI}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t.nav.askAI}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    );
};
