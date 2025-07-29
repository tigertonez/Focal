

'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from 'react';
import { type EngineInput, EngineInputSchema, type Product, type FixedCostItem, type EngineOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZodError } from 'zod';
import html2canvas from 'html2canvas';
import { getFinancials } from '@/lib/get-financials';
import { translations, type Translations } from '@/lib/translations';


interface ForecastContextType {
  inputs: EngineInput;
  setInputs: React.Dispatch<React.SetStateAction<EngineInput>>;
  financials: { data: EngineOutput | null; inputs: EngineInput | null; error: string | null; } | null;
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
  isCopilotOpen: boolean;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  locale: 'en' | 'de';
  setLocale: React.Dispatch<React.SetStateAction<'en' | 'de'>>;
  t: Translations['en']; // The actual translation object
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

const initialInputs: EngineInput = {
  company: {
    brand: 'Plaza',
    logoDataUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjYwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzI2MyA1OS4wMDAxVjMxLjM3MDNIMzguOTY4MVYyMy4xNDQxSDI1LjcyNjNWMTEuODg4MUg0MS4xNTM5VjMuNjYxODhIMTYuMTYyNVY1OS4wMDAxSDI1LjcyNjNaTTYwLjU0MjUgNTkuMDAwMUg2OS4zOTk4TDQ4LjQxMyAzLjY2MTg4SDM4LjkwNTZMNjAuNTQyNSA1OS4wMDAxWiIgZmlsbD0iIzM5NEU5OSIvPgo8cGF0aCBkPSJNODEuMjA1MiA1OS4wMDAxTDcyLjM0OCAzLjY2MTg4SDgzLjUyOTJMNzcuMTcyMiAzMi44NDYzTDg4LjQzOCAzLjY2MTg4SDk3LjUzODJMODMuNjE4IDU5LjAwMDFIODEuMjA1MloiIGZpbGw9IiMzOTRFOzkiLz4KPHBhdGggZD0iTTEyMC4zODMgNTkuMDAwMVYzLjY2MTg4SDExMy4xNDRMOTcuNDQxOCAyMy45MDY1VjU5LjAwMDFIODcuODc4MVYzLjY2MTg4SDEwNC40NjRMMTIwLjM4MyAyMy4zNDQ1VjU5LjAwMDFIMTIwLjM4M1oiIGZpbGw9IiMzOTRFOzkiLz4KPHBhdGggZD0iTTIxMC41NDggNTkuMDAwMUwyMTkuNDA1IDMuNjYxODhIMjA4LjIyNEwyMDIuODY4IDMyLjg0NjNMMTkxLjYwMiAzLjY2MTg4SDE4Mi41MDJMMjk2LjQyNCA1OS4wMDAxSDIxMC41NDhaIiBmaWxsPSIjMzk0RTk5Ii8+CjxwYXRoIGQ9Ik0xNjcuNzI0IDMuNjYxODhMMTQzLjQ4MyA1OS4wMDAxSDEzMi4zMDJMMTU2LjUxMiAzLjY2MTg4SDE2Ny43MjRaTTE1NSA2MDMgMTcuNjgzOUwxNDkuMTU4IDMyLjg0NjNMMTYyLjI5IDE3LjY4MzlIMTU1LjYwM1oiIGZpbGw9IiMzOTRFOzkiLz4KPHBhdGggZD0iTTI0NS40ODUgNTkuMDAwMUgyNTQuMzQyTDIzMy4zNTYgMy42NjE4OEgyMjMuODQ5TDI0NS40ODUgNTkuMDAwMVoiIGZpbGw9IiMzOTRFOzkiLz4KPHBhdGggZD0iTTI0NS42OTIgMjMuMTQ0MUwyMjQuMzc4IDIzLjE0NDFMMjMyLjU0NiA2LjQxMDQ0QzIzNy43NjMgNi40MTA0NCAyNDQuMjc2IDYuNDEwNDQgMjQ1LjY5MiAyMy4xNDQxWiIgZmlsbD0iIzY2RTFGNyIvPgo8cGF0aCBkPSJNNjAuNjA0NyA1Ni4zNDE2TDczLjEwMjIgNTYuMzQxNkw2Ni44NjUgNDcuMzYyN0M2NC40NTUgNDkuOTUzNyA2MS4zMzMgNTMuNjE1IDYwLjYwNDcgNTYuMzQxNloiIGZpbGw9IiM2NkUxRjciLz4KPHBhdGggZD0iTTE2OC4wNzYgNi40Nzc4TDE0Ny42NjUgNTYuMzQxNkgxMzkuMzgxTDE2MC42NDYgNi40Nzc4SDE2OC4wNzZaIiBmaWxsPSIjNjZFMRY3Ii8+CjxwYXRoIGQ9Ik0xOC43NDcgNTYuMzQxNlYyNS43ODI4SDQwLjM4MzRWNTYuMzQxNkgxOC43NDdaIiBmaWxsPSIjNjZFMRY3Ii8+CjxwYXRoIGQ9Ik04OS45NzM0IDU2LjM0MTZMOTkuNTQ2OCAzLjY2MTg4SDgxLjU1NjJMNzQuOTc2MSAyMy4zNDQ1TDg4LjM2NzYgNTYuMzQxNkg4OS45NzM0WiIgZmlsbD0iIzY2RTFGNyIvPgo8cGF0aCBkPSJNMTA2LjM1NCA1Ni4zNDE2TDEyNC4zNDUgNy40MTUyOFY1Ni4zNDE2SDEwNi4zNTRaIiBmaWxsPSIjNjZFMRY3Ii8+CjxwYXRoIGQ9Ik0yMDUuNTM2IDM1LjE0NTFMMTkzLjIwOCA2LjQ3NzhIMTg5LjMyNkwyMDIuOTg5IDM1LjE0NTFIMjA1LjUzNloiIGZpbGw9IiM2NkUxRjciLz4KPHBhdGggZD0iTTIyMS4yOCA1Ni4zNDE2SDI1Ny4yODdMMjM2Ljk3NSA2LjQ3NzhIMjAxLjk2OEwyMjEuMjggNTYuMzQxNloiIGZpbGw9IiM2NkUxRjciLz4KPC9zdmc+Cg==',
    teamSize: '2-5',
    stage: 'launch',
    production: 'preorder',
    industry: 'fashion',
  },
  products: [
    {
      id: 'prod_hoodie',
      productName: 'Hoodie',
      plannedUnits: 100,
      unitCost: 45,
      sellPrice: 120,
      sellThrough: 90,
      depositPct: 25,
      salesModel: 'launch',
      costModel: 'batch',
      color: '#6b7280',
    },
    {
      id: 'prod_shorts',
      productName: 'Shorts',
      plannedUnits: 150,
      unitCost: 30,
      sellPrice: 80,
      sellThrough: 75,
      salesModel: 'seasonal',
      costModel: 'batch',
      color: '#a1a1aa',
    },
     {
      id: 'prod_shirts',
      productName: 'Shirts',
      plannedUnits: 100,
      unitCost: 15,
      sellPrice: 40,
      sellThrough: 85,
      depositPct: 25,
      salesModel: 'even',
      costModel: 'batch',
      color: '#d4d4d8',
    },
  ],
  fixedCosts: [
      { id: 'fc_0', name: 'Marketing', amount: 2000, paymentSchedule: 'monthly_from_m0', costType: 'Total for Period', color: '#4ADE80' },
      { id: 'fc_1', name: 'Equip', amount: 600, paymentSchedule: 'up_front_m0', costType: 'Total for Period', color: '#F59E0B' },
      { id: 'fc_2', name: 'Overhead + Software', amount: 100, paymentSchedule: 'monthly_from_m0', costType: 'Monthly Cost', color: '#A78BFA' },
  ],
  parameters: {
    forecastMonths: 12,
    taxRate: 20,
    currency: 'EUR',
    accountingMethod: 'total_costs',
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
  const [financials, setFinancials] = useState<{ data: EngineOutput | null; inputs: EngineInput | null; error: string | null; } | null>(null);
  const [proactiveAnalysis, setProactiveAnalysis] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [locale, setLocale] = useState<'en' | 'de'>('en');
  const { toast } = useToast();
  
  const t = useMemo(() => translations[locale], [locale]);

  useEffect(() => {
    try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            const parsedDraft = JSON.parse(savedDraft);
            const result = EngineInputSchema.safeParse(parsedDraft);
            if (result.success) {
                setInputs(result.data);
                toast({
                    title: t.toasts.draftLoadedTitle,
                    description: t.toasts.draftLoadedDescription,
                });
            } else {
                 console.warn("Could not parse saved draft, starting fresh.", result.error);
                 localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
    } catch (e) {
        console.error("Failed to load draft from local storage", e);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [toast, t]);
  
  useEffect(() => {
    setFinancials(getFinancials());
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
      paymentSchedule: 'monthly_from_m0',
      costType: 'Monthly Cost',
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
        const result = EngineInputSchema.safeParse(inputs);
        if (!result.success) {
            toast({
                variant: "destructive",
                title: t.toasts.saveErrorTitle,
                description: t.toasts.saveErrorDescription,
            });
            return;
        }

        const dataToSave = JSON.stringify(inputs);
        localStorage.setItem(DRAFT_STORAGE_KEY, dataToSave);
        toast({
            title: t.toasts.draftSavedTitle,
            description: t.toasts.draftSavedDescription,
        });
    } catch (e) {
        console.error("Failed to save draft", e);
        toast({
            variant: "destructive",
            title: t.toasts.saveFailedTitle,
            description: t.toasts.saveFailedDescription,
        });
    }
  };
  
  const runProactiveAnalysis = () => {
    const analysisQuestion = "Review the completed forecast on the screen for financial clarity, dependency mistakes, and UI/UX issues. Be concise.";
    setProactiveAnalysis(analysisQuestion);
  }
  
  const value = useMemo(() => ({
    inputs,
    setInputs,
    financials,
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
    isCopilotOpen,
    setIsCopilotOpen,
    locale,
    setLocale,
    t,
  }), [inputs, financials, proactiveAnalysis, isCopilotOpen, locale, t]);

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
