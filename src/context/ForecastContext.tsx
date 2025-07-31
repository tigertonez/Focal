
'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from 'react';
import { type EngineInput, EngineInputSchema, type Product, type FixedCostItem, type EngineOutput, type Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { calculateFinancials } from '@/lib/engine/financial-engine';
import { translations, type Translations } from '@/lib/translations';

interface FinancialsState {
  data: EngineOutput | null;
  error: string | null;
  isLoading: boolean;
}

interface ForecastContextType {
  inputs: EngineInput;
  setInputs: React.Dispatch<React.SetStateAction<EngineInput>>;
  financials: FinancialsState;
  calculateFinancials: () => void;
  updateProduct: (productIndex: number, field: keyof Product, value: any) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateFixedCost: (index: number, field: keyof FixedCostItem, value: any) => void;
  addFixedCost: () => void;
  removeFixedCost: (id: string) => void;
  saveDraft: () => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  locale: 'en' | 'de';
  setLocale: React.Dispatch<React.SetStateAction<'en' | 'de'>>;
  t: Translations['en'];
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

const initialInputs: EngineInput = {
  company: {
    brand: 'Plaza',
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
  const [financials, setFinancials] = useState<FinancialsState>({ data: null, error: null, isLoading: true });
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [locale, setLocale] = useState<'en' | 'de'>('en');
  const { toast } = useToast();
  
  const t = useMemo(() => translations[locale], [locale]);
  
  const [messages, setMessages] = useState<Message[]>([
      { role: 'bot', text: t.copilot.initial }
  ]);
  
  useEffect(() => {
    setMessages(currentMessages => {
        if (currentMessages.length === 1 && currentMessages[0].role === 'bot') {
            return [{ role: 'bot', text: t.copilot.initial }];
        }
        return currentMessages;
    });
  }, [t]);

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
    // Initial load should not be loading anymore
    setFinancials(prev => ({...prev, isLoading: false}));
  }, [toast, t]);

  const calculateFinancialsAndSetState = () => {
    setFinancials({ data: null, error: null, isLoading: true });
    try {
        const result = EngineInputSchema.safeParse(inputs);
        if (!result.success) {
            const firstError = result.error.errors[0]?.message || 'Invalid input.';
            throw new Error(firstError);
        }
        const calculatedData = calculateFinancials(result.data);
        setFinancials({ data: calculatedData, error: null, isLoading: false });
    } catch (e: any) {
        console.error("Error calculating financials:", e);
        setFinancials({ data: null, error: e.message || 'An unknown error occurred.', isLoading: false });
    }
  };

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
  
  const value = useMemo(() => ({
    inputs,
    setInputs,
    financials,
    calculateFinancials: calculateFinancialsAndSetState,
    updateProduct,
    addProduct,
    removeProduct,
    updateFixedCost,
    addFixedCost,
    removeFixedCost,
    saveDraft,
    isCopilotOpen,
    setIsCopilotOpen,
    messages,
    setMessages,
    locale,
    setLocale,
    t,
  }), [inputs, financials, isCopilotOpen, messages, locale, t]);

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
