

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

  useEffect(() => {
    methods.reset(initialInputs);
  }, [initialInputs, methods]);

  
  const isFreePlan = true; // This will be dynamic in the future

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/40 min-h-screen">
        <main className="p-4 md:p-8">
          <SectionHeader title={t.inputs.title} description={t.inputs.description} />

          <div className="space-y-6">
             <div className="grid grid-cols-1 gap-6 items-start">
                <Section 
                    title={t.inputs.products.title} 
                    icon={<Briefcase />} 
                    tooltip="Define all the products or services you plan to sell, including their costs, pricing, and sales models."
                    defaultOpen={true}
                >
                    <div className="space-y-6">
                      {productFields.map((field, index) => (
                        <ProductForm key={field.id} index={index} removeProduct={removeProduct} isFreePlan={isFreePlan} />
                      ))}
                    </div>
                    <Button variant="outline" type="button" onClick={handleAddProduct} className="w-full border-dashed mt-4">
                      <PlusCircle className="mr-2" size={16} /> {t.inputs.products.addProduct}
                    </Button>
                </Section>
              </div>

               {isFreePlan ? (
                  <Card className="p-6 text-center bg-muted/50 border-dashed">
                    <Sparkles className="mx-auto h-8 w-8 text-yellow-500" />
                    <h3 className="mt-2 text-lg font-semibold">Unlock Your Full Forecast</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Upgrade to Pro to add fixed costs, company context, and advanced parameters for a complete financial picture.
                    </p>
                    <Button className="mt-4">Upgrade to Pro</Button>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6">
                      <Section 
                          title={t.inputs.fixedCosts.title} 
                          icon={<Building />} 
                          tooltip="Add all recurring or one-time fixed costs that are not directly tied to production, such as salaries, rent, or marketing budgets."
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
                          title="Company Context" 
                          icon={<Wrench />}
                          tooltip="Provide general context about your business. This helps the AI tailor its analysis and advice to your specific situation."
                      >
                          <div className="space-y-4">
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
                          </div>
                      </Section>

                      <Section 
                          title={t.inputs.parameters.title} 
                          icon={<Settings />}
                          tooltip="Set the core financial and operational parameters for your forecast, such as the time horizon and tax rate."
                      >
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
                )}

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
