

'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode, useEffect, useCallback } from 'react';
import { type EngineInput, EngineInputSchema, type EngineOutput, type Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { calculateFinancials as calculateFinancialsEngine } from '@/lib/engine/financial-engine';
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
  setFinancials: React.Dispatch<React.SetStateAction<FinancialsState>>;
  calculateFinancials: (inputs: EngineInput) => EngineOutput;
  saveDraft: (inputs: EngineInput) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  proactiveAnalysis: string | null;
  setProactiveAnalysis: React.Dispatch<React.SetStateAction<string | null>>;
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
      unitCost: 35,
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
const REPORT_STORAGE_KEY = 'forecastReport';

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [inputs, setInputs] = useState<EngineInput>(initialInputs);
  const [financials, setFinancials] = useState<FinancialsState>({ data: null, error: null, isLoading: true });
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [proactiveAnalysis, setProactiveAnalysis] = useState<string | null>(null);
  const [locale, setLocale] = useState<'en' | 'de'>('en');
  const { toast } = useToast();
  
  const t = useMemo(() => translations[locale], [locale]);
  
  const [messages, setMessages] = useState<Message[]>([
      { role: 'bot', text: t.copilot.initial }
  ]);
  
  // This effect ensures the initial message for the copilot is always in the correct language.
  useEffect(() => {
    setMessages(currentMessages => {
        if (currentMessages.length === 1 && currentMessages[0].role === 'bot') {
            return [{ role: 'bot', text: t.copilot.initial }];
        }
        return currentMessages;
    });
  }, [t]);

  // This effect runs only on the client to restore state from localStorage without causing hydration errors.
  useEffect(() => {
    try {
      const savedReport = localStorage.getItem(REPORT_STORAGE_KEY);
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

      if (savedReport) {
        setFinancials({ data: JSON.parse(savedReport), error: null, isLoading: false });
      } else {
        setFinancials({ data: null, error: null, isLoading: false });
      }

      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        const result = EngineInputSchema.safeParse(parsedDraft);
        if (result.success) {
          setInputs(result.data);
        } else {
          console.warn("Could not parse saved draft, using initial data.", result.error);
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load state from local storage", e);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(REPORT_STORAGE_KEY);
      setFinancials({ data: null, error: null, isLoading: false });
    }
  }, []);

  const calculateFinancials = useCallback((currentInputs: EngineInput): EngineOutput => {
    const result = EngineInputSchema.safeParse(currentInputs);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'Invalid input.';
      throw new Error(firstError);
    }
    return calculateFinancialsEngine(result.data);
  }, []);

  const saveDraft = (currentInputs: EngineInput) => {
     try {
        const result = EngineInputSchema.safeParse(currentInputs);
        if (!result.success) {
            toast({
                variant: "destructive",
                title: t.toasts.saveErrorTitle,
                description: t.toasts.saveErrorDescription,
            });
            return;
        }

        const dataToSave = JSON.stringify(currentInputs);
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
    setFinancials,
    calculateFinancials,
    saveDraft,
    isCopilotOpen,
    setIsCopilotOpen,
    proactiveAnalysis,
    setProactiveAnalysis,
    messages,
    setMessages,
    locale,
    setLocale,
    t,
  }), [inputs, financials, calculateFinancials, isCopilotOpen, proactiveAnalysis, messages, locale, t]);

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
