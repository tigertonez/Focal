'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FeatureCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="bg-muted/30">
        <CardHeader>
            <CardTitle className="text-md font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-sm">{children}</p>
        </CardContent>
    </Card>
);

const HowItWorksStep = ({ step, title, description }: { step: string; title: string; description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
            {step}
        </div>
        <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    </div>
);


export default function LandingPage() {
    const router = useRouter();

    const handlePrimaryCta = () => {
        router.push('/inputs');
    };
    
    return (
        <div className="bg-background text-foreground">
            <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
                 <h1 className="text-lg font-bold font-headline text-primary">Plaza</h1>
                 <Button onClick={handlePrimaryCta} size="sm">
                    Get Forecast <ArrowRight className="ml-2" size={16} />
                 </Button>
            </header>
            
            <main className="pt-16">
                {/* Hero Section */}
                <section className="py-20 md:py-32 text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
                        Your numbers, crystal-clear in five minutes.
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Upload a few key business inputs and get a print-ready financial forecast—powered by AI and built for founders who hate spreadsheets.
                    </p>
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <Button size="lg" onClick={handlePrimaryCta}>
                            Get My Instant Forecast <ArrowRight className="ml-2" />
                        </Button>
                         <Link href="#how-it-works" className="text-sm font-medium text-primary hover:underline">
                            See How It Works
                         </Link>
                    </div>
                </section>

                {/* Social Proof Bar */}
                <section className="py-4 border-y bg-muted/50">
                    <p className="text-center text-sm text-muted-foreground">
                        Used by early-stage brands from Berlin to Brooklyn
                    </p>
                </section>

                {/* Problem -> Solution */}
                <section className="py-16 md:py-24 px-4">
                     <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold font-headline">The Pain</h2>
                            <p className="text-muted-foreground">
                                Running a product business without seeing the full financial picture feels like driving blind.
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-red-500 mt-0.5" /> <span>Manual spreadsheets are brittle.</span></li>
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-red-500 mt-0.5" /> <span>Generic SaaS dashboards miss cash-flow timing.</span></li>
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-red-500 mt-0.5" /> <span>Investors want numbers yesterday.</span></li>
                            </ul>
                        </div>
                         <div className="space-y-4 p-6 bg-primary/5 rounded-lg">
                            <h2 className="text-2xl font-bold font-headline text-primary">Our Fix</h2>
                             <p className="text-muted-foreground">
                               A lean, AI-driven engine that turns prices, costs and a handful of company facts into:
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> <span>Revenue, profit & cash-flow projections</span></li>
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> <span>Product-level margins</span></li>
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> <span>SWOT-style insight cards</span></li>
                                <li className="flex gap-2 items-start"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> <span>A PDF you can drop into any pitch deck</span></li>
                            </ul>
                             <p className="text-xs text-muted-foreground pt-2">All in under five minutes—no finance degree required.</p>
                        </div>
                    </div>
                </section>
                
                {/* How It Works */}
                <section id="how-it-works" className="py-16 md:py-24 bg-muted/50 px-4">
                     <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-bold font-headline">How It Works</h2>
                    </div>
                    <div className="max-w-2xl mx-auto mt-12 grid gap-10">
                       <HowItWorksStep step="1" title="Drop your data" description="Prices, unit costs, payment terms, team size." />
                       <HowItWorksStep step="2" title="AI crunches" description="Our copilot maps your context, allocates every Euro and flags weak spots." />
                       <HowItWorksStep step="3" title="Review & print" description="Download a clean PDF or keep iterating—all token use capped for cost safety." />
                    </div>
                </section>
                
                {/* Founder Note */}
                <section className="py-16 md:py-24 px-4">
                    <Card className="max-w-2xl mx-auto p-8 shadow-lg">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="founder portrait" />
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                            <blockquote className="border-l-4 border-primary pl-4">
                                <p className="italic text-muted-foreground">"Hey, I’m Anton from Berlin. I built this after years of watching small brands stumble over messy spreadsheets. I care about your numbers as much as you do—and I made sure the tool does too."</p>
                            </blockquote>
                        </div>
                    </Card>
                </section>

                {/* Use-Case Cards */}
                 <section className="py-16 md:py-24 bg-muted/50 px-4">
                     <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FeatureCard title="Pitch Readiness">Hand investors a credible forecast.</FeatureCard>
                            <FeatureCard title="Product Testing">Sanity-check margins before launch.</FeatureCard>
                            <FeatureCard title="Funding Apps">Attach the PDF to grant or loan forms.</FeatureCard>
                            <FeatureCard title="Monthly Health Check">Spot cash gaps early.</FeatureCard>
                        </div>
                    </div>
                 </section>
                 
                {/* Pricing Teaser */}
                 <section className="py-16 md:py-24 text-center px-4">
                    <div className="max-w-md mx-auto p-8 rounded-lg border bg-card">
                         <h2 className="text-2xl font-bold font-headline">Buy me a coffee (€5)</h2>
                         <p className="text-muted-foreground mt-2">→ unlock your full forecast & PDF export.</p>
                         <p className="text-xs text-muted-foreground mt-4">No subscriptions. No hidden fees. Just one coffee.</p>
                    </div>
                 </section>

                 {/* Final CTA */}
                <footer className="py-16 text-center border-t px-4">
                    <h2 className="text-3xl font-bold font-headline">Ready to know your numbers?</h2>
                    <div className="mt-6">
                        <Button size="lg" onClick={handlePrimaryCta}>Get My Instant Forecast</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Need help first? Email anton@yourdomain.com
                    </p>
                </footer>
            </main>
        </div>
    );
}
