
'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from 'react';
import { type EngineInput, EngineInputSchema, type Product, type FixedCostItem, type EngineOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZodError } from 'zod';
import html2canvas from 'html2canvas';


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
  runProactiveAnalysis: () => void;
  proactiveAnalysis: string | null;
  setProactiveAnalysis: React.Dispatch<React.SetStateAction<string | null>>;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

const initialInputs: EngineInput = {
  products: [
    {
      id: 'prod_initial_1',
      productName: 'My Awesome Product',
      plannedUnits: 100,
      unitCost: 10,
      sellPrice: 30,
      salesModel: 'launch',
      sellThrough: 80,
      depositPct: 25,
    },
  ],
  fixedCosts: [
      { id: 'fc_1', name: 'Marketing', amount: 2000, paymentSchedule: 'Up-Front' },
      { id: 'fc_2', name: 'Planning Buffer', amount: 2000, paymentSchedule: 'Up-Front' },
  ],
  parameters: {
    forecastMonths: 12,
    taxRate: 20,
    currency: 'EUR',
    preOrder: true,
  },
  realtime: {
    dataSource: 'Manual',
    apiKey: '',
    timezone: 'UTC',
  },
};

const DRAFT_STORAGE_KEY = 'forecastDraft';

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [inputs, setInputs] = useState<EngineInput>(initialInputs);
  const [proactiveAnalysis, setProactiveAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            const parsedDraft = JSON.parse(savedDraft);
            // You might want to validate this with Zod before setting state
            setInputs(parsedDraft);
             toast({
                title: "Draft loaded",
                description: "Your previous session has been restored.",
            });
        }
    } catch (e) {
        console.error("Failed to load draft from local storage", e);
    }
  }, []);

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
      paymentSchedule: 'Monthly',
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
     try {
        const dataToSave = JSON.stringify(inputs);
        localStorage.setItem(DRAFT_STORAGE_KEY, dataToSave);
        toast({
            title: "Draft saved!",
            description: "Your inputs have been saved to this browser.",
        });
    } catch (e) {
        console.error("Failed to save draft", e);
        toast({
            variant: "destructive",
            title: "Save failed",
            description: "Could not save draft to local storage.",
        });
    }
  };
  
  const runProactiveAnalysis = async () => {
    try {
        setProactiveAnalysis(null);
        const canvas = await html2canvas(document.body, { logging: false, useCORS: true });
        const screenshotDataUri = canvas.toDataURL('image/png');
        const question = "Review the completed forecast for financial clarity, dependency mistakes, and UI/UX issues. Be concise.";
        
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'copilot',
              question,
              screenshotDataUri,
            }),
        });

        if (!response.ok) return; // Fail silently

        const result = await response.json();
        // Only show analysis if it's meaningful
        if (result.answer && !result.answer.toLowerCase().includes("no issues")) {
           setProactiveAnalysis(result.answer);
        } else {
           setProactiveAnalysis(null);
        }

    } catch (e) {
        console.error("Proactive analysis failed", e); // Log error but don't bother user
    }
  }
  
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
    runProactiveAnalysis,
    proactiveAnalysis,
    setProactiveAnalysis,
  }), [inputs, proactiveAnalysis]);

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
