
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Package, DollarSign, PieChart, TrendingUp, BarChart, Rocket, ShieldCheck, Scaling } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };

  const useCases = [
    {
      icon: <Rocket className="h-8 w-8" />,
      title: 'Pitch Readiness',
      description: 'Generate an investor-ready forecast that proves your D2C brand is a solid investment.',
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: 'Product Testing',
      description: 'Sanity-check your margins and cash flow needs before committing to a production run.',
    },
    {
      icon: <Scaling className="h-8 w-8" />,
      title: 'Funding Applications',
      description: 'Attach a clean, professional PDF of your financials to grant or loan applications.',
    },
     {
      icon: <BarChart className="h-8 w-8" />,
      title: 'Monthly Health-Checks',
      description: 'Spot cash flow gaps months before they happen and track your profitability targets.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 md:px-8 py-4">
          <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-white">
                  Plaza
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm">
                  <Link href="#features" className="text-white/80 hover:text-white transition-colors">Features</Link>
                  <Link href="#use-cases" className="text-white/80 hover:text-white transition-colors">Use Cases</Link>
              </nav>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* SECTION 1: HERO */}
        <section className="relative w-full h-screen flex items-center justify-center text-center bg-hero-pattern">
          <div className="max-w-4xl px-4 z-10">
            <h1 
              className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-white"
            >
              The Financial OS for D2C Brands.
            </h1>
            <p 
              className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80"
            >
              Go from spreadsheet chaos to an investor-ready forecast in minutes. Plan your inventory, understand your margins, and never run out of cash.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Button size="lg" onClick={handlePrimaryCta} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg">
                Build My Forecast <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE PROBLEM */}
        <section id="features" className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">
              Forecasting for D2C is broken.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              You're building a brand, not an accounting firm. But you're stuck guessing inventory needs, calculating margins in complex spreadsheets, and praying you have enough cash for the next production run.
            </p>
          </div>
          
          <div className="container mx-auto px-4 mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10 p-8 rounded-2xl shadow-lg border-white/10">
                <Package className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-headline">Plan Your Production</h3>
                <p className="mt-2 text-muted-foreground">Model out your inventory costs, including deposits and final payments, to see the real impact on your cash flow.</p>
            </Card>
             <Card className="bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10 p-8 rounded-2xl shadow-lg border-white/10">
                <DollarSign className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-headline">Master Your Margins</h3>
                <p className="mt-2 text-muted-foreground">Instantly calculate gross, operating, and net margins for every product to ensure every sale is profitable.</p>
            </Card>
             <Card className="bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10 p-8 rounded-2xl shadow-lg border-white/10">
                <TrendingUp className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-headline">Forecast Your Cash Flow</h3>
                <p className="mt-2 text-muted-foreground">See your future cash balance, identify your peak funding needs, and know exactly when you'll be cash-positive.</p>
            </Card>
          </div>
        </section>
        
        {/* SECTION 3: USE CASES */}
        <section id="use-cases" className="py-24 md:py-32 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-headline">Built for Key D2C Moments.</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Whether you're raising a seed round or planning your next collection, a clear forecast is your best co-pilot.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                {useCases.map((useCase) => (
                    <div key={useCase.title}>
                        <div className="flex justify-center mb-4 text-primary">{useCase.icon}</div>
                        <h3 className="text-xl font-semibold">{useCase.title}</h3>
                        <p className="text-muted-foreground mt-2">{useCase.description}</p>
                    </div>
                ))}
                </div>
            </div>
        </section>
        
        {/* SECTION 4: FINAL CTA */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">Stop Guessing. Start Growing.</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Get the financial clarity you need to build a resilient D2C brand. Your AI-powered forecast is five minutes away.
            </p>
            <Button size="lg" className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg" onClick={handlePrimaryCta}>
              Get Started for Free <ArrowRight className="ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Plaza. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
