

'use client';

import React, { useEffect } from 'react';
import { useForecast } from '@/context/ForecastContext';
import { useFinancials } from '@/hooks/useFinancials';
import { Button } from '@/components/ui/button';
import { PlusCircle, HelpCircle, Bot, Loader2, ChevronRight, Briefcase, Building, Wrench, Settings, Palette, Upload, ShoppingCart, DollarSign, Percent, Zap } from 'lucide-react';
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


const Section: React.FC<{ title: string; children: React.ReactNode; className?: string, icon?: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, className, icon, defaultOpen = false }) => (
    <Collapsible defaultOpen={defaultOpen} className={cn(className)}>
        <Card>
            <CardContent className="p-0">
                <CollapsibleTrigger className='w-full'>
                    <div className="flex w-full items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                        <div className="flex items-center gap-3">
                            {icon}
                            <span className="font-semibold">{title}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 p-4 pt-0">
                    {children}
                </CollapsibleContent>
            </CardContent>
        </Card>
    </Collapsible>
);


export default function InputsPage() {
  const { inputs: initialInputs, setInputs, saveDraft, t } = useForecast();
  const { getReport, isLoading } = useFinancials();

  const methods = useForm<EngineInput>({
    resolver: zodResolver(EngineInputSchema),
    defaultValues: initialInputs,
    mode: 'onChange', // Validate on change to show errors sooner
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
    setInputs(watchedInputs);
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

  // This effect ensures that if the initialInputs from context are loaded from localStorage,
  // the form is reset to reflect those values.
  useEffect(() => {
    methods.reset(initialInputs);
  }, [initialInputs, methods]);

  
  const isManualMode = watchedInputs.realtime.dataSource === 'Manual';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/50 min-h-screen">
        <main className="p-4 md:p-8">
          <SectionHeader title={t.inputs.title} description={t.inputs.description} />

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <Section title={t.inputs.products.title} icon={<Briefcase />} defaultOpen={true}>
                    <div className="space-y-6">
                      {productFields.map((field, index) => (
                        <ProductForm key={field.id} index={index} removeProduct={removeProduct} />
                      ))}
                    </div>
                    <Button variant="outline" type="button" onClick={handleAddProduct} className="w-full border-dashed">
                      <PlusCircle className="mr-2" size={16} /> {t.inputs.products.addProduct}
                    </Button>
                </Section>
              
                <Section title={t.inputs.fixedCosts.title} icon={<Building />} defaultOpen={true}>
                    <div className="space-y-3">
                      {fixedCostFields.map((field, index) => (
                        <FixedCostForm key={field.id} index={index} removeFixedCost={removeFixedCost} />
                      ))}
                    </div>
                    <Button variant="outline" type="button" onClick={handleAddFixedCost} className="w-full border-dashed mt-4">
                      <PlusCircle className="mr-2" size={16} /> {t.inputs.fixedCosts.addFixedCost}
                    </Button>
                </Section>

                <Section title="Company Context" icon={<Wrench />}>
                    <InputField name="company.brand" label="Brand Name" placeholder="e.g., Plaza" />
                    <SelectField name="company.industry" label="Industry">
                        <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                        <SelectItem value="jewelry">Jewelry</SelectItem>
                        <SelectItem value="cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="digital">Digital Products</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectField>
                    <SelectField name="company.stage" label="Company Stage">
                        <SelectItem value="idea">Idea</SelectItem>
                        <SelectItem value="launch">Pre-Launch / Launch</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="scale">Scale</SelectItem>
                    </SelectField>
                    <SelectField name="company.production" label="Production Model">
                        <SelectItem value="preorder">Pre-Order</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="ondemand">On-Demand</SelectItem>
                    </SelectField>
                    <SelectField name="company.teamSize" label="Team Size">
                        <SelectItem value="solo">Solo Founder</SelectItem>
                        <SelectItem value="2-5">2-5 Employees</SelectItem>
                        <SelectItem value="6-20">6-20 Employees</SelectItem>
                        <SelectItem value=">20">20+ Employees</SelectItem>
                    </SelectField>
                </Section>

                <Section title={t.inputs.parameters.title} icon={<Settings />}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <InputField name="parameters.forecastMonths" label={t.inputs.parameters.forecastMonths.label} type="number" tooltip={t.inputs.parameters.forecastMonths.tooltip} layout="vertical" />
                        <InputField name="parameters.taxRate" label={t.inputs.parameters.taxRate.label} type="number" tooltip={t.inputs.parameters.taxRate.tooltip} layout="vertical" />
                        <SelectField name="parameters.currency" label={t.inputs.parameters.currency} layout="vertical">
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                        </SelectField>
                         <SelectField name="parameters.accountingMethod" label={t.inputs.parameters.accountingMethod.label} tooltip={t.inputs.parameters.accountingMethod.tooltip} layout="vertical">
                          <SelectItem value="total_costs">{t.inputs.parameters.accountingMethod.total_costs}</SelectItem>
                          <SelectItem value="cogs">{t.inputs.parameters.accountingMethod.cogs}</SelectItem>
                        </SelectField>
                    </div>
                </Section>

            </div>
          </div>

          <footer className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
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
