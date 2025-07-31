
'use client';

import { useState } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { EngineInputSchema } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

export const useFinancials = () => {
    const { inputs, t } = useForecast();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const getReport = () => {
        setIsLoading(true);
        const validationResult = EngineInputSchema.safeParse(inputs);
        if (validationResult.success) {
            router.push('/loading');
        } else {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid input.';
            setIsLoading(false);
            toast({
                variant: 'destructive',
                title: t.errors.calculationError,
                description: firstError,
            });
        }
    };
    
    return {
      getReport,
      isLoading
    };
};
