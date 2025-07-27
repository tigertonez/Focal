
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LineChart,
  ShoppingCart,
  DollarSign,
  Landmark,
  Wallet,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForecast } from '@/context/ForecastContext';

export function BottomNav() {
  const pathname = usePathname();
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
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-card md:hidden">
      <div className="grid h-16 grid-cols-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/inputs' && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
