
import { cookies } from 'next/headers';
import { EngineInputSchema, type EngineInput, type EngineOutput } from './types';
import { calculateFinancials } from './engine/financial-engine';

const COOKIE_NAME = 'forecast-inputs';

interface FinancialsResult {
    data: EngineOutput | null;
    inputs: EngineInput | null;
    error: string | null;
}

/**
 * A server-side utility to safely retrieve and calculate financial data.
 * It reads inputs from cookies, validates them, and runs the calculation engine.
 */
export async function getFinancials(): Promise<FinancialsResult> {
    const cookieStore = cookies();
    const inputsCookie = cookieStore.get(COOKIE_NAME);

    if (!inputsCookie) {
        return { data: null, inputs: null, error: 'No forecast inputs found. Please create a report first.' };
    }

    try {
        const inputsJSON = JSON.parse(inputsCookie.value);
        const validation = EngineInputSchema.safeParse(inputsJSON);

        if (!validation.success) {
            console.error("Cookie validation error:", validation.error);
            const firstError = validation.error.errors[0]?.message || 'Invalid input in cookie.';
            return { data: null, inputs: null, error: `Could not load forecast: ${firstError}` };
        }

        const inputs = validation.data;
        const data = calculateFinancials(inputs);
        
        return { data, inputs, error: null };

    } catch (error: any) {
        console.error("Error processing financials from cookie:", error);
        return { data: null, inputs: null, error: error.message || 'An unknown error occurred while processing the forecast.' };
    }
}
