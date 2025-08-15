
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
    const { inputs, calculateFinancials, setFinancials, t } = useForecast();
    const [progress, setProgress] = useState(0);
    const [calculationError, setCalculationError] = useState<string | null>(null);

    useEffect(() => {
        // This effect triggers the calculation as soon as the page loads with valid inputs.
        if (inputs) {
            try {
              const data = calculateFinancials(inputs);
              // Update context immediately
              setFinancials({ data, error: null, isLoading: false });

              // If successful, proceed to redirect
              setProgress(100);
              setTimeout(() => {
                router.replace('/revenue');
              }, 500);

            } catch (e: any) {
              console.error("Error during calculation on loading page:", e);
              const errorMessage = e.message || 'An unknown error occurred.';
              setCalculationError(errorMessage);
              setFinancials({ data: null, error: errorMessage, isLoading: false });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs]);


    // Effect for animating the progress bar
    useEffect(() => {
      if (!calculationError) {
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
    }, [calculationError]);

    if (calculationError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>{t.errors.calculationError}</AlertTitle>
                    <AlertDescription>
                        <p>{calculationError}</p>
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
