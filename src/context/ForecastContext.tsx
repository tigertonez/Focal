
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { calculateForecast } from '@/lib/engine';
import { type EngineInput, type EngineSettings, type EngineOutput } from '@/lib/types';
import sampleData from '@/../tests/sample-data.json'; // Use test data for initial scaffold

interface ForecastContextType {
  inputs: EngineInput | null;
  settings: EngineSettings | null;
  output: EngineOutput | null;
  loading: boolean;
  runForecast: (inputs: EngineInput, settings: EngineSettings) => void;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [inputs, setInputs] = useState<EngineInput | null>(null);
  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [output, setOutput] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const runForecast = (currentInputs: EngineInput, currentSettings: EngineSettings) => {
    setLoading(true);
    setInputs(currentInputs);
    setSettings(currentSettings);
    const forecastOutput = calculateForecast(currentInputs, currentSettings);
    setOutput(forecastOutput);
    setLoading(false);
  };
  
  // Initial run with sample data for scaffolding purposes
  useEffect(() => {
    runForecast(sampleData.inputs as EngineInput, sampleData.settings as EngineSettings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    inputs,
    settings,
    output,
    loading,
    runForecast,
  }), [inputs, settings, output, loading]);

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
