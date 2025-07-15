
'use client';

import { useMemo } from 'react';
import { useForecast } from '@/context/ForecastContext';

export const useCosts = () => {
    const { results } = useForecast();

    return useMemo(() => {
        if (!results) {
            return {
                costSummary: null,
                monthlyCosts: [],
                depositProgress: 0,
                error: null
            };
        }
        
        return {
            costSummary: results.costSummary,
            monthlyCosts: results.monthlyCosts,
            depositProgress: results.depositProgress,
            error: null // Or handle errors from results if they exist
        };

    }, [results]);
};
