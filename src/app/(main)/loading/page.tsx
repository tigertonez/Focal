

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function LoadingPage() {
    const router = useRouter();
    const { inputs, calculateFinancials, financials, t } = useForecast();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // This check prevents re-calculation if data already exists from a refresh
        if (!financials.data) {
          calculateFinancials(inputs);
        }
    }, [calculateFinancials, inputs, financials.data]);

    useEffect(() => {
        if (!financials.isLoading) {
            if (financials.error) {
                // Error state is handled by the main return block
                return;
            }
            // Finalize progress and redirect on successful calculation
            setProgress(100);
            setTimeout(() => {
                router.replace('/revenue');
            }, 500);
        }
    }, [financials.isLoading, financials.error, router]);

    // Effect for animating the progress bar
    useEffect(() => {
      if (financials.isLoading && !financials.error) {
        const timer = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) {
              clearInterval(timer);
              return 95;
            }
            return prev + 5;
          });
        }, 200);

        return () => clearInterval(timer);
      }
    }, [financials.isLoading, financials.error]);

    if (financials.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        <p>{financials.error}</p>
                        <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => router.push('/inputs')}
                        >
                            Back to Inputs
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
            <div className="text-center">
                <p className="text-2xl font-semibold font-headline">Generating Your Financial Forecast...</p>
                <p className="text-muted-foreground mt-1">This may take a moment. Please don't close this window.</p>
            </div>
            <div className="w-full max-w-md">
              <Progress value={progress} />
              <div className="text-center text-sm text-muted-foreground mt-2">{progress}%</div>
            </div>
        </div>
    );
}
