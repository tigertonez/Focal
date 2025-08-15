

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const REPORT_STORAGE_KEY = 'forecastReport';

export default function LoadingPage() {
    const router = useRouter();
    const { inputs, calculateFinancials, financials, setFinancials, t } = useForecast();
    const [progress, setProgress] = useState(0);
    const [calculationError, setCalculationError] = useState<string | null>(null);

    useEffect(() => {
        // This effect triggers the calculation as soon as the page loads with valid inputs.
        if (inputs && !financials.data && !financials.error) {
            try {
              const data = calculateFinancials(inputs);
              // Save the successful result to localStorage
              localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data));
              // Update context immediately
              setFinancials({ data, error: null, isLoading: false });
            } catch (e: any) {
              console.error("Error during calculation on loading page:", e);
              const errorMessage = e.message || 'An unknown error occurred.';
              setCalculationError(errorMessage);
              setFinancials({ data: null, error: errorMessage, isLoading: false });
            }
        }
    }, [inputs, calculateFinancials, setFinancials, financials.data, financials.error]);

    useEffect(() => {
      // Handles redirecting after calculation or on error
      if (calculationError) {
        // Stop progress on error
        return;
      }
      
      if (financials.data) {
        // Finalize progress and redirect on successful calculation
        setProgress(100);
        setTimeout(() => {
          router.replace('/revenue');
        }, 500);
      }
    }, [financials.data, calculationError, router]);


    // Effect for animating the progress bar
    useEffect(() => {
      if (!financials.data && !calculationError) {
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
    }, [financials.data, calculationError]);

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
