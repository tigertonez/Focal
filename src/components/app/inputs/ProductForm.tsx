
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Info } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const ProductForm: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const { updateProduct, removeProduct, inputs, t } = useForecast();
  const isManualMode = inputs.realtime.dataSource === 'Manual';
  const currency = inputs.parameters.currency;
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    if (isNaN(finalValue as number) && type === 'number') return;
    updateProduct(index, name as keyof Product, finalValue);
  };

  const handleSelectChange = (name: keyof Product) => (value: string | number) => {
    updateProduct(index, name, value);
  };
  
  const handleRadioChange = (name: keyof Product) => (value: string) => {
    updateProduct(index, name, value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProduct(index, 'color', e.target.value);
  };

  const assignedColor = getProductColor(product);
  
  const isLowVolume = product.plannedUnits !== undefined && product.plannedUnits >= 1 && product.plannedUnits <= 10;
  
  const timeline = Array.from({ length: inputs.parameters.forecastMonths }, (_, i) => i + 1);

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <div className="flex items-start gap-3">
            <div className="flex-grow space-y-2">
                 <Input
                    name="productName"
                    value={product.productName}
                    onChange={handleChange}
                    placeholder={t.inputs.products.productName}
                    className="text-sm px-2"
                />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <div 
                    className="h-5 w-5 rounded-full cursor-pointer border" 
                    style={{ backgroundColor: assignedColor }}
                    onClick={() => colorInputRef.current?.click()}
                >
                    <input 
                        ref={colorInputRef}
                        type="color"
                        value={assignedColor}
                        onChange={handleColorChange}
                        className="opacity-0 w-0 h-0 absolute"
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor={`plannedUnits-${index}`} className="text-sm font-medium">{t.inputs.products.plannedUnits}</Label>
                <div className="relative">
                    <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits || ''} onChange={handleChange} className="text-sm pr-14" placeholder="e.g., 5000" />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{t.inputs.products.units}</span>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">{t.inputs.products.unitCost}</Label>
                <div className="relative">
                    <Input id={`unitCost-${index}`} name="unitCost" type="number" value={product.unitCost} onChange={handleChange} className="text-sm pr-10" placeholder="e.g., 15.50" />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
                </div>
            </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
                <Label htmlFor={`sellPrice-${index}`} className="text-sm font-medium">{t.inputs.products.sellPrice}</Label>
                <div className="relative">
                    <Input id={`sellPrice-${index}`} name="sellPrice" type="number" value={product.sellPrice} onChange={handleChange} className="text-sm pr-10" placeholder="e.g., 49.99" />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium flex items-center gap-2">
                    {t.inputs.products.deposit}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs p-3">
                                <div className="space-y-1 text-left">
                                    <p className="font-semibold">{t.inputs.products.deposit}</p>
                                    <p className="text-muted-foreground text-xs">{t.inputs.products.depositTooltip}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Label>
                <div className="relative">
                    <Input id={`depositPct-${index}`} name="depositPct" type="number" value={product.depositPct} onChange={handleChange} className="text-sm pr-6" placeholder="e.g., 25" />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
                </div>
            </div>
        </div>
        
         <div className="space-y-3">
            <Label className="text-sm font-medium">{t.inputs.products.costModel.title}</Label>
            <RadioGroup 
                defaultValue={product.costModel || 'batch'} 
                onValueChange={handleRadioChange('costModel')}
                className="flex items-center gap-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="batch" id={`costModel-batch-${index}`} />
                    <Label htmlFor={`costModel-batch-${index}`} className="text-sm font-normal">{t.inputs.products.costModel.batch}</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id={`costModel-monthly-${index}`} />
                    <Label htmlFor={`costModel-monthly-${index}`} className="text-sm font-normal">{t.inputs.products.costModel.monthly}</Label>
                </div>
            </RadioGroup>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[68px] items-start">
            {isManualMode && isLowVolume && (
                 <>
                    <div className="space-y-2">
                        <Label htmlFor={`estimatedSales-${index}`} className="text-sm font-medium">{t.inputs.products.estimatedSales}</Label>
                        <div className="relative">
                            <Input id={`estimatedSales-${index}`} name="estimatedSales" type="number" value={product.estimatedSales || ''} onChange={handleChange} className="text-sm pr-14" placeholder="e.g., 3" />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{t.inputs.products.units}</span>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor={`saleMonth-${index}`} className="text-sm font-medium">{t.inputs.products.saleMonth}</Label>
                        <Select onValueChange={(v) => handleSelectChange('saleMonth')(parseInt(v))} value={String(product.saleMonth || 1)}>
                            <SelectTrigger id={`saleMonth-${index}`} className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {timeline.map(month => (
                                    <SelectItem key={month} value={String(month)}>Month {month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 </>
            )}
            
            {isManualMode && !isLowVolume && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor={`sellThrough-${index}`} className="text-sm font-medium flex items-center gap-2">
                        {t.inputs.products.sellThrough}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-3">
                                        <div className="space-y-1 text-left">
                                            <p className="font-semibold">{t.inputs.products.sellThrough}</p>
                                            <p className="text-muted-foreground text-xs">{t.inputs.products.sellThroughTooltip}</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <div className="relative">
                            <Input id={`sellThrough-${index}`} name="sellThrough" type="number" value={product.sellThrough || ''} onChange={handleChange} className="text-sm pr-6" placeholder="e.g., 85" />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`salesModel-${index}`} className="text-sm font-medium flex items-center gap-2">
                            {t.inputs.products.salesModel.title}
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3">
                                    <div className="space-y-1 text-left">
                                        <p className="font-semibold">{t.inputs.products.salesModel.title}</p>
                                        <p className="text-muted-foreground text-xs">{t.inputs.products.salesModel.tooltip}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Select onValueChange={handleSelectChange('salesModel')} value={product.salesModel || 'launch'}>
                            <SelectTrigger id={`salesModel-${index}`} className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="launch">{t.inputs.products.salesModel.launch}</SelectItem>
                            <SelectItem value="even">{t.inputs.products.salesModel.even}</SelectItem>
                            <SelectItem value="seasonal">{t.inputs.products.salesModel.seasonal}</SelectItem>
                            <SelectItem value="growth">{t.inputs.products.salesModel.growth}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};
