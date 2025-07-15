
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { type EngineInput, EngineInputSchema, type Product, ProductSchema, type FixedCostItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZodError } from 'zod';

interface ForecastContextType {
  inputs: EngineInput;
  setInputs: React.Dispatch<React.SetStateAction<EngineInput>>;
  updateProduct: (productIndex: number, field: keyof Product, value: any) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateFixedCost: (index: number, field: keyof FixedCostItem, value: any) => void;
  addFixedCost: () => void;
  removeFixedCost: (id: string) => void;
  saveDraft: () => void;
  calculateForecast: () => void;
  loading: boolean;
  isFormValid: boolean;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

const initialInputs: EngineInput = {
  products: [
    {
      id: 'prod_initial_1',
      productName: 'Pro Widget',
      plannedUnits: 5000,
      unitCost: 15,
      sellPrice: 49.99,
      salesModel: 'launch',
      sellThrough: 85,
      depositPct: 25,
    },
  ],
  fixedCosts: [
      { id: 'fc_1', name: 'Salaries', amount: 15000 },
      { id: 'fc_2', name: 'Rent', amount: 5000 },
      { id: 'fc_3', name: 'Marketing', amount: 8000 },
  ],
  parameters: {
    forecastMonths: 12,
    taxRate: 20,
    planningBuffer: 15,
    currency: 'USD',
    preOrder: true,
  },
  realtime: {
    dataSource: 'Manual',
    apiKey: '',
    timezone: 'UTC',
  },
};

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [inputs, setInputs] = useState<EngineInput>(initialInputs);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // When switching away from manual, we might need to adjust validation logic
    // For now, we just re-validate whenever inputs change.
    const result = EngineInputSchema.safeParse(inputs);
    setIsFormValid(result.success);
  }, [inputs]);

  const updateProduct = (productIndex: number, field: keyof Product, value: any) => {
    setInputs(prev => {
        const newProducts = [...prev.products];
        newProducts[productIndex] = { ...newProducts[productIndex], [field]: value };
        return { ...prev, products: newProducts };
    });
  };

  const addProduct = () => {
    const newProduct = { 
        ...ProductSchema.parse({}), // uses defaults from schema
        id: `prod_${crypto.randomUUID()}` 
    };
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

  const updateFixedCost = (index: number, field: keyof FixedCostItem, value: any) => {
    setInputs(prev => {
        const newCosts = [...prev.fixedCosts];
        newCosts[index] = { ...newCosts[index], [field]: value };
        return { ...prev, fixedCosts: newCosts };
    });
  };

  const addFixedCost = () => {
    const newCost: FixedCostItem = {
      id: `fc_${crypto.randomUUID()}`,
      name: '',
      amount: 0,
    };
    setInputs(prev => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, newCost],
    }));
  };

  const removeFixedCost = (id: string) => {
    setInputs(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter(c => c.id !== id),
    }));
  };

  const saveDraft = () => {
    console.log("Saving draft:", inputs);
    toast({
        title: "Draft saved",
        description: "Your inputs have been saved locally.",
    });
  };

  const calculateForecast = () => {
    setLoading(true);
    try {
        const validatedInputs = EngineInputSchema.parse(inputs);
        
        console.log("Validation successful, sending to engine:", validatedInputs);

        setTimeout(() => {
            setLoading(false);
            toast({
                title: "Calculation Complete",
                description: "Forecast results are ready.",
            });
        }, 1500);

    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.errors[0];
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: `${firstError.path.join('.')} - ${firstError.message}`,
            });
        }
        setLoading(false);
    }
  };

  const value = useMemo(() => ({
    inputs,
    setInputs,
    updateProduct,
    addProduct,
    removeProduct,
    updateFixedCost,
    addFixedCost,
    removeFixedCost,
    saveDraft,
    calculateForecast,
    loading,
    isFormValid,
  }), [inputs, loading, isFormValid]);

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
