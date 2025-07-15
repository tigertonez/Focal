
import { TopNav } from '@/components/app/TopNav';
import { BottomNav } from '@/components/app/BottomNav';
import { ForecastProvider } from '@/context/ForecastContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForecastProvider>
      <div className="relative flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 px-2 py-4 md:p-8 pt-6 md:pt-24 pb-24 md:pb-8">
            {children}
        </main>
        <BottomNav />
      </div>
    </ForecastProvider>
  );
}
