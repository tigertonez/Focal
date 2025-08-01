
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };

  const features = [
    {
      title: 'Secure Your Funding',
      description: 'Generate an investor-ready forecast that answers the tough questions on profitability and cash flow.',
    },
    {
      title: 'De-Risk Your Inventory',
      description: 'Model production costs and sales cycles to see the true cash impact of inventory before you spend a dime.',
    },
    {
      title: 'Master Your Margins',
      description: 'Go beyond revenue. Calculate product-level profitability to ensure every sale strengthens your bottom line.',
    },
  ];
  
  const personas = [
      "Founders seeking investment",
      "E-commerce managers",
      "D2C brand operators",
      "Financial consultants",
      "Business strategists",
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 md:px-8 py-6">
          <div className="container mx-auto flex justify-between items-center">
              <Link href="/">
                <Image src="/logo.png" alt="Focal Logo" width={140} height={140} priority />
              </Link>
              <nav className="flex items-center gap-8">
                  <Link href="#features" className="text-base text-white hover:underline transition-opacity">Features</Link>
                  <Link href="#waitlist" className="text-base text-white hover:underline transition-opacity">Waitlist</Link>
              </nav>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* SECTION 1: HERO */}
        <section className="relative w-full h-screen flex items-center justify-center text-center bg-black">
          <div className="absolute top-0 left-0 w-full h-full">
            <Image
              src="/background.jpeg"
              alt="Financial OS background"
              fill
              className="object-cover"
              quality={100}
              priority
            />
          </div>
          <div className="max-w-3xl px-4 z-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              The Financial OS for D2C Brands.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/80">
              Go from spreadsheet chaos to an investor-ready forecast in minutes. Plan inventory, master your margins, and never run out of cash.
            </p>
            <div className="mt-16 flex items-center justify-center">
              <Button size="lg" onClick={handlePrimaryCta} className="bg-white text-[#324E98] hover:bg-gray-200 shadow-lg font-bold px-8 py-6 text-lg">
                Build My Forecast <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2: FEATURES */}
        <section id="features" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold">
                Your entire financial workflow, unified.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Focal is the first platform that connects your inventory planning, cost management, and financial forecasting in one place. Stop guessing, start scaling.
              </p>
            </div>
            
            <div className="mt-12 max-w-5xl mx-auto">
              <Card className="w-full aspect-video bg-muted flex items-center justify-center overflow-hidden border-2 shadow-lg">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/VhTf_Inf7Fs" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </Card>
            </div>

            <div className="flex flex-col justify-center items-center mt-16">
              <Card className="w-full max-w-5xl shadow-lg">
                <CardContent className="p-8 grid md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold">Achieve your critical business goals</h3>
                        {features.map((feature, index) => (
                          <div key={feature.title}>
                            {index > 0 && <Separator className="my-4" />}
                            <div className="flex items-start gap-4">
                              <CheckCircle className="text-primary h-6 w-6 mt-1 flex-shrink-0" />
                              <div>
                                <h4 className="text-lg font-semibold">{feature.title}</h4>
                                <p className="mt-1 text-muted-foreground">{feature.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="bg-muted/50 p-6 rounded-lg">
                         <h3 className="text-xl font-bold flex items-center gap-2">
                             <Users className="text-primary" />
                             Built for...
                         </h3>
                         <ul className="mt-4 space-y-2 text-muted-foreground">
                            {personas.map(p => (
                               <li key={p} className="flex items-center gap-2">
                                  <ArrowRight size={16} className="text-primary/70" />
                                  <span>{p}</span>
                               </li>
                            ))}
                         </ul>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* SECTION 3: PRICING / TIERS */}
        <section id="waitlist" className="py-16 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-5 gap-12 items-center">
                    <div className="md:col-span-2">
                        <h2 className="text-4xl font-bold">Start for Free.</h2>
                        <p className="mt-4 text-muted-foreground">
                            Use our simplified forecasting engine to see your potential revenue and basic costs instantly. No credit card required. Get a feel for how powerful financial clarity can be.
                        </p>
                        <Button size="lg" onClick={handlePrimaryCta} className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                          Try the Free Forecaster <ArrowRight className="ml-2" />
                        </Button>
                    </div>
                    <Card className="p-8 rounded-xl shadow-lg bg-card md:col-span-3">
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
