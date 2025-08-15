

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { useForecast } from '@/context/ForecastContext';
import { EngineInput } from '@/lib/types';

export const useFinancials = () => {
    const { t, setInputs } = useForecast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const getReport = (inputs: EngineInput) => {
        setIsLoading(true);
        // Persist the latest inputs to context so the loading page can use them
        setInputs(inputs);
        // We pass the latest inputs to the loading page via context,
        // which is set on the inputs page before calling this.
        router.push('/loading');
    };
    
    return {
      getReport,
      isLoading
    };
};
