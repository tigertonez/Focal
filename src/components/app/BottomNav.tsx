
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, TrendingUp, CircleDollarSign, LineChart, Banknote } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Summary', icon: LayoutDashboard },
  { href: '/inputs', label: 'Inputs', icon: FileText },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/costs', label: 'Costs', icon: CircleDollarSign },
  { href: '/profit', label: 'Profit', icon: LineChart },
  { href: '/cash-flow', label: 'Cash Flow', icon: Banknote },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs font-medium transition-colors h-full min-w-[44px]',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" />
            <span className="text-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
