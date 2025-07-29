

'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { useFinancials } from '@/hooks/useFinancials';
import { Button } from '@/components/ui/button';
import { PlusCircle, HelpCircle, Bot, Loader2, ChevronRight, Briefcase, Building, Wrench, Settings, Palette } from 'lucide-react';
import { FixedCostForm } from '@/components/app/inputs/FixedCostForm';
import { ProductForm } from '@/components/app/inputs/ProductForm';
import { InputField } from '@/components/app/inputs/InputField';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectField } from '@/components/app/inputs/SelectField';
import { SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/app/SectionHeader';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


const Section: React.FC<{ title: string; children: React.ReactNode; className?: string, icon?: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, className, icon, defaultOpen = false }) => (
    <Collapsible defaultOpen={defaultOpen} className={cn("space-y-4", className)}>
        <CollapsibleTrigger asChild>
            <div className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-left text-sm font-semibold shadow-sm hover:bg-muted/80 cursor-pointer">
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-1 pt-4">
          {children}
        </CollapsibleContent>
    </Collapsible>
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

  const handleParamChange = (section: 'parameters' | 'realtime' | 'company') => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSelectChange = (section: 'parameters' | 'realtime' | 'company') => (id: string) => (value: string) => {
    setInputs(prev => ({ ...prev, [section]: { ...prev[section], [id]: value } }));
  };
  
  const isManualMode = inputs.realtime.dataSource === 'Manual';

  return (
    <div className="bg-white min-h-screen">
      <main className="p-4 md:p-8">
        <SectionHeader title={t.inputs.title} description={t.inputs.description} />

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
             <Section title={t.inputs.products.title} icon={<Briefcase />} defaultOpen={true}>
                <div className="space-y-6">
                  {inputs.products.map((p, i) => (
                    <ProductForm key={p.id} product={p} index={i} />
                  ))}
                </div>
                <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
                  <PlusCircle className="mr-2" size={16} /> {t.inputs.products.addProduct}
                </Button>
            </Section>
            
            <Section title={t.inputs.fixedCosts.title} icon={<Building />} defaultOpen={true}>
              <div className="space-y-3">
                {inputs.fixedCosts.map((cost, i) => (
                  <FixedCostForm key={cost.id} cost={cost} index={i} />
                ))}
              </div>
              <Button variant="outline" onClick={addFixedCost} className="w-full border-dashed mt-4">
                <PlusCircle className="mr-2" size={16} /> {t.inputs.fixedCosts.addFixedCost}
              </Button>
            </Section>
            
            <Section title="Company Context" icon={<Wrench />}>
                 <InputField 
                    label="Brand Name"
                    id="brand" 
                    value={inputs.company?.brand || ''} 
                    onChange={handleParamChange('company')}
                    placeholder="e.g., Plaza"
                 />
                 <SelectField 
                    label="Industry"
                    id="industry"
                    value={inputs.company?.industry || 'fashion'}
                    onValueChange={handleSelectChange('company')('industry')}
                 >
                    <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="cosmetics">Cosmetics</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="digital">Digital Products</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                 </SelectField>
                 <SelectField 
                    label="Company Stage"
                    id="stage"
                    value={inputs.company?.stage || 'launch'}
                    onValueChange={handleSelectChange('company')('stage')}
                 >
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="launch">Pre-Launch / Launch</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                 </SelectField>
                 <SelectField 
                    label="Production Model"
                    id="production"
                    value={inputs.company?.production || 'preorder'}
                    onValueChange={handleSelectChange('company')('production')}
                 >
                    <SelectItem value="preorder">Pre-Order</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="ondemand">On-Demand</SelectItem>
                 </SelectField>
                 <SelectField 
                    label="Team Size"
                    id="teamSize"
                    value={inputs.company?.teamSize || '2-5'}
                    onValueChange={handleSelectChange('company')('teamSize')}
                 >
                    <SelectItem value="solo">Solo Founder</SelectItem>
                    <SelectItem value="2-5">2-5 Employees</SelectItem>
                    <SelectItem value="6-20">6-20 Employees</SelectItem>
                    <SelectItem value=">20">20+ Employees</SelectItem>
                 </SelectField>
                 <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Label htmlFor="brandColor" className="font-medium text-sm">Brand Color</Label>
                    <div className="md:col-span-2">
                        <Input id="brandColor" type="color" value={inputs.company?.brandColor || '#6750A4'} onChange={handleParamChange('company')} className="h-10 p-1" />
                    </div>
                </div>
            </Section>
            
            <Section title={t.inputs.parameters.title} icon={<Settings />}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
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
                     <SelectField 
                        label={t.inputs.parameters.accountingMethod.label}
                        id="accountingMethod"
                        value={inputs.parameters.accountingMethod || 'total_costs'} 
                        onValueChange={handleSelectChange('parameters')('accountingMethod')}
                        tooltip={t.inputs.parameters.accountingMethod.tooltip}
                        layout="vertical"
                    >
                      <SelectItem value="total_costs">{t.inputs.parameters.accountingMethod.total_costs}</SelectItem>
                      <SelectItem value="cogs">{t.inputs.parameters.accountingMethod.cogs}</SelectItem>
                    </SelectField>
                </div>
                <div className="grid grid-cols-1 items-start pt-4">
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
          </div>
          

          <Collapsible>
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                    <h2 className="text-base font-semibold">{t.inputs.realtime.title}</h2>
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
