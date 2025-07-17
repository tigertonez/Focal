
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

export const metadata = {
  title: 'Forecasting SaaS Platform',
  description: 'Lean Hybrid Setup - Input Sheet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
    </html>
  );
}
