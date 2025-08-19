'use client';

import React, { useEffect } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { useFinancials } from '@/hooks/useFinancials';
import { Button } from '@/components/ui/button';
import { PlusCircle, HelpCircle, Bot, Loader2, ChevronRight, Briefcase, Building, Wrench, Settings, Palette, Upload, ShoppingCart, DollarSign, Percent, Zap, Sparkles } from 'lucide-react';
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
import { useForm, useFieldArray, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EngineInputSchema, type EngineInput } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePrintMode, signalWhenReady } from '@/lib/printMode';
import InputsSnapshot from '@/components/print/InputsSnapshot';


const Section: React.FC<{ title: string; children: React.ReactNode; className?: string, icon?: React.ReactNode, defaultOpen?: boolean, tooltip?: string, proFeature?: boolean }> = ({ title, children, className, icon, defaultOpen = false, tooltip, proFeature = false }) => (
    <Collapsible defaultOpen={defaultOpen} className={cn(className)}>
        <Card className="overflow-hidden group">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <CollapsibleTrigger className='w-full'>
                             <div className="flex w-full items-center justify-between p-6 cursor-pointer bg-card hover:bg-[#324E98] hover:text-white rounded-t-lg transition-colors duration-200">
                                <div className="flex items-center gap-3">
                                    {icon}
                                    <span className="font-semibold text-lg">{title}</span>
                                     {proFeature && <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">Pro</Badge>}
                                </div>
                                <ChevronRight className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                            </div>
                        </CollapsibleTrigger>
                    </TooltipTrigger>
                    {tooltip && (
                      <TooltipContent side="top" className="max-w-xs p-3">
                          <p className="text-muted-foreground text-xs">{tooltip}</p>
                      </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>

            <CollapsibleContent className="p-4 pt-4 bg-card">
                {children}
            </CollapsibleContent>
        </Card>
    </Collapsible>
);


function InputsPageContent() {
    const { inputs: initialInputs, setInputs, saveDraft, t } = useForecast();
    const { getReport, isLoading } = useFinancials();
  
    const methods = useForm<EngineInput>({
      resolver: zodResolver(EngineInputSchema),
      defaultValues: initialInputs,
      mode: 'onChange',
    });
  
    const { control, watch, handleSubmit, formState: { errors } } = methods;
  
    const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
      control,
      name: "products",
    });
  
    const { fields: fixedCostFields, append: appendFixedCost, remove: removeFixedCost } = useFieldArray({
      control,
      name: "fixedCosts",
    });
    
    const watchedInputs = watch();
    
    const onSubmit = (data: EngineInput) => {
      setInputs(data);
      getReport(data);
    };
  
    const handleSaveDraft = () => {
      saveDraft(watchedInputs);
    };
    
    const handleAddProduct = () => {
      appendProduct({
          id: `prod_${crypto.randomUUID()}`,
          productName: '',
          plannedUnits: 1000,
          unitCost: 10,
          sellPrice: 25,
          salesModel: 'launch',
          sellThrough: 80,
          depositPct: 0,
          costModel: 'batch',
      });
    };
    
    const handleAddFixedCost = () => {
      appendFixedCost({
        id: `fc_${crypto.randomUUID()}`,
        name: '',
        amount: 0,
        paymentSchedule: 'monthly_from_m0',
        costType: 'Monthly Cost',
      });
    };
  
    useEffect(() => {
      methods.reset(initialInputs);
    }, [initialInputs, methods]);
  
    return (
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/40 min-h-screen">
          <main className="p-4 md:p-8">
            <SectionHeader title={t.inputs.title} description={t.inputs.description} />
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-6">
                  <Section 
                      title={t.inputs.products.title} 
                      icon={<Briefcase />} 
                      defaultOpen={true}
                  >
                      <div className="space-y-6">
                        {productFields.map((field, index) => (
                          <ProductForm key={field.id} index={index} removeProduct={removeProduct} />
                        ))}
                      </div>
                      <Button variant="outline" type="button" onClick={handleAddProduct} className="w-full border-dashed mt-4">
                        <PlusCircle className="mr-2" size={16} /> {t.inputs.products.addProduct}
                      </Button>
                  </Section>
                  <Section 
                    title={t.inputs.fixedCosts.title} 
                    icon={<Building />} 
                    defaultOpen={true}
                >
                    <div className="space-y-3">
                      {fixedCostFields.map((field, index) => (
                        <FixedCostForm key={field.id} index={index} removeFixedCost={removeFixedCost} />
                      ))}
                    </div>
                    <Button variant="outline" type="button" onClick={handleAddFixedCost} className="w-full border-dashed mt-4">
                      <PlusCircle className="mr-2" size={16} /> {t.inputs.fixedCosts.addFixedCost}
                    </Button>
                </Section>
              </div>
              
              <div className="space-y-6">
                  <Section 
                      title={t.inputs.company.title} 
                      icon={<Wrench />}
                      defaultOpen={true}
                  >
                      <div className="space-y-4">
                          <InputField name="company.brand" label="Brand Name" placeholder="e.g., Plaza" />
                          <SelectField name="company.industry" label={t.inputs.company.industry.title} tooltipTitle={t.inputs.company.industry.title} tooltip={t.inputs.company.industry.tooltip}>
                              <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                              <SelectItem value="jewelry">Jewelry</SelectItem>
                              <SelectItem value="cosmetics">Cosmetics</SelectItem>
                              <SelectItem value="food">Food & Beverage</SelectItem>
                              <SelectItem value="digital">Digital Products</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                          </SelectField>
                          <SelectField name="company.stage" label={t.inputs.company.stage.title} tooltipTitle={t.inputs.company.stage.title} tooltip={t.inputs.company.stage.tooltip}>
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="launch">Pre-Launch / Launch</SelectItem>
                              <SelectItem value="growth">Growth</SelectItem>
                              <SelectItem value="scale">Scale</SelectItem>
                          </SelectField>
                          <SelectField name="company.production" label={t.inputs.company.production.title} tooltipTitle={t.inputs.company.production.title} tooltip={t.inputs.company.production.tooltip}>
                              <SelectItem value="preorder">Pre-Order</SelectItem>
                              <SelectItem value="stock">Stock</SelectItem>
                              <SelectItem value="ondemand">On-Demand</SelectItem>
                          </SelectField>
                          <SelectField name="company.teamSize" label={t.inputs.company.teamSize.title} tooltipTitle={t.inputs.company.teamSize.title} tooltip={t.inputs.company.teamSize.tooltip}>
                              <SelectItem value="solo">Solo Founder</SelectItem>
                              <SelectItem value="2-5">2-5 Employees</SelectItem>
                              <SelectItem value="6-20">6-20 Employees</SelectItem>
                              <SelectItem value=">20">20+ Employees</SelectItem>
                          </SelectField>
                      </div>
                  </Section>
  
                  <Section 
                      title={t.inputs.parameters.title} 
                      icon={<Settings />}
                      defaultOpen={true}
                  >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                          <InputField name="parameters.forecastMonths" label={t.inputs.parameters.forecastMonths.label} type="number" tooltipTitle={t.inputs.parameters.forecastMonths.label} tooltip={t.inputs.parameters.forecastMonths.tooltip} layout="vertical" />
                          <InputField name="parameters.taxRate" label={t.inputs.parameters.taxRate.label} type="number" tooltipTitle={t.inputs.parameters.taxRate.label} tooltip={t.inputs.parameters.taxRate.tooltip} layout="vertical" />
                          <SelectField name="parameters.currency" label={t.inputs.parameters.currency} layout="vertical">
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                          </SelectField>
                            <SelectField name="parameters.accountingMethod" label={t.inputs.parameters.accountingMethod.label} tooltipTitle={t.inputs.parameters.accountingMethod.label} tooltip={t.inputs.parameters.accountingMethod.tooltip} layout="vertical">
                            <SelectItem value="total_costs">{t.inputs.parameters.accountingMethod.total_costs}</SelectItem>
                            <SelectItem value="cogs">{t.inputs.parameters.accountingMethod.cogs}</SelectItem>
                          </SelectField>
                      </div>
                  </Section>
              </div>
            </div>
  
            <footer className="flex justify-between items-center mt-8 pt-6 border-t border-border/50" data-no-print="true">
              <Button variant="outline" type="button" onClick={handleSaveDraft}>
                {t.inputs.footer.saveDraft}
              </Button>
              
                <Button size="lg" className="w-48" type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t.inputs.footer.getReport}
                </Button>
            </footer>
          </main>
        </form>
      </FormProvider>
    );
  }

export default function InputsPage() {
    const { isPrint, lang } = usePrintMode();
    const { ensureForecastReady } = useForecast();

    React.useEffect(() => {
        if (!isPrint) return;
        (async () => {
            await signalWhenReady({ ensureForecastReady, root: document });
        })();
    }, [isPrint, ensureForecastReady]);

    return (
        <div data-report-root>
            {isPrint ? <InputsSnapshot /> : <InputsPageContent />}
        </div>
    );
}
