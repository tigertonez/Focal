
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Summary' },
  { href: '/inputs', label: 'Inputs' },
  { href: '/revenue', label: 'Revenue' },
  { href: '/costs', label: 'Costs' },
  { href: '/profit', label: 'Profit' },
  { href: '/cash-flow', label: 'Cash Flow' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <h1 className="text-xl font-bold font-headline text-foreground">
          Market Mosaic
        </h1>
      </div>
      <nav className="flex items-center gap-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className={cn(
              'font-semibold',
              pathname === item.href
                ? 'text-primary hover:text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
      <div>
        {/* Placeholder for user avatar or actions */}
      </div>
    </header>
  );
}
