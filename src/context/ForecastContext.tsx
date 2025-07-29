

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
    logoDataUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjYwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzI2MyA1OS4wMDAxVjMxLjM3MDNIMzguOTY4MVYyMy4xNDQxSDI1LjcyNjNWMTEuODg4MUg0MS4xNTM5VjMuNjYxODhIMTYuMTYyNVY1OS4wMDAxSDI1LjcyNjNaTTYwLjU0MjUgNTkuMDAwMUg2OS4zOTk4TDQ4LjQxMyAzLjY2MTg4SDM4LjkwNTZMNjAuNTQyNSA1OS4wMDAxWiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik04MS4yMDUyIDU5LjAwMDFMNzIuMzQ4IDMuNjYxODhIODMuNTI5Mkw3Ny4xNzIyIDMyLjg0NjNMODguNDM4IDMuNjYxODhIOTcuNTM4Mkw4My42MTggNTkuMDAwMUg4MS4yMDUyWiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik0xMjAuMzgzIDU5LjAwMDFWMy42NjE4OEgxMTMuMTQ0TDk3LjQ0MTggMjMuOTA2NVY1OS4wMDAxSDg3Ljg3ODFWMy42NjE4OEgxMDQuNDY0TDEyMC4zODMgMjMuMzQ0NVY1OS4wMDAxSDEyMC4zODNaIiBmaWxsPSJ1cmwoI3BhaW50Ml9saW5lYXJfMTAwXzEwNCkiLz4KPHBhdGggZD0iTTIxMC41NDggNTkuMDAwMUwyMTkuNDA1IDMuNjYxODhIMjA4LjIyNEwyMDIuODY4IDMyLjg0NjNMMTkxLjYwMiAzLjY2MTg4SDE4Mi41MDJMMjk2LjQyNCA1OS4wMDAxSDIxMC41NDhaIiBmaWxsPSJ1cmwoI3BhaW50M19saW5lYXJfMTAwXzEwNCkiLz4KPHBhdGggZD0iTTE2Ny43MjQgMy42NjE4OEwxNDMuNDgzIDU5LjAwMDFIMTMyLjMwMkwxNTYuNTEyIDMuNjYxODhIMTY3LjcyNFpNMTU1LjYwMyAxNy42ODM5TDE0OS4xNTggMzIuODQ2M0wxNjIuMjkgMTcuNjgzOUgxNTUuNjAzWiIgZmlsbD0idXJsKCNwYWludDRfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik0yNDUuNDg1IDU5LjAwMDFIMjU0LjM0MkwyMzMuMzU2IDMuNjYxODhIMjIzLjg0OUwyNDUuNDg1IDU5LjAwMDFaIiBmaWxsPSJ1cmwoI3BhaW50NV9saW5lYXJfMTAwXzEwNCkiLz4KPHBhdGggZD0iTTI0NS42OTIgMjMuMTQ0MUwyMjQuMzc4IDIzLjE0NDFMMjMyLjU0NiA2LjQxMDQ0QzIzNy43NjMgNi40MTA0NCAyNDQuMjc2IDYuNDEwNDQgMjQ1LjY5MiAyMy4xNDQxWiIgZmlsbD0idXJsKCNwYWludDZfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik02MC42MDQ3IDU2LjM0MTZMNzMuMTAyMiA1Ni4zNDE2TDY2Ljg2NSA0Ny4zNjI3QzY0LjQ1NSA0OS45NTM3IDYxLjMzMyA1My42MTUgNjAuNjA0NyA1Ni4zNDE2WiIgZmlsbD0idXJsKCNwYWludDdfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik0xNjguMDc2IDYuNDc3OEwxNDcuNjY1IDU2LjM0MTZIMTM5LjM4MkwxNjAuNjQ2IDYuNDc3OEgxNjguMDc2WiIgZmlsbD0idXJsKCNwYWludDhfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik0xOC43NDcgNTYuMzQxNlYyNS43ODI4SDQwLjM4MzRWNTYuMzQxNkgxOC43NDdaIiBmaWxsPSJ1cmwoI3BhaW50OV9saW5lYXJfMTAwXzEwNCkiLz4KPHBhdGggZD0iTTg5Ljk3MzQgNTYuMzQxNkw5OS41NDY4IDMuNjYxODhIODEuNTU2Mkw3NC45NzYxIDIzLjM0NDVMODguMzY3NiA1Ni4zNDE2SDg5Ljk3MzRaIiBmaWxsPSJ1cmwoI3BhaW50MTBfbGluZWFyXzEwMF8xMDQpIi8+CjxwYXRoIGQ9Ik0xMDYuMzU0IDU2LjM0MTZMMTI0LjM0NSA3LjQxNTI4VjU2LjM0MTZIMTA2LjM1NFoiIGZpbGw9InVybCgjcGFpbnQxMV9saW5lYXJfMTAwXzEwNCkiLz4KPHBhdGggZD0iTTIwNS41MzYgMzUuMTQ1MUwxOTMuMjA4IDYuNDc3OEgxODkuMzI2TDIwMi45ODkgMzUuMTQ1MUgyMDUuNTM2WiIgZmlsbD0idXJsKCNwYWludDEyX2xpbmVhcl8xMDBfMTA0KSIvPgo8cGF0aCBkPSJNMjIxLjI4IDU2LjM0MTZIMjU3LjI4N0wyMzYuOTc1IDYuNDc3OEgyMDEuOTY4TDIyMS4yOCA1Ni4zNDE2WiIgZmlsbD0idXJsKCNwYWludDEzX2xpbmVhcl8xMDBfMTA0KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzEwMF8xMDQiIHgxPSIyOC42NjU2IiB5MT0iMy42NjE4OCIgeDI9IjI4LjY2NTYiIHkyPSI1OS4wMDAxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyQjVFREYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjM0Q2Q0UzIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl8xMDBfMTA0IiB4MT0iODQuOTczNCIgeTE9IjMuNjYxODgiIHgyPSI4NC45NzM0IiB5Mj0iNTkuMDAwMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMkI1RURGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzNENkNFMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Ml9saW5lYXJfMTAwXzEwNCIgeDE9IjEwNC4xMyIgeTE9IjMuNjYxODgiIHgyPSIxMDQuMTMiIHkyPSI1OS4wMDAxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyQjVFREYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjM0Q2Q0UzIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQzX2xpbmVhcl8xMDBfMTA0IiB4MT0iMjAwLjQ3NCIgeTE9IjMuNjYxODgiIHgyPSIyMDAuNDc0IiB5Mj0iNTkuMDAwMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMkI1RURGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzNENkNFMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50NF9saW5lYXJfMTAwXzEwNCIgeDE9IjE1MC4wMjMiIHkxPSIzLjY2MTg4IiB4Mj0iMTUwLjAyMyIgeTI9IjU5LjAwMDEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzJCNUVERiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMzRDZDRTMiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDVfbGluZWFyXzEwMF8xMDQiIHgxPSIyMzkuMTE3IiB5MT0iMy42NjE4OCIgeDI9IjIzOS4xMTciIHkyPSI1OS4wMDAxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyQjVFREYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjM0Q2Q0UzIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ2X2xpbmVhcl8xMDBfMTA0IiB4MT0iMjM0Ljk1OCIgeTE9IjYuNDEwNDQiIHgyPSIzNC45NTgiIHkyPSIzLjE0NDEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzgwQ0JGNyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MzhFRjQiIHN0b3Atb3BhY2l0eT0iMC44NyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50N19saW5lYXJfMTAwXzEwNCIgeDE9IjY2Ljg1MzUiIHkxPSI0Ny4zNjI3IiB4Mj0iNjYuODUzNSIgeTI9IjU2LjM0MTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzgwQ0JGNyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MzhFRjQiIHN0b3Atb3BhY2l0eT0iMC44NyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50OF9saW5lYXJfMTAwXzEwNCIgeDE9IjE1My43MjkiIHkxPSI2LjQ3NzgiIHgyPSIxNTMuNzI5IiB5Mj0iNTYuMzQxNiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjODBDQkY3Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQzOEVGNCIgc3RvcC1vcGFjaXR5PSIwLjg3Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ5X2xpbmVhcl8xMDBfMTA0IiB4MT0iMjkuNTY1MiIgeTE9IjI1Ljc4MjgiIHgyPSIyOS41NjUyIiB5Mj0iNTYuMzQxNiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjODBDQkY3Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQzOEVGNCIgc3RvcC1vcGFjaXR5PSIwLjg3Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxMF9saW5lYXJfMTAwXzEwNCIgeDE9Ijg3Ljc2MjMiIHkxPSIzLjY2MTg4IiB4Mj0iODcuNzYyMyIgeTI9IjU2LjM0MTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzgwQ0JGNyIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MzhFRjQiIHN0b3Atb3BhY2l0eT0iMC44NyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MTFfbGluZWFyXzEwMF8xMDQiIHgxPSIxMTUuMzQ5IiB5MT0iNy40MTUyOCIgeDI9IjExNS4zNDkiIHkyPSI1Ni4zNDE2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4MENCRjciLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDM4RUY0IiBzdG9wLW9wYWNpdHk9IjAuODciLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDEyX2xpbmVhcl8xMDBfMTA0IiB4MT0iMTk3LjQyNyIgeTE9IjYuNDc3OCIgeDI9IjE5Ny40MjciIHkyPSIzNS4xNDUxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4MENCRjciLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDM4RUY0IiBzdG9wLW9wYWNpdHk9IjAuODciLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDEzX2xpbmVhcl8xMDBfMTA0IiB4MT0iMjI5LjYyOCIgeTE9IjYuNDc3OCIgeDI9IjIyOS42MjgiIHkyPSI1Ni4zNDE2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4MENCRjciLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDM4RUY0IiBzdG9wLW9wYWNpdHk9IjAuODciLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
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
