
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { FixedCostForm } from '@/components/app/inputs/FixedCostForm';
import { ProductForm } from '@/components/app/inputs/ProductForm';
import { InputField } from '@/components/app/inputs/InputField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

const SelectField: React.FC<{
  label: string;
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ label, id, value, onValueChange, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
    <Label htmlFor={id} className="font-medium text-sm">
      {label}
    </Label>
    <div className="md:col-span-2">
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  </div>
);


export default function InputsPage() {
  const {
    inputs,
    setInputs,
    addProduct,
    addFixedCost,
    saveDraft,
    calculateForecast,
    loading,
  } = useForecast();

  const handleParamChange = (section: 'parameters' | 'realtime' ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    let finalValue: string | number | boolean = value;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : parseFloat(value);
      if (isNaN(finalValue as number)) return;
    }
    setInputs(prev => ({ ...prev, [section]: { ...prev[section], [id]: finalValue } }));
  };

  const handleSelectChange = (section: 'parameters' | 'realtime') => (id: string) => (value: string) => {
    setInputs(prev => ({ ...prev, [section]: { ...prev[section], [id]: value } }));
  };

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Input Sheet</h1>
          <p className="text-muted-foreground mt-1">Define your forecast assumptions</p>
        </header>

        <div className="space-y-6">
          <Section title="Products & Services">
            <div className="space-y-4">
              {inputs.products.map((p, i) => (
                <ProductForm key={p.id} product={p} index={i} />
              ))}
            </div>
            <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
              <PlusCircle className="mr-2" size={16} /> Add Product / Service
            </Button>
          </Section>

          <Section title="Fixed Costs">
            <div className="space-y-3">
              {inputs.fixedCosts.map((cost, i) => (
                <FixedCostForm key={cost.id} cost={cost} index={i} />
              ))}
            </div>
            <Button variant="outline" onClick={addFixedCost} className="w-full border-dashed mt-4">
              <PlusCircle className="mr-2" size={16} /> Add Fixed Cost
            </Button>
          </Section>

          <Section title="General Parameters">
            <InputField label="Forecast Months" id="forecastMonths" type="number" value={inputs.parameters.forecastMonths} onChange={handleParamChange('parameters')} tooltip="How many months into the future to forecast." />
            <InputField label="Tax Rate %" id="taxRate" type="number" value={inputs.parameters.taxRate} onChange={handleParamChange('parameters')} tooltip="Your estimated corporate tax rate." />
            <SelectField label="Currency" id="currency" value={inputs.parameters.currency} onValueChange={handleSelectChange('parameters')('currency')}>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectField>
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              <Label htmlFor="preOrder" className="font-medium text-sm">Pre-Order Mode</Label>
              <div className="md:col-span-2 flex items-center">
                <Switch id="preOrder" checked={inputs.parameters.preOrder} onCheckedChange={(checked) => setInputs(prev => ({ ...prev, parameters: { ...prev.parameters, preOrder: checked } }))} />
              </div>
            </div>
          </Section>

          <Section title="Realtime Settings">
            <SelectField label="Data Source" id="dataSource" value={inputs.realtime.dataSource} onValueChange={handleSelectChange('realtime')('dataSource')}>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Shopify">Shopify</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
            </SelectField>
            <InputField label="API Key" id="apiKey" type="password" value={inputs.realtime.apiKey || ''} onChange={handleParamChange('realtime')} placeholder="Optional" />
            <InputField label="Timezone" id="timezone" value={inputs.realtime.timezone} onChange={handleParamChange('realtime')} />
          </Section>
        </div>

        <footer className="flex justify-end items-center gap-4 mt-8 pt-6">
          <Button variant="outline" onClick={saveDraft} style={{ height: '44px', padding: '0 24px' }}>
            Save Draft
          </Button>
          <Button
            onClick={calculateForecast}
            disabled={loading}
            style={{ height: '44px', padding: '0 24px' }}
          >
            {loading ? <Loader2 className="mr-2 animate-spin" /> : null}
            Calculate Forecast
          </Button>
        </footer>
      </main>
    </div>
  );
}
