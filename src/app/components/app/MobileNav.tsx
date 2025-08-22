
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

const MobileNavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href === '/inputs' && pathname === '/');

    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs font-medium h-full",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </Link>
    );
};


export function MobileNav() {
    const { t } = useForecast();
    
    const navItems = [
      { href: '/inputs', icon: LineChart, label: t.nav.inputs },
      { href: '/revenue', icon: DollarSign, label: t.nav.revenue },
      { href: '/costs', icon: ShoppingCart, label: t.nav.costs },
      { href: '/profit', icon: Landmark, label: t.nav.profit },
      { href: '/cash-flow', icon: Wallet, label: 'Cash' },
      { href: '/summary', icon: LayoutGrid, label: t.nav.summary },
    ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden h-16 bg-card border-t" data-hide-in-pdf="true" data-no-print="true">
      <div className="grid h-full grid-cols-6 max-w-lg mx-auto">
        {navItems.map(item => <MobileNavLink key={item.href} {...item} />)}
      </div>
    </nav>
  );
}
