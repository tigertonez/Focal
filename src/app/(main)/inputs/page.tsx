
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { useFinancials } from '@/hooks/useFinancials';
import { Button } from '@/components/ui/button';
import { PlusCircle, HelpCircle, Bot, Loader2 } from 'lucide-react';
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
    t
  } = useForecast();

  const { getReport, isLoading } = useFinancials();

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

  return (
    <div className="bg-white min-h-screen">
      <main className="p-4 md:p-8">
        <SectionHeader title={t.inputs.title} description={t.inputs.description} />

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
             <Section title={t.inputs.products.title}>
                <div className="space-y-6">
                  {inputs.products.map((p, i) => (
                    <ProductForm key={p.id} product={p} index={i} />
                  ))}
                </div>
                <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
                  <PlusCircle className="mr-2" size={16} /> {t.inputs.products.addProduct}
                </Button>
            </Section>
            
            <Section title={t.inputs.fixedCosts.title}>
              <div className="space-y-3">
                {inputs.fixedCosts.map((cost, i) => (
                  <FixedCostForm key={cost.id} cost={cost} index={i} />
                ))}
              </div>
              <Button variant="outline" onClick={addFixedCost} className="w-full border-dashed mt-4">
                <PlusCircle className="mr-2" size={16} /> {t.inputs.fixedCosts.addFixedCost}
              </Button>
            </Section>
          </div>
          

          <Section title={t.inputs.parameters.title}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                 <InputField 
                    label={t.inputs.parameters.forecastMonths.label}
                    id="forecastMonths" 
                    type="number" 
                    value={inputs.parameters.forecastMonths} 
                    onChange={handleParamChange('parameters')} 
                    tooltip={t.inputs.parameters.forecastMonths.tooltip}
                    layout="vertical"
                />
                <InputField 
                    label={t.inputs.parameters.taxRate.label}
                    id="taxRate" 
                    type="number" 
                    value={inputs.parameters.taxRate} 
                    onChange={handleParamChange('parameters')} 
                    tooltip={t.inputs.parameters.taxRate.tooltip}
                    layout="vertical"
                />
                <SelectField 
                    label={t.inputs.parameters.currency}
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
                        {t.inputs.parameters.preOrder.title}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3">
                                  <div className="space-y-1 text-left">
                                      <p className="font-semibold">{t.inputs.parameters.preOrder.title}</p>
                                      <p className="text-muted-foreground text-xs">{t.inputs.parameters.preOrder.tooltip}</p>
                                  </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <div className="flex items-center pt-2 gap-2">
                        <Switch id="preOrder" checked={inputs.parameters.preOrder} onCheckedChange={(checked) => setInputs(prev => ({ ...prev, parameters: { ...prev.parameters, preOrder: checked } }))} />
                        {inputs.parameters.preOrder && <Badge variant="secondary">{t.inputs.parameters.preOrder.badge}</Badge>}
                    </div>
                </div>
            </div>
          </Section>
          
          <Collapsible>
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                    <h2 className="text-xl font-semibold">{t.inputs.realtime.title}</h2>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4 pl-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <SelectField label={t.inputs.realtime.dataSource} id="dataSource" value={inputs.realtime.dataSource} onValueChange={handleSelectChange('realtime')('dataSource')}>
                      <SelectItem value="Manual">{t.inputs.realtime.manual}</SelectItem>
                      <SelectItem value="Shopify" disabled>Shopify ({t.inputs.realtime.comingSoon})</SelectItem>
                      <SelectItem value="CSV" disabled>CSV Import ({t.inputs.realtime.comingSoon})</SelectItem>
                    </SelectField>
                    {!isManualMode && (
                        <>
                            <InputField label="API Key" id="apiKey" type="password" value={inputs.realtime.apiKey || ''} onChange={handleParamChange('realtime')} placeholder={t.inputs.realtime.apiKeyPlaceholder} />
                            <InputField label="Timezone" id="timezone" value={inputs.realtime.timezone} onChange={handleParamChange('realtime')} />
                        </>
                    )}
                </div>
             </CollapsibleContent>
          </Collapsible>
        </div>

        <footer className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button variant="outline" onClick={saveDraft}>
            {t.inputs.footer.saveDraft}
          </Button>
          
           <Button size="lg" className="w-48" onClick={getReport} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t.inputs.footer.getReport}
            </Button>
        </footer>
      </main>
    </div>
  );
}
