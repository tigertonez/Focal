
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { type EngineInput, EngineInputSchema, type Product, type FixedCostItem, type EngineOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZodError } from 'zod';
import { calculateCosts } from '@/lib/engine/costs';

interface ForecastContextType {
  inputs: EngineInput;
  results: EngineOutput | null;
  error: string | null;
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
      depositPct: 50,
    },
  ],
  fixedCosts: [
      { id: 'fc_1', name: 'Salaries', amount: 15000, paymentSchedule: 'Monthly' },
      { id: 'fc_2', name: 'Rent', amount: 5000, paymentSchedule: 'Monthly' },
      { id: 'fc_3', name: 'Marketing', amount: 8000, paymentSchedule: 'According to Sales' },
      { id: 'fc_4', name: 'Planning Buffer', amount: 4200, paymentSchedule: 'Up-Front' },
  ],
  parameters: {
    forecastMonths: 12,
    taxRate: 20,
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
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const result = EngineInputSchema.safeParse(inputs);
    setIsFormValid(result.success);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
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
        const newItems = [...prev.fixedCosts];
        newItems[index] = { ...newItems[index], [field]: value };
        return { ...prev, fixedCosts: newItems };
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
    setResults(null);
    setError(null);
    try {
        const validatedInputs = EngineInputSchema.parse(inputs);
        
        const costResults = calculateCosts(validatedInputs);

        const newResults: EngineOutput = {
          costSummary: costResults.costSummary,
          monthlyCosts: costResults.monthlyCosts,
        };

        setTimeout(() => {
            setResults(newResults);
            setLoading(false);
            toast({
                title: "Calculation Complete",
                description: "Forecast results are ready.",
            });
        }, 500);

    } catch (e) {
        let errorMessage = 'An unknown error occurred.';
        if (e instanceof ZodError) {
            errorMessage = e.errors[0].message;
        } else if (e instanceof Error) {
            errorMessage = e.message;
        }
        setError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'Calculation Error',
            description: errorMessage,
        });
        setLoading(false);
    }
  };

  const value = useMemo(() => ({
    inputs,
    results,
    error,
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
  }), [inputs, results, error, loading, isFormValid]);

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
