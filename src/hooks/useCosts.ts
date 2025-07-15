
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema, type EngineOutput } from '@/lib/types';
import { debounce } from 'lodash-es';

export const useCosts = () => {
    const { inputs } = useForecast();
    // Consolidate state into a single object for easier management
    const [state, setState] = useState<{
        data: EngineOutput | null;
        error: string | null;
        isLoading: boolean;
    }>({
        data: null,
        error: null,
        isLoading: true,
    });

    const fetchCosts = useCallback(debounce(async (validatedInputs) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
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
            setState({ data: result, error: null, isLoading: false });
        } catch (e: any) {
            setState({ data: null, error: e.message || 'An unknown error occurred.', isLoading: false });
        }
    }, 500), []); // Debounce API calls by 500ms

    useEffect(() => {
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            fetchCosts(validationResult.data);
        } else {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid input.';
            setState({ data: state.data, error: firstError, isLoading: false }); // Keep old data if available
        }

        // Cleanup function to cancel any pending debounced calls
        return () => {
            fetchCosts.cancel();
        };
    }, [inputs, fetchCosts, state.data]);

    // This hook now returns an object that can be spread into the PageDataProvider
    return {
      data: state.data,
      error: state.error,
      isLoading: state.isLoading
    };
};
