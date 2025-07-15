
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema, type CostSummary, type MonthlyCost, type EngineOutput } from '@/lib/types';
import { debounce } from 'lodash-es';


export const useCosts = () => {
    const { inputs } = useForecast();
    const [data, setData] = useState<EngineOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCosts = useCallback(debounce(async (validatedInputs) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate-costs',
                    inputs: validatedInputs,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to calculate costs.');
            }

            const result = await response.json();
            setData(result);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, 500), []); // Debounce API calls by 500ms

    useEffect(() => {
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            fetchCosts(validationResult.data);
        } else {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid input.';
            setError(firstError);
            setData(null);
            setIsLoading(false);
        }

        // Cleanup function to cancel any pending debounced calls
        return () => {
            fetchCosts.cancel();
        };
    }, [inputs, fetchCosts]);

    return {
        costSummary: data?.costSummary || null,
        monthlyCosts: data?.monthlyCosts || [],
        error,
        isLoading,
    };
};
