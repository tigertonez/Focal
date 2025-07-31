

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { useForecast } from '@/context/ForecastContext';

export const useFinancials = () => {
    const { inputs, t } = useForecast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const getReport = () => {
        setIsLoading(true);
        router.push('/loading');
    };
    
    return {
      getReport,
      isLoading
    };
};
