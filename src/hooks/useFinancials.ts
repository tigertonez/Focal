
'use client';

import { useState, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema } from '@/lib/types';
import { debounce } from 'lodash-es';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

const DATA_STORAGE_KEY = 'financials-report';

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
            
            const result = await response.json();
            
            // On success, save data to localStorage and redirect
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(result));
            }
            
            router.push('/costs');

        } catch (e: any) {
            setState({ error: e.message || 'An unknown error occurred.', isLoading: false });
            toast({
                variant: 'destructive',
                title: 'Calculation Error',
                description: e.message || 'An unknown error occurred.',
            });
        } finally {
             // Loading state is stopped inside the getReport function
        }
    }, 300), [router, toast]);

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
    
    return {
      getReport,
      error: state.error,
      isLoading: state.isLoading
    };
};
