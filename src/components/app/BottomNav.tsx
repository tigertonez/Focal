
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Bell, MessageSquare, Clock, Settings, Wallet } from 'lucide-react';


const navItems = [
  { href: '/', label: 'Summary', icon: LayoutGrid },
  { href: '/inputs', label: 'Inputs', icon: Wallet },
  { href: '/revenue', label: 'Notifications', icon: Bell },
  { href: '/costs', label: 'Messages', icon: MessageSquare },
  { href: '/profit', label: 'History', icon: Clock },
  { href: '/cash-flow', label: 'Settings', icon: Settings },
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
