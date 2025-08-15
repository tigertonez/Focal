

'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, HelpCircle, ShoppingCart, DollarSign, Percent, Zap, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductColor } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForecast } from '@/context/ForecastContext';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';


const FormSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Icon size={16} />
            <span>{title}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
            {children}
        </div>
    </div>
);


export const ProductForm: React.FC<{ index: number; removeProduct: (index: number) => void }> = ({ index, removeProduct }) => {
  const { control, watch } = useFormContext();
  const { t } = useForecast();
  
  const product = watch(`products.${index}`);
  const currency = watch('parameters.currency');
  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const assignedColor = getProductColor(product || {});
  
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    };
    if (typeof window !== 'undefined') {
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);
  
  const helpTrigger = (
    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
  );

  const renderTooltip = (title: string, description: string) => {
    if (isMobile) {
      return (
        <Dialog>
          <DialogTrigger asChild>{helpTrigger}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription as="div" className="pt-2">{description}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{helpTrigger}</TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-1 text-left">
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  const renderHelpIcon = (titleKey: keyof typeof t.inputs.products, tooltipKey: keyof typeof t.inputs.products) => {
      const title = t.inputs.products[titleKey].title;
      const tooltip = t.inputs.products[tooltipKey].tooltip;
      return renderTooltip(title, tooltip);
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <div className="flex items-start gap-3">
            <div className="flex-grow space-y-2">
                <Controller
                  name={`products.${index}.productName`}
                  control={control}
                  render={({ field }) => <Input {...field} placeholder={t.inputs.products.productName} className="text-sm font-semibold h-9" />}
                />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <Controller
                  name={`products.${index}.color`}
                  control={control}
                  render={({ field }) => (
                    <>
                        <div 
                            className="h-5 w-5 rounded-full cursor-pointer border" 
                            style={{ backgroundColor: assignedColor }}
                            onClick={() => colorInputRef.current?.click()}
                        />
                        <input 
                            ref={colorInputRef}
                            type="color"
                            value={field.value || '#ffffff'}
                            onChange={field.onChange}
                            className="opacity-0 w-0 h-0 absolute"
                        />
                    </>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
        
        <Separator />
        
        <FormSection title="Sales & Revenue" icon={DollarSign}>
             <div className="space-y-1">
                <Label htmlFor={`plannedUnits-${index}`} className="text-xs">{t.inputs.products.plannedUnits}</Label>
                <Controller
                    name={`products.${index}.plannedUnits`}
                    control={control}
                    render={({ field }) => (
                        <div className="relative">
                            <Input {...field} id={`plannedUnits-${index}`} type="number" className="text-sm pr-14" placeholder="e.g., 5000" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{t.inputs.products.units}</span>
                        </div>
                    )}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor={`sellPrice-${index}`} className="text-xs">{t.inputs.products.sellPrice}</Label>
                 <Controller
                    name={`products.${index}.sellPrice`}
                    control={control}
                    render={({ field }) => (
                        <div className="relative">
                            <Input {...field} id={`sellPrice-${index}`} type="number" className="text-sm pr-10" placeholder="e.g., 49.99" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
                        </div>
                    )}
                />
            </div>
        </FormSection>

        <Separator />
        <FormSection title="Costs & Margins" icon={ShoppingCart}>
              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 h-5">
                    <Label htmlFor={`unitCost-${index}`} className="text-xs">{t.inputs.products.unitCost}</Label>
                 </div>
                <Controller
                    name={`products.${index}.unitCost`}
                    control={control}
                    render={({ field }) => (
                        <div className="relative">
                            <Input {...field} id={`unitCost-${index}`} type="number" className="text-sm pr-10" placeholder="e.g., 15.50" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
                        </div>
                    )}
                />
            </div>
            <div className="space-y-1">
                 <div className="flex items-center gap-1.5 h-5">
                    <Label htmlFor={`depositPct-${index}`} className="text-xs">{t.inputs.products.deposit.title}</Label>
                    {renderHelpIcon('deposit', 'deposit')}
                </div>
                <Controller
                    name={`products.${index}.depositPct`}
                    control={control}
                    render={({ field }) => (
                        <div className="relative">
                            <Input {...field} id={`depositPct-${index}`} type="number" className="text-sm pr-6" placeholder="e.g., 25" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
                        </div>
                    )}
                />
            </div>
        </FormSection>

        <Separator />
        <FormSection title="Advanced Forecasting" icon={Zap}>
          <div className="space-y-1">
            <Label htmlFor={`sellThrough-${index}`} className="text-xs flex items-center gap-1.5">
                {t.inputs.products.sellThrough.title}
                {renderHelpIcon('sellThrough', 'sellThrough')}
            </Label>
            <Controller
                name={`products.${index}.sellThrough`}
                control={control}
                render={({ field }) => (
                  <div className="relative">
                      <Input {...field} id={`sellThrough-${index}`} type="number" className="text-sm pr-6" placeholder="e.g., 85" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
                  </div>
                )}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`salesModel-${index}`} className="text-xs flex items-center gap-1.5">
                {t.inputs.products.salesModel.title}
                {renderHelpIcon('salesModel', 'salesModel')}
            </Label>
            <Controller
                name={`products.${index}.salesModel`}
                control={control}
                defaultValue="launch"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id={`salesModel-${index}`} className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="launch">{t.inputs.products.salesModel.launch}</SelectItem>
                          <SelectItem value="even">{t.inputs.products.salesModel.even}</SelectItem>
                          <SelectItem value="seasonal">{t.inputs.products.salesModel.seasonal}</SelectItem>
                          <SelectItem value="growth">{t.inputs.products.salesModel.growth}</SelectItem>
                      </SelectContent>
                  </Select>
                )}
              />
          </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs flex items-center gap-1.5">
                  {t.inputs.products.costModel.title}
                  {renderHelpIcon('costModel', 'costModel')}
              </Label>
              <Controller
                name={`products.${index}.costModel`}
                control={control}
                defaultValue="batch"
                render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 h-9">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="batch" id={`costModel-batch-${index}`} />
                            <Label htmlFor={`costModel-batch-${index}`} className="text-sm font-normal cursor-pointer">{t.inputs.products.costModel.batch}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id={`costModel-monthly-${index}`} />
                            <Label htmlFor={`costModel-monthly-${index}`} className="text-sm font-normal cursor-pointer">{t.inputs.products.costModel.monthly}</Label>
                        </div>
                    </RadioGroup>
                )}
              />
            </div>
        </FormSection>
    </div>
  );
};
