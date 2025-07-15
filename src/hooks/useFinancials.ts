
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema, type EngineOutput } from '@/lib/types';
import { debounce } from 'lodash-es';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

export const useFinancials = () => {
    const { inputs } = useForecast();
    const router = useRouter();
    const { toast } = useToast();
    const [state, setState] = useState<{
        error: string | null;
        isLoading: boolean;
    }>({
        error: null,
        isLoading: false,
    });

    const runCalculation = useCallback(debounce(async (validatedInputs) => {
        setState({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate-financials',
                    inputs: validatedInputs,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to calculate financials.');
            }
            
            // On success, redirect to the costs page to show the results
            // The data is available on the server via cookies, so no need to pass it here
            router.push('/costs');
            router.refresh(); // Important to trigger a refresh to fetch new server data

        } catch (e: any) {
            setState({ error: e.message || 'An unknown error occurred.', isLoading: false });
            toast({
                variant: 'destructive',
                title: 'Calculation Error',
                description: e.message || 'An unknown error occurred.',
            });
        } finally {
             // In most cases a redirect will happen, but if not, stop loading.
             setState(prev => ({ ...prev, isLoading: false }));
        }
    }, 500), [router, toast]);

    const getReport = () => {
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            runCalculation(validationResult.data);
        } else {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid input.';
            setState({ error: firstError, isLoading: false });
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: firstError,
            });
        }
    };
    
    // This hook now exposes the `getReport` function and the loading/error state
    // It no longer holds the `data` itself, as that's handled by server components.
    return {
      getReport,
      error: state.error,
      isLoading: state.isLoading
    };
};
