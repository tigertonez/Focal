
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForecast } from '@/context/ForecastContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const DATA_STORAGE_KEY = 'financials-report';

export default function LoadingPage() {
    const router = useRouter();
    const { inputs } = useForecast();
    const [error, setError] = useState<string | null>(null);

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
                
                // Redirect to the first report page on success
                router.replace('/revenue');

            } catch (e: any) {
                setError(e.message || 'An unknown error occurred.');
            }
        };

        runCalculation();
    }, [inputs, router]);

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
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
                <p className="text-lg font-semibold">Generating Your Financial Forecast...</p>
                <p className="text-muted-foreground">This may take a moment.</p>
            </div>
        </div>
    );
}
