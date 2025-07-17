import { cookies } from "next/headers";
import { type EngineInput, type EngineOutput } from "@/lib/types";

interface FinancialsPayload {
    inputs: EngineInput;
    data: EngineOutput;
}

/**
 * A server-side utility to safely retrieve financial data from cookies.
 */
export function getFinancialsServer(): FinancialsPayload | null {
  const cookieStore = cookies();
  const financialsCookie = cookieStore.get("financials");

  if (!financialsCookie?.value) {
    return null;
  }
  
  try {
    const decodedJson = decodeURIComponent(financialsCookie.value);
    const parsed = JSON.parse(decodedJson);

    // Basic check for the expected structure
    if (parsed && parsed.inputs && parsed.data) {
        return parsed as FinancialsPayload;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse financials cookie:", error);
    return null;
  }
}
