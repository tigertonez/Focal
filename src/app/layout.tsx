
'use client';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/app/AppShell';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Inter({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['600', '700'],
});

// Metadata is defined here but not exported because this is now a client component at the top level.
// We can move it back to a server component if needed, but for now this resolves the crash.
const metadata = {
  title: 'Forecasting SaaS Platform',
  description: 'Lean Hybrid Setup - Input Sheet',
};


function LayoutBody({ children }: { children: React.ReactNode }) {
  return (
    <body
      className={cn(
        'font-body antialiased',
        fontBody.variable,
        fontHeadline.variable
      )}
    >
      <AppShell>{children}</AppShell>
      <Toaster />
    </body>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Suspense fallback={<div>Loading...</div>}>
         <LayoutBody>{children}</LayoutBody>
      </Suspense>
    </html>
  );
}
