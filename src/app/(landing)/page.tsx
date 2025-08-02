
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Users, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Image from 'next/image';


export default function LandingPage() {
  const router = useRouter();

  const handlePrimaryCta = () => {
    router.push('/inputs');
  };
  
  const personas = [
      "For founders turning a vision into an investor-ready plan.",
      "For D2C brands scaling from pre-order to a full-stock model.",
      "For Shopify stores managing inventory for any physical product, from fashion to furniture.",
      "For anyone who needs financial clarity without spending weeks in spreadsheets.",
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
        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold">
                Your entire financial workflow, unified.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Focal is the first platform that connects your inventory planning, cost management, and financial forecasting in one place. Stop guessing, start scaling. No credit card required!
              </p>
            </div>

            <div className="mt-20">
                <div className="bg-muted rounded-xl aspect-video w-full max-w-5xl mx-auto overflow-hidden">
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
            
            <div className="mt-20 max-w-4xl mx-auto">
                 <h3 className="text-center text-xl font-bold mb-6 flex items-center justify-center gap-2">
                     <Users className="text-primary" />
                     Your financial command center, no matter what you sell.
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-muted-foreground">
                    {personas.map(p => (
                       <div key={p} className="flex items-start gap-3">
                          <CheckCircle size={16} className="text-primary/80 flex-shrink-0 mt-1" />
                          <span>{p}</span>
                       </div>
                    ))}
                 </div>
            </div>

          </div>
        </section>
        
        {/* SECTION 3: PRICING / TIERS */}
        <section id="waitlist" className="bg-muted/50 pt-8 pb-12 md:pb-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold">Start for Free.</h2>
                        <p className="mt-4 text-muted-foreground">
                            Use our simplified forecasting engine to see your potential revenue and basic costs instantly. Get a feel for how powerful financial clarity can be.
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
                        <p className="text-xs text-muted-foreground mt-3">No spam. You'll only get an email with access to the tool.</p>
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
