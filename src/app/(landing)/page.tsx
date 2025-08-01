
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-primary font-headline">Plaza</h1>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Button onClick={handlePrimaryCta} size="sm">
            Get Forecast <ArrowRight className="ml-2" size={16} />
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        {/* Hero Section */}
        <section className="relative flex-grow flex flex-col justify-center items-start text-left px-4 md:px-8 py-24">
            <div className="max-w-3xl z-10">
                <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-foreground">
                    Your numbers, crystal-clear in five minutes.
                </h1>
                <p className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground">
                    Upload a few key business inputs and get a print-ready financial forecast—powered by AI and built for founders who hate spreadsheets.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Button size="lg" onClick={handlePrimaryCta}>
                        Get My Instant Forecast <ArrowRight className="ml-2" />
                    </Button>
                    <Button variant="link" size="lg" asChild className="text-muted-foreground">
                         <Link href="#how-it-works">See How It Works</Link>
                    </Button>
                </div>
            </div>

             {/* Abstract SVG Background Shape */}
            <div className="absolute bottom-0 right-0 w-full h-full overflow-hidden z-0">
                <svg
                    className="absolute bottom-0 right-0 w-[150%] h-[100%] md:w-[100%] md:h-[120%] lg:w-[80%] lg:h-[150%] xl:w-[70%] xl:h-[150%]"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.8}} />
                            <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 0.9}} />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#blueGradient)"
                        d="M 100 100 V 50 H 90 V 40 H 70 V 30 H 50 V 20 H 30 V 10 H 0 V 100 Z"
                    />
                </svg>
            </div>
        </section>
      </main>
    </div>
  );
}
