
import { SideNav } from '@/components/app/SideNav';
import { BottomNav } from '@/components/app/BottomNav';
import { ForecastProvider } from '@/context/ForecastContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForecastProvider>
      <div className="relative flex min-h-screen">
        <SideNav />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
        <BottomNav />
      </div>
    </ForecastProvider>
  );
}
