
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

export const ProductForm: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const { updateProduct, removeProduct, inputs } = useForecast();
  const isManualMode = inputs.realtime.dataSource === 'Manual';
  const currency = inputs.parameters.currency;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    if (isNaN(finalValue as number) && type === 'number') return;
    updateProduct(index, name as keyof Product, finalValue);
  };

  const handleSelectChange = (name: keyof Product) => (value: string) => {
    updateProduct(index, name, value);
  };

  const salesModelTooltip = `How sales are distributed over time. 'Launch' is front-loaded, 'Even' is stable, 'Seasonal' peaks mid-period, and 'Growth' increases steadily.`;
  const salesModelTitle = "What is a Sales Model?";
  
  const sellThroughTooltip = "The percentage of your total planned units that you expect to sell. A crucial driver for your revenue forecast.";
  const sellThroughTitle = "What is Sell-Through %?";
  
  const depositPaidTooltip = "The percentage of the total production cost you pay to your supplier up-front as a deposit. The rest is paid upon delivery.";
  const depositPaidTitle = "What is a Deposit?";


  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <div className="flex items-start gap-4">
            <div className="flex-grow space-y-2">
                 <Input
                    name="productName"
                    value={product.productName}
                    onChange={handleChange}
                    placeholder="Product / Service Name"
                    className="text-sm px-2"
                />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0 mt-1">
                <Trash2 size={18} />
            </Button>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isManualMode && (
          <div className="space-y-2">
            <Label htmlFor={`plannedUnits-${index}`} className="text-sm font-medium">Planned Units</Label>
            <div className="relative">
                <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits || ''} onChange={handleChange} className="text-sm pr-14" placeholder="e.g., 5000" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">units</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">Unit Cost</Label>
           <div className="relative">
                <Input id={`unitCost-${index}`} name="unitCost" type="number" value={product.unitCost} onChange={handleChange} className="text-sm pr-10" placeholder="e.g., 15.50" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor={`sellPrice-${index}`} className="text-sm font-medium">Sales Price</Label>
          <div className="relative">
                <Input id={`sellPrice-${index}`} name="sellPrice" type="number" value={product.sellPrice} onChange={handleChange} className="text-sm pr-10" placeholder="e.g., 49.99" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
          </div>
        </div>
        {isManualMode && (
            <div className="space-y-2">
            <Label htmlFor={`salesModel-${index}`} className="text-sm font-medium flex items-center gap-2">
                {salesModelTitle}
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                        <div className="space-y-1 text-left">
                            <p className="font-semibold">{salesModelTitle}</p>
                            <p className="text-muted-foreground text-xs">{salesModelTooltip}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
                </TooltipProvider>
            </Label>
            <Select onValueChange={handleSelectChange('salesModel')} value={product.salesModel || 'launch'}>
                <SelectTrigger id={`salesModel-${index}`} className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                <SelectItem value="launch">Launch</SelectItem>
                <SelectItem value="even">Even</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
            </Select>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isManualMode && (
          <div className="space-y-2">
            <Label htmlFor={`sellThrough-${index}`} className="text-sm font-medium flex items-center gap-2">
              {sellThroughTitle}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3">
                            <div className="space-y-1 text-left">
                                <p className="font-semibold">{sellThroughTitle}</p>
                                <p className="text-muted-foreground text-xs">{sellThroughTooltip}</p>
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
        )}
        <div className="space-y-2">
          <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium flex items-center gap-2">
            {depositPaidTitle}
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                     <TooltipContent className="max-w-xs p-3">
                        <div className="space-y-1 text-left">
                            <p className="font-semibold">{depositPaidTitle}</p>
                            <p className="text-muted-foreground text-xs">{depositPaidTooltip}</p>
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
    </div>
  );
};
