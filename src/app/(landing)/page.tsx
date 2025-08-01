
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };

  const features = [
    {
      title: 'Plan Your Inventory',
      description: 'Model production costs, deposits, and lead times to see the true cash impact of your inventory.',
    },
    {
      title: 'Forecast Profitability',
      description: 'Calculate gross, operating, and net margins for every product to ensure your pricing is right.',
    },
    {
      title: 'Master Your Cash Flow',
      description: 'Project your future cash balance, identify funding needs, and never run out of cash unexpectedly.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 md:px-8 py-6">
          <div className="container mx-auto flex justify-end items-center">
              <nav className="flex items-center gap-8">
                  <Link href="#features" className="text-base text-white hover:underline transition-opacity">Features</Link>
                  <Link href="#waitlist" className="text-base text-white hover:underline transition-opacity">Waitlist</Link>
              </nav>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* SECTION 1: HERO */}
        <section className="relative w-full h-screen flex items-center justify-center text-center bg-hero-pattern">
          <div className="max-w-3xl px-4 z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              The Financial OS for D2C Brands.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80">
              Go from spreadsheet chaos to an investor-ready forecast in minutes. Plan inventory, master your margins, and never run out of cash.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Button size="lg" onClick={handlePrimaryCta} className="bg-white text-blue-600 hover:bg-gray-200 shadow-lg scale-105 font-bold">
                Build My Forecast <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2: FEATURES */}
        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold">
                Your entire financial workflow, unified.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Focal is the first platform that connects your inventory planning, cost management, and financial forecasting in one place. Stop guessing, start scaling.
              </p>
            </div>
            
            <div className="mt-16 max-w-5xl mx-auto">
              <Card className="w-full aspect-video bg-muted flex items-center justify-center overflow-hidden border-2 shadow-lg">
                <iframe 
                  className="w-full h-full"
                  src="https://player.vimeo.com/video/909421124?h=746979cd39&title=0&byline=0&portrait=0&background=1" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </Card>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-12">
              {features.map((feature) => (
                <div key={feature.title} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="text-primary h-6 w-6" />
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="mt-2 text-muted-foreground text-justify">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* SECTION 3: PRICING / TIERS */}
        <section id="waitlist" className="py-20 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="max-w-md">
                        <h2 className="text-4xl font-bold">Start for Free.</h2>
                        <p className="mt-4 text-muted-foreground">
                            Use our simplified forecasting engine to see your potential revenue and basic costs instantly. No credit card required. Get a feel for how powerful financial clarity can be.
                        </p>
                        <Button size="lg" onClick={handlePrimaryCta} className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                          Try the Free Forecaster <ArrowRight className="ml-2" />
                        </Button>
                    </div>
                    <Card className="p-8 rounded-xl shadow-lg bg-card">
                        <h3 className="text-2xl font-semibold">Join the Beta Waitlist.</h3>
                        <p className="mt-2 text-muted-foreground">
                            Ready for the full suite? Get early access to advanced features like AI-powered insights, cash flow analysis, PDF reports, and real-time data integration.
                        </p>
                        <form className="mt-6 flex gap-4">
                          <input type="email" placeholder="your@email.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
                          <Button>Join Waitlist</Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-3">We're granting access to new users every week.</p>
                    </Card>
                </div>
            </div>
        </section>

      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Focal. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
