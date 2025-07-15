
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info, Bot } from 'lucide-react';
import { FixedCostForm } from '@/components/app/inputs/FixedCostForm';
import { ProductForm } from '@/components/app/inputs/ProductForm';
import { InputField } from '@/components/app/inputs/InputField';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectField } from '@/components/app/inputs/SelectField';
import { SelectItem } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/app/SectionHeader';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <section className={cn("space-y-4", className)}>
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);


export default function InputsPage() {
  const {
    inputs,
    setInputs,
    addProduct,
    addFixedCost,
    saveDraft,
    runProactiveAnalysis,
  } = useForecast();

  const handleParamChange = (section: 'parameters' | 'realtime' | 'fixedCosts') => (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const isManualMode = inputs.realtime.dataSource === 'Manual';
  const preOrderTooltip = "Enables a 'Month 0' for pre-launch costs (e.g., deposits) and revenue before the main forecast begins in Month 1.";

  return (
    <div className="bg-white min-h-screen">
      <main className="p-4 md:p-8">
        <SectionHeader title="Input Sheet" description="Define your forecast assumptions" />

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
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
          </div>
          

          <Section title="General Parameters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                 <InputField 
                    label="Forecast Months" 
                    id="forecastMonths" 
                    type="number" 
                    value={inputs.parameters.forecastMonths} 
                    onChange={handleParamChange('parameters')} 
                    tooltip="How many months into the future to forecast."
                    layout="vertical"
                />
                <InputField 
                    label="Tax Rate %" 
                    id="taxRate" 
                    type="number" 
                    value={inputs.parameters.taxRate} 
                    onChange={handleParamChange('parameters')} 
                    tooltip="Your estimated corporate tax rate."
                    layout="vertical"
                />
                <SelectField 
                    label="Currency" 
                    id="currency" 
                    value={inputs.parameters.currency} 
                    onValueChange={handleSelectChange('parameters')('currency')}
                    layout="vertical"
                >
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectField>
                <div className="space-y-2">
                    <Label htmlFor="preOrder" className="font-medium text-sm flex items-center gap-2">
                        Pre-Order Mode
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent><p>{preOrderTooltip}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <div className="flex items-center pt-2 gap-2">
                        <Switch id="preOrder" checked={inputs.parameters.preOrder} onCheckedChange={(checked) => setInputs(prev => ({ ...prev, parameters: { ...prev.parameters, preOrder: checked } }))} />
                        {inputs.parameters.preOrder && <Badge variant="secondary">+ Month 0</Badge>}
                    </div>
                </div>
            </div>
          </Section>
          
          <Collapsible>
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                    <h2 className="text-xl font-semibold">Realtime Settings</h2>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4 pl-6">
                <SelectField label="Data Source" id="dataSource" value={inputs.realtime.dataSource} onValueChange={handleSelectChange('realtime')('dataSource')}>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Shopify">Shopify</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectField>
                {!isManualMode && (
                    <>
                        <InputField label="API Key" id="apiKey" type="password" value={inputs.realtime.apiKey || ''} onChange={handleParamChange('realtime')} placeholder="Optional" />
                        <InputField label="Timezone" id="timezone" value={inputs.realtime.timezone} onChange={handleParamChange('realtime')} />
                    </>
                )}
             </CollapsibleContent>
          </Collapsible>
        </div>

        <footer className="flex justify-center items-center gap-4 mt-8 pt-6">
          <Button variant="outline" onClick={saveDraft}>
            Save Draft
          </Button>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={runProactiveAnalysis}>
                        <Bot className="mr-2" />
                        Review with AI
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Get an AI-powered review of your inputs.</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </footer>
      </main>
    </div>
  );
}
