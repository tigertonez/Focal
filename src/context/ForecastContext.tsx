
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { type EngineInput, EngineInputSchema, type Product, type FixedCostItem, type EngineOutput, CostSummarySchema, MonthlyCostSchema } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZodError } from 'zod';
import { calculateCosts } from '@/lib/engine/costs';

interface ForecastContextType {
  inputs: EngineInput;
  results: EngineOutput | null;
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
     {
      id: 'prod_initial_2',
      productName: 'Basic Widget',
      plannedUnits: 10000,
      unitCost: 8,
      sellPrice: 29.99,
      salesModel: 'even',
      sellThrough: 95,
      depositPct: 0,
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
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
    const newProduct: Product = {
        id: `prod_${crypto.randomUUID()}`,
        productName: '',
        plannedUnits: 1000,
        unitCost: 10,
        sellPrice: 25,
        salesModel: 'launch',
        sellThrough: 80,
        depositPct: 0
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
    setResults(null); // Clear previous results
    try {
        const validatedInputs = EngineInputSchema.parse(inputs);
        
        // This is where the full engine would run.
        // For now, we are just calculating costs.
        const costResults = calculateCosts(validatedInputs);

        const newResults: EngineOutput = {
          costSummary: costResults.costSummary,
          monthlyCosts: costResults.monthlyCosts,
          depositProgress: costResults.depositProgress,
        };

        // Simulate network delay
        setTimeout(() => {
            setResults(newResults);
            setLoading(false);
            toast({
                title: "Calculation Complete",
                description: "Forecast results are ready.",
            });
        }, 1000);

    } catch (error) {
        if (error instanceof ZodError) {
            const firstError = error.errors[0];
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: `${firstError.path.join('.')} - ${firstError.message}`,
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Calculation Error',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        }
        setLoading(false);
    }
  };

  const value = useMemo(() => ({
    inputs,
    results,
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
  }), [inputs, results, loading, isFormValid]);

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
