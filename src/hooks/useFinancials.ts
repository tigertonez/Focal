
'use client';

import { useState, useCallback } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema } from '@/lib/types';
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

    const getReport = () => {
        setState({ isLoading: true, error: null });
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            // Instead of calculating here, navigate to the loading page.
            // The loading page will handle the calculation.
            router.push('/loading');
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
