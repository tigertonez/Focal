
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const DATA_STORAGE_KEY = 'financials-report';

export default function LoadingPage() {
    const router = useRouter();
    const { inputs } = useForecast();
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const runCalculation = async () => {
            try {
                const response = await fetch('/api/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'calculate-financials',
                        inputs: inputs,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.error || 'Failed to calculate financials.');
                }
                
                const result = await response.json();
                
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(result));
                }
                
                // Finalize progress and redirect
                setProgress(100);
                setTimeout(() => {
                    router.replace('/revenue');
                }, 500);

            } catch (e: any) {
                setError(e.message || 'An unknown error occurred.');
            }
        };

        runCalculation();
    }, [inputs, router]);

    // Effect for animating the progress bar
    useEffect(() => {
      if (!error) {
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
    }, [error]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Calculation Error</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
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
