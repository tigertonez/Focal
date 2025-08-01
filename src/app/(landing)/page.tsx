
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Quote, Rocket, Scaling, ShieldCheck } from 'lucide-react';
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
      icon: <Rocket className="h-8 w-8 text-primary" />,
      title: 'Pitch Readiness',
      description: 'Hand investors a credible forecast.',
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: 'Product Testing',
      description: 'Sanity-check margins before you launch.',
    },
    {
      icon: <Scaling className="h-8 w-8 text-primary" />,
      title: 'Funding Applications',
      description: 'Attach a clean PDF to grant or loan forms.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: 'Monthly Health-Checks',
      description: 'Spot cash flow gaps months before they happen.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col">
        {/* Section 1: Hero */}
        <section className="relative w-full h-screen flex items-center justify-center text-center bg-hero-pattern">
          <div className="max-w-4xl px-4 z-10">
            <h1 
              className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-primary-foreground"
            >
              Clarity for Founders.
            </h1>
            <p 
              className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/90"
            >
              Go from spreadsheet chaos to an investor-ready forecast in five minutes. No formulas required.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Button size="lg" onClick={handlePrimaryCta}>
                Build My Forecast <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: The Problem */}
        <section className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">
              Forecasting feels like guesswork.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              You’re a founder, not an accountant. You need to see your numbers clearly to make smart decisions, but traditional tools are complex and time-consuming.
            </p>
          </div>
        </section>
        
        {/* Section 3: How It Works */}
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-primary font-semibold">Step 1</p>
                <h3 className="text-3xl font-bold font-headline">Provide Key Inputs</h3>
                <p className="text-muted-foreground">Enter your core business assumptions: product costs, sales prices, and basic operational expenses. Simple and straightforward.</p>
              </div>
              <div className="space-y-2">
                <p className="text-primary font-semibold">Step 2</p>
                <h3 className="text-3xl font-bold font-headline">Let AI Do the Work</h3>
                <p className="text-muted-foreground">Our engine instantly calculates your revenue, costs, profit, and cash flow over the next 12 months, flagging risks and opportunities.</p>
              </div>
              <div className="space-y-2">
                <p className="text-primary font-semibold">Step 3</p>
                <h3 className="text-3xl font-bold font-headline">Get Your Report</h3>
                <p className="text-muted-foreground">Review your interactive dashboard or download a print-ready PDF summary, perfect for pitch decks and loan applications.</p>
              </div>
            </div>
            <div className="h-[500px] bg-card rounded-2xl shadow-lg border flex items-center justify-center p-8">
               <div className="text-center">
                  <p className="text-6xl">📊</p>
                  <p className="mt-4 font-semibold text-foreground">Your Financials, Visualized.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Section 4: Use Cases */}
        <section className="py-24 md:py-32 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-headline">A Tool for Every Stage.</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Whether you're validating an idea or scaling up, a clear forecast is your best co-pilot.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {useCases.map((useCase) => (
                    <div key={useCase.title} className="text-center">
                        <div className="flex justify-center mb-4">{useCase.icon}</div>
                        <h3 className="text-xl font-semibold">{useCase.title}</h3>
                        <p className="text-muted-foreground mt-2">{useCase.description}</p>
                    </div>
                ))}
                </div>
            </div>
        </section>
        
        {/* Section 5: Final CTA */}
        <section className="py-24 md:py-32 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">Ready to know your numbers?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Stop guessing. Start planning. Get your AI-powered financial forecast in the next five minutes.
            </p>
            <Button size="lg" className="mt-8" onClick={handlePrimaryCta}>
              Get Started for Free
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Your Company. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
