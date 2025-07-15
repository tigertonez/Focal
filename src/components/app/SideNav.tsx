
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Bell, MessageSquare, Clock, Settings, Wallet } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const navItems = [
  { href: '/', label: 'Summary', icon: LayoutGrid },
  { href: '/inputs', label: 'Inputs', icon: Wallet },
  { href: '/revenue', label: 'Notifications', icon: Bell },
  { href: '/costs', label: 'Messages', icon: MessageSquare },
  { href: '/profit', label: 'History', icon: Clock },
  { href: '/cash-flow', label: 'Settings', icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col items-center gap-y-4 px-2 py-4 border-r bg-card">
      <Link href="/">
        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
           <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
        </div>
      </Link>
      <nav className="flex flex-col items-center gap-y-2">
      <TooltipProvider>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                     isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-primary/5'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
