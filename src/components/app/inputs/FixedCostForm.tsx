
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Info } from 'lucide-react';
import type { FixedCostItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
    const { updateFixedCost, removeFixedCost } = useForecast();

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

    const schedule = cost.paymentSchedule || 'Up-Front';
    const name = cost.name.toLowerCase();
    const isSpecialCost = name.includes('marketing');
    const isPlanningBuffer = name.includes('planning buffer');
    const planningBufferTooltip = "A contingency fund for unexpected costs. Typically 10-15% of total fixed costs.";


    return (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
             <div className="flex items-start gap-4">
                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                         <Input
                            name="name"
                            value={cost.name}
                            onChange={handleChange}
                            placeholder="Cost Name (e.g., Salaries)"
                            className="text-base"
                        />
                         {isPlanningBuffer && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>{planningBufferTooltip}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input
                            name="amount"
                            type="number"
                            value={cost.amount}
                            onChange={handleChange}
                            placeholder="Amount"
                            className="text-base"
                        />
                         <Select onValueChange={handleSelectChange('paymentSchedule')} value={schedule}>
                            <SelectTrigger><SelectValue placeholder="Payment Schedule" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Up-Front">Up-Front</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                {isSpecialCost && <SelectItem value="According to Sales">According to Sales</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
    );
};
