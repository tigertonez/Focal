
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
import { Separator } from '../ui/separator';
import Image from 'next/image';

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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 ease-in-out hover:bg-muted/80 hover:text-foreground hover:scale-105",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
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
    
    const brandName = 'Focal'; // Hardcoded brand name
    const appLogo = '/logo-dark.png?v=2'; // Hardcoded app logo with cache-busting

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            {/* Left Section: Brand */}
            <div className="flex h-full items-center gap-4">
                <Link href="/" className="flex items-center gap-3 h-full">
                    <Image src={appLogo} alt={`${brandName} Logo`} width={62} height={62} className="object-contain" />
                </Link>
                 <Separator orientation="vertical" className="h-2/3" />
            </div>

            {/* Center Section: Navigation */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex">
                <nav className="flex items-center gap-1 rounded-full border bg-muted/50 p-1">
                    {navItems.map(item => <NavLink key={item.href} {...item} />)}
                </nav>
            </div>
            
             {/* Right Section: Actions */}
            <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="outline" size="icon" className="h-9 w-9 font-bold text-sm" onClick={() => setLocale(locale === 'en' ? 'de' : 'en')}>
                            {locale.toUpperCase()}
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
                        <Button variant="outline" size="icon" className="h-9 w-9 text-primary border-primary/50 hover:bg-primary/10 hover:text-primary" onClick={() => setIsCopilotOpen(true)}>
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
