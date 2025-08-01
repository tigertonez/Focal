
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const HowItWorksStep = ({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl flex-shrink-0">
      {step}
    </div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const FeatureCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="bg-background/50 text-center p-6 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="p-0">
      <CardTitle className="text-md font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0 mt-2">
      <p className="text-muted-foreground text-sm">{children}</p>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };

  return (
    <div className="bg-muted/30 text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="text-lg font-bold font-headline text-primary">Plaza</h1>
        <Button onClick={handlePrimaryCta} size="sm">
          Get Forecast <ArrowRight className="ml-2" size={16} />
        </Button>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white px-4">
            <Image
                src="https://placehold.co/1920x1080/000000/FFFFFF.png"
                alt="Financial chart background"
                data-ai-hint="financial chart"
                layout="fill"
                objectFit="cover"
                className="absolute inset-0 z-0"
            />
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            <div className="relative z-20 space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
                    Your numbers, crystal-clear in five minutes.
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90">
                    Upload a few key business inputs and get a print-ready financial forecast—powered by AI and built for founders who hate spreadsheets.
                </p>
                <div className="mt-8 flex justify-center items-center gap-4">
                    <Button size="lg" onClick={handlePrimaryCta}>
                        Get My Instant Forecast <ArrowRight className="ml-2" />
                    </Button>
                    <Button variant="outline" size="lg" asChild className="bg-transparent text-white border-white hover:bg-white hover:text-primary">
                         <Link href="#how-it-works">See How It Works</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-4 border-y bg-background">
          <p className="text-center text-sm text-muted-foreground">
            Used by early-stage brands from Berlin to Brooklyn
          </p>
        </section>

        {/* Problem -> Solution */}
        <section className="py-16 md:py-24 px-4 bg-background">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-headline">
                The Pain of Forecasting
              </h2>
              <p className="text-muted-foreground">
                Running a product business without seeing the full financial
                picture feels like driving blind.
              </p>
              <ul className="space-y-3 text-md">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Manual spreadsheets are brittle.</span> One broken formula can derail your entire forecast.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Generic SaaS dashboards miss cash-flow timing.</span> They don't understand pre-orders or production deposits.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Investors want numbers yesterday.</span> You don't have days to build a forecast from scratch.
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-4 p-8 bg-primary/5 rounded-lg border border-primary/20">
              <h2 className="text-3xl font-bold font-headline text-primary">
                Our Fix
              </h2>
              <p className="text-muted-foreground">
                A lean, AI-driven engine that turns prices, costs and a handful
                of company facts into:
              </p>
              <ul className="space-y-3 text-md">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>Revenue, profit & cash-flow projections</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>Product-level margins</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>SWOT-style insight cards</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span>A PDF you can drop into any pitch deck</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                All in under five minutes—no finance degree required.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/40 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-headline">How It Works</h2>
            <p className="text-muted-foreground mt-2">Get from zero to a full financial forecast in three simple steps.</p>
          </div>
          <div className="max-w-3xl mx-auto mt-12 grid gap-10 md:gap-16">
            <HowItWorksStep
              step="1"
              title="Drop your data"
              description="Enter your core business assumptions: product prices, unit costs, payment terms, and team size. No need to link accounts."
            />
            <HowItWorksStep
              step="2"
              title="AI crunches the numbers"
              description="Our copilot maps your business context, allocates every dollar correctly, and automatically flags potential weak spots in your plan."
            />
            <HowItWorksStep
              step="3"
              title="Review & print"
              description="Get your complete forecast instantly. Download a clean PDF for your pitch deck or keep iterating. All token use is capped for cost safety."
            />
          </div>
        </section>

        {/* Founder Note */}
        <section className="py-16 md:py-24 px-4 bg-background">
          <Card className="max-w-3xl mx-auto p-8 shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-1">
                    <Avatar className="h-32 w-32 mx-auto">
                        <AvatarImage src="https://placehold.co/200x200.png" data-ai-hint="founder portrait" />
                        <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                </div>
                <div className="md:col-span-2">
                    <blockquote className="border-l-4 border-primary pl-6">
                        <p className="text-lg italic text-muted-foreground">
                        "Hey, I’m Anton from Berlin. I built this after years of watching
                        small brands stumble over messy spreadsheets. I care about your
                        numbers as much as you do—and I made sure this tool does too."
                        </p>
                        <p className="mt-4 font-semibold">Anton</p>
                        <p className="text-sm text-muted-foreground">Founder of Plaza</p>
                    </blockquote>
                </div>
            </div>
          </Card>
        </section>

        {/* Use-Case Cards */}
        <section className="py-16 md:py-24 bg-muted/40 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">One Tool, Many Use Cases</h2>
              <p className="text-muted-foreground mt-2">From securing funding to making smarter inventory decisions.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FeatureCard title="Pitch Readiness">
                Hand investors a credible forecast.
              </FeatureCard>
              <FeatureCard title="Product Testing">
                Sanity-check margins before launch.
              </FeatureCard>
              <FeatureCard title="Funding Apps">
                Attach the PDF to grant or loan forms.
              </FeatureCard>
              <FeatureCard title="Monthly Health Check">
                Spot cash gaps early.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section className="py-16 md:py-24 text-center px-4 bg-background">
          <div className="max-w-md mx-auto p-8 rounded-lg border bg-card shadow-lg">
            <h2 className="text-3xl font-bold font-headline">
              Buy me a coffee (€5)
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              → unlock your full forecast & PDF export.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              No subscriptions. No hidden fees. Just one coffee to support the development.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <footer className="py-16 text-center border-t px-4 bg-muted/40">
          <h2 className="text-4xl font-bold font-headline">
            Ready to know your numbers?
          </h2>
          <div className="mt-6">
            <Button size="lg" onClick={handlePrimaryCta}>
              Get My Instant Forecast
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Need help first? Email anton@yourdomain.com
          </p>
        </footer>
      </main>
    </div>
  );
}

    