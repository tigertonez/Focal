
'use client';

import { EngineInputSchema, type EngineInput, type EngineOutput } from './types';

interface FinancialsResult {
    data: EngineOutput | null;
    inputs: EngineInput | null;
    error: string | null;
}

const DATA_STORAGE_KEY = 'financials-report';

/**
 * A client-side utility to safely retrieve financial data from localStorage.
 */
export function getFinancials(): FinancialsResult {
    if (typeof window === 'undefined') {
        return { data: null, inputs: null, error: 'This function must be run on the client.' };
    }
    
    const storedData = localStorage.getItem(DATA_STORAGE_KEY);

    if (!storedData) {
        return { data: null, inputs: null, error: 'No forecast inputs found. Please create a report first.' };
    }

    try {
        const parsed = JSON.parse(storedData);
        
        // Basic validation to ensure the structure is what we expect
        if (!parsed.data || !parsed.inputs) {
            throw new Error("Stored data is missing 'data' or 'inputs' keys.");
        }
        
        const inputsValidation = EngineInputSchema.safeParse(parsed.inputs);
        if (!inputsValidation.success) {
            console.error("LocalStorage validation error:", inputsValidation.error);
            const firstError = inputsValidation.error.errors[0]?.message || 'Invalid input in stored data.';
            return { data: null, inputs: null, error: `Could not load forecast: ${firstError}` };
        }
        
        // Assuming the data structure is correct if inputs are valid.
        // A full validation of `parsed.data` with EngineOutputSchema could be added for more safety.
        
        return { data: parsed.data, inputs: inputsValidation.data, error: null };

    } catch (error: any) {
        console.error("Error processing financials from localStorage:", error);
        localStorage.removeItem(DATA_STORAGE_KEY); // Clear corrupted data
        return { data: null, inputs: null, error: error.message || 'An unknown error occurred while processing the forecast.' };
    }
}
