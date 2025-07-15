
"use client";

import Link from 'next/link';

export function SideNav() {
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
        <span className="sr-only">Forecasting SaaS</span>
      </Link>
    </aside>
  );
}
