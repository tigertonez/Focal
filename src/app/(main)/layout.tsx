
import { SideNav } from '@/components/app/SideNav';
import { ForecastProvider } from '@/context/ForecastContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForecastProvider>
      <div className="relative flex min-h-screen bg-muted/30">
        <SideNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ForecastProvider>
  );
}
