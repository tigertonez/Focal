
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { type EngineInput, EngineInputSchema, type Product } from '@/lib/types';

interface ForecastContextType {
  inputs: EngineInput;
  setInputs: React.Dispatch<React.SetStateAction<EngineInput>>;
  updateInput: (path: string, value: any) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  saveAndCalculate: () => void;
  loading: boolean;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

// Helper for nested state updates
import { set } from 'lodash-es';

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [inputs, setInputs] = useState<EngineInput>(EngineInputSchema.parse({}));
  const [loading, setLoading] = useState(false);

  const updateInput = (path: string, value: any) => {
    setInputs(prevInputs => {
      const newInputs = { ...prevInputs };
      set(newInputs, path, value);
      // Optional: Live validation can be added here
      return newInputs;
    });
  };

  const addProduct = () => {
    const newProduct = { ...EngineInputSchema.shape.products.element.parse({}) };
    setInputs(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
    }));
  };

  const removeProduct = (id: string) => {
    setInputs(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
    }));
  };

  const saveAndCalculate = () => {
    console.log("Saving inputs and setting readyForCalc to true...");
    setLoading(true);
    const finalInputs = { ...inputs, readyForCalc: true };
    setInputs(finalInputs);

    // In a real scenario, this would trigger the engine call.
    // For now, we just log and stop the loading state.
    console.log("Data to be sent to engine:", finalInputs);
    
    setTimeout(() => setLoading(false), 1000); // Simulate network latency
  };

  const value = useMemo(() => ({
    inputs,
    setInputs,
    updateInput,
    addProduct,
    removeProduct,
    saveAndCalculate,
    loading,
  }), [inputs, loading]);

  return (
    <ForecastContext.Provider value={value}>
      {children}
    </ForecastContext.Provider>
  );
};

export const useForecast = (): ForecastContextType => {
  const context = useContext(ForecastContext);
  if (context === undefined) {
    throw new Error('useForecast must be used within a ForecastProvider');
  }
  return context;
};
