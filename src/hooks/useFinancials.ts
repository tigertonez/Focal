
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema, type EngineOutput } from '@/lib/types';
import { debounce } from 'lodash-es';

export const useFinancials = () => {
    const { inputs } = useForecast();
    const [state, setState] = useState<{
        data: EngineOutput | null;
        error: string | null;
        isLoading: boolean;
    }>({
        data: null,
        error: null,
        isLoading: true,
    });

    const fetchFinancials = useCallback(debounce(async (validatedInputs) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
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
            setState({ data: result, error: null, isLoading: false });
        } catch (e: any) {
            // Keep previous data on error to prevent the UI from blanking out on minor input validation issues
            setState(prev => ({ ...prev, error: e.message || 'An unknown error occurred.', isLoading: false }));
        }
    }, 500), []); // Debounce API calls by 500ms

    useEffect(() => {
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            fetchFinancials(validationResult.data);
        } else {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid input.';
            // Don't clear data if there's a validation error, just show the error.
            setState(prev => ({ ...prev, error: firstError, isLoading: false }));
        }

        return () => {
            fetchFinancials.cancel();
        };
    }, [inputs, fetchFinancials]);

    return {
      data: state.data,
      error: state.error,
      isLoading: state.isLoading
    };
};
