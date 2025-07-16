
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Info } from 'lucide-react';
import type { FixedCostItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductColor, cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
    const { updateFixedCost, removeFixedCost, inputs } = useForecast();
    const currency = inputs.parameters.currency;
    const colorInputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number = value;
        if (type === 'number') {
            finalValue = value === '' ? '' : parseFloat(value);
            if (isNaN(finalValue as number)) return;
        }
        updateFixedCost(index, name as keyof FixedCostItem, finalValue);
    };
    
    const handleSelectChange = (name: keyof FixedCostItem) => (value: string) => {
        updateFixedCost(index, name, value);
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFixedCost(index, 'color', e.target.value);
    };

    const schedule = cost.paymentSchedule || 'Paid Up-Front';
    const costType = cost.costType || 'Total for Period';
    const startMonth = cost.startMonth || 'Month 1';
    
    const name = cost.name.toLowerCase();
    const isMarketingCost = name.includes('marketing');
    const isPlanningBuffer = name.includes('planning buffer');
    const isDynamicCost = isMarketingCost || isPlanningBuffer;
    const planningBufferTooltip = "A contingency fund for unexpected costs. Typically set at 10-20% of total fixed costs to provide a safety net for your forecast.";
    const planningBufferTitle = "What is a Planning Buffer?";
    
    // Determine if "Month 0" is possible based on global settings
    const hasMonthZero = inputs.parameters.preOrder || inputs.products.some(p => (p.depositPct || 0) > 0);

    const assignedColor = getProductColor(cost);

    return (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
             <div className="flex items-start gap-3">
                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                         <Input
                            name="name"
                            value={cost.name}
                            onChange={handleChange}
                            placeholder="Cost Name (e.g., Salaries)"
                            className="text-sm"
                        />
                         {isPlanningBuffer && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-3">
                                      <div className="space-y-1 text-left">
                                          <p className="font-semibold">{planningBufferTitle}</p>
                                          <p className="text-muted-foreground text-xs">{planningBufferTooltip}</p>
                                      </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
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
                    <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>
            
            <div className={cn(
                "grid grid-cols-2 md:grid-cols-5 gap-4 items-end",
            )}>
                <div className={cn("space-y-1", hasMonthZero ? "md:col-span-2" : "md:col-span-1")}>
                    <Label className="text-xs">Amount</Label>
                    <div className="relative">
                        <Input
                            name="amount"
                            type="number"
                            value={cost.amount}
                            onChange={handleChange}
                            placeholder="Amount"
                            className="text-sm pr-[140px]" // Padded right for currency + dropdown
                        />
                        <span className="absolute inset-y-0 right-[108px] flex items-center pr-3 text-sm text-muted-foreground">{currency}</span>
                         <Select onValueChange={handleSelectChange('costType')} value={costType}>
                            <SelectTrigger className="absolute top-0 right-0 h-full w-[100px] text-xs bg-transparent border-l rounded-l-none px-2 text-muted-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Total for Period">Total</SelectItem>
                                <SelectItem value="Monthly Cost">/ month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Payment Schedule</Label>
                    <Select onValueChange={handleSelectChange('paymentSchedule')} value={schedule}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Payment Schedule" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Paid Up-Front">Paid Up-Front</SelectItem>
                            <SelectItem value="Allocated Monthly">Allocated Monthly</SelectItem>
                            <SelectItem value="Allocated Quarterly">Allocated Quarterly</SelectItem>
                            <SelectItem value="Allocated According to Sales">Allocated According to Sales</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 {hasMonthZero && (
                    <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Start In</Label>
                        <Select 
                            onValueChange={handleSelectChange('startMonth')} 
                            value={startMonth}
                            disabled={schedule === 'Paid Up-Front'}
                        >
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Start Month" /></SelectTrigger>
                            <SelectContent>
                                {schedule === 'Paid Up-Front' && <SelectItem value="Up-front">Up-front (in M0)</SelectItem>}
                                <SelectItem value="Month 0">Month 0 Onward</SelectItem>
                                <SelectItem value="Month 1">Month 1 Onward</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 )}
            </div>
        </div>
    );
};
