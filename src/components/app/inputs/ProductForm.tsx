
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    if (isNaN(finalValue as number) && type === 'number') return;
    updateProduct(index, name as keyof Product, finalValue);
  };

  const handleSelectChange = (name: keyof Product) => (value: string) => {
    updateProduct(index, name, value);
  };

  const salesModelTooltip = `
    Launch: 60/30/10 split over first 3 months.
    Even: Distributed equally across all months.
    Seasonal: Bell-curve distribution, peaking mid-period.
    Growth: Linearly increasing sales month over month.
  `;
  
  const sellThroughTooltip = "The percentage of your total planned units that you expect to actually sell over the forecast period.";
  const depositPaidTooltip = "The percentage of the total production cost that you pay to your supplier upfront as a deposit.";


  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4 relative">
      <button onClick={() => removeProduct(product.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
        <Trash2 size={18} />
      </button>
      
      <div>
        <Label htmlFor={`productName-${index}`} className="text-sm font-medium">Product / Service Name</Label>
        <Input id={`productName-${index}`} name="productName" value={product.productName} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., Premium T-Shirt" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isManualMode && (
          <div>
            <Label htmlFor={`plannedUnits-${index}`} className="text-sm font-medium">Planned Units</Label>
            <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., 5000" />
          </div>
        )}
        <div>
          <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">Unit Cost</Label>
          <Input id={`unitCost-${index}`} name="unitCost" type="number" value={product.unitCost} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., 15.50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`sellPrice-${index}`} className="text-sm font-medium">Sell Price</Label>
          <Input id={`sellPrice-${index}`} name="sellPrice" type="number" value={product.sellPrice} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., 49.99" />
        </div>
        {isManualMode && (
            <div>
            <Label htmlFor={`salesModel-${index}`} className="text-sm font-medium flex items-center gap-2">
                Sales Model
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent className="whitespace-pre-line text-xs"><p>{salesModelTooltip.trim()}</p></TooltipContent>
                </Tooltip>
                </TooltipProvider>
            </Label>
            <Select onValueChange={handleSelectChange('salesModel')} value={product.salesModel}>
                <SelectTrigger id={`salesModel-${index}`} className="mt-2 text-sm"><SelectValue /></SelectTrigger>
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
          <div>
            <Label htmlFor={`sellThrough-${index}`} className="text-sm font-medium flex items-center gap-2">
              Sell-Through %
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p>{sellThroughTooltip}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </Label>
            <Input id={`sellThrough-${index}`} name="sellThrough" type="number" value={product.sellThrough} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., 85" />
          </div>
        )}
        <div>
          <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium flex items-center gap-2">
            Deposit Paid %
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p>{depositPaidTooltip}</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
          </Label>
          <Input id={`depositPct-${index}`} name="depositPct" type="number" value={product.depositPct} onChange={handleChange} className="mt-2 text-sm" placeholder="e.g., 25" />
        </div>
      </div>
    </div>
  );
};
