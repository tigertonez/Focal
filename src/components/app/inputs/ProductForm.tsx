
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

  const salesModelTooltip = `Defines how sales are distributed over the forecast period:
- Launch: 60/30/10 split over the first 3 months.
- Even: Distributed equally across all months.
- Seasonal: Bell-curve distribution, peaking mid-period.
- Growth: Linearly increasing sales month over month.`;
  
  const sellThroughTooltip = "The percentage of your planned units you expect to actually sell over the forecast period.";
  const depositPaidTooltip = "The percentage of the total production cost (Unit Cost * Planned Units) that you pay to your supplier upfront.";


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
                <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits} onChange={handleChange} className="text-sm pr-14" placeholder="e.g., 5000" />
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
                Sales Model
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent className="whitespace-pre-line text-xs max-w-xs"><p>{salesModelTooltip.trim()}</p></TooltipContent>
                </Tooltip>
                </TooltipProvider>
            </Label>
            <Select onValueChange={handleSelectChange('salesModel')} value={product.salesModel}>
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
              Sell-Through %
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p>{sellThroughTooltip}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </Label>
            <div className="relative">
                <Input id={`sellThrough-${index}`} name="sellThrough" type="number" value={product.sellThrough} onChange={handleChange} className="text-sm pr-6" placeholder="e.g., 85" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium flex items-center gap-2">
            Deposit Paid %
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p>{depositPaidTooltip}</p></TooltipContent>
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
