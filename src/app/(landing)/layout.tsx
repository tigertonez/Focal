
'use client';

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // The landing page doesn't need the full AppShell with side navigation.
  // We render the children directly. The root layout will still provide the providers.
  if (pathname === '/') {
    return <>{children}</>;
  }

  // For any other pages that might be added to the (landing) group,
  // we can wrap them in the standard AppShell if needed.
  return <AppShell>{children}</AppShell>;
}
