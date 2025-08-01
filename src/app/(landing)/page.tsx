
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Quote, Rocket, Scaling, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

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
      description: 'Sanity-check margins before launch.',
    },
    {
      icon: <Scaling className="h-8 w-8 text-primary" />,
      title: 'Funding Apps',
      description: 'Attach the PDF to grant or loan forms.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: 'Monthly Health Check',
      description: 'Spot cash gaps early.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-primary font-headline">Plaza</h1>
        <nav className="hidden md:flex items-center gap-6 text-sm">
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
        <Button onClick={handlePrimaryCta} size="sm" className="md:hidden">
          Get Started
        </Button>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative w-full h-screen flex items-center justify-center text-center text-primary-foreground bg-hero-pattern bg-cover bg-center">
          <div className="max-w-4xl px-4 z-10">
            <h1 
              className="text-5xl md:text-7xl font-bold font-headline tracking-tighter"
              style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
            >
              Your numbers, crystal-clear in five minutes.
            </h1>
            <p 
              className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/90"
              style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}
            >
              Upload a few key business inputs and get a print-ready financial forecast—powered by AI and built for founders who hate spreadsheets.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handlePrimaryCta}>
                Get My Instant Forecast <ArrowRight className="ml-2" />
              </Button>
              <Button variant="link" size="lg" asChild className="text-primary-foreground/80 hover:text-primary-foreground">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">
              Used by early-stage brands from Berlin to Brooklyn
            </p>
          </div>
        </section>

        <section id="problem" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-headline text-foreground">The Pain</h2>
              <p className="text-lg text-muted-foreground">
                Running a product business without seeing the full financial picture feels like driving blind.
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Manual spreadsheets are brittle.</li>
                <li>Generic SaaS dashboards miss cash-flow timing.</li>
                <li>Investors want numbers yesterday.</li>
              </ul>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-lg border">
              <h2 className="text-3xl font-bold font-headline text-primary">Our Fix</h2>
              <p className="text-lg text-muted-foreground mt-4">
                A lean, AI-driven engine that turns prices, costs and a handful of company facts into:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-4 list-disc list-inside">
                <li>Revenue, profit & cash-flow projections</li>
                <li>Product-level margins</li>
                <li>SWOT-style insight cards</li>
                <li>A PDF you can drop into any pitch deck</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold font-headline">All in under five minutes.</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">No finance degree required.</p>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
              <div className="space-y-2">
                <div className="text-5xl font-bold text-primary">1.</div>
                <h3 className="text-xl font-semibold">Drop your data</h3>
                <p className="text-muted-foreground">Prices, unit costs, payment terms, team size.</p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-primary">2.</div>
                <h3 className="text-xl font-semibold">AI crunches</h3>
                <p className="text-muted-foreground">Our copilot maps your context, allocates every Euro and flags weak spots.</p>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-primary">3.</div>
                <h3 className="text-xl font-semibold">Review & print</h3>
                <p className="text-muted-foreground">Download a clean PDF or keep iterating—all token use capped for cost safety.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="use-cases" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {useCases.map((useCase, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="flex justify-center mb-4">{useCase.icon}</div>
                  <h3 className="text-lg font-semibold">{useCase.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{useCase.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="founder-note" className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Avatar className="h-20 w-20 mx-auto mb-6">
              <AvatarImage src="https://github.com/shadcn.png" alt="Anton" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <blockquote className="text-xl italic text-foreground relative">
              <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/20" />
              Hey, I’m Anton from Berlin. I built this after years of watching small brands stumble over messy spreadsheets. I care about your numbers as much as you do—and I made sure the tool does too.
              <Quote className="absolute -bottom-4 -right-4 h-8 w-8 text-primary/20" />
            </blockquote>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-headline">Buy me a coffee (€5) → unlock your full forecast & PDF export.</h2>
            <p className="text-lg text-muted-foreground mt-4">No subscriptions. No hidden fees. Just one coffee.</p>
            <Button size="lg" className="mt-8" onClick={handlePrimaryCta}>
              Get My Instant Forecast
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <h3 className="text-2xl font-bold font-headline text-foreground">Ready to know your numbers?</h3>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button size="lg" onClick={handlePrimaryCta}>
                Get My Instant Forecast
             </Button>
          </div>
           <p className="text-sm mt-8">
            Need help first? Email <a href="mailto:anton@example.com" className="text-primary underline">anton@example.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
