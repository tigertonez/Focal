
'use client';

import { useMemo } from 'react';
import { useForecast } from '@/context/ForecastContext';

export const useCosts = () => {
    const { results, error } = useForecast();

    return useMemo(() => {
        if (error) {
            return {
                costSummary: null,
                monthlyCosts: [],
                error: error,
            };
        }
        
        if (!results?.costSummary) {
            return {
                costSummary: null,
                monthlyCosts: [],
                error: null
            };
        }
        
        return {
            costSummary: results.costSummary,
            monthlyCosts: results.monthlyCosts,
            error: null
        };

    }, [results, error]);
};
