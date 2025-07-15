
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { FixedCostItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
    const { updateFixedCost, removeFixedCost, inputs } = useForecast();

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

    const handleSwitchChange = (name: keyof FixedCostItem) => (checked: boolean) => {
        updateFixedCost(index, name, checked);
    };

    const isMarketing = cost.name.toLowerCase().includes('marketing');
    const schedule = cost.paymentSchedule || 'Up-Front';

    return (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
             <div className="flex items-start gap-4">
                <div className="flex-grow space-y-2">
                    <Input
                        name="name"
                        value={cost.name}
                        onChange={handleChange}
                        placeholder="Cost Name (e.g., Salaries)"
                        className="text-base"
                    />
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
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {schedule === 'Custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="startMonth" type="number" value={cost.startMonth ?? ''} onChange={handleChange} placeholder="Start Month"/>
                            <Input name="endMonth" type="number" value={cost.endMonth ?? ''} onChange={handleChange} placeholder="End Month" />
                        </div>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 size={18} />
                </Button>
            </div>
             {isMarketing && (
                <div className="flex items-center space-x-2 pt-2 border-t border-muted-foreground/20">
                    <Switch
                        id={`linkToSales-${cost.id}`}
                        checked={cost.linkToSalesModel !== false}
                        onCheckedChange={handleSwitchChange('linkToSalesModel')}
                    />
                    <Label htmlFor={`linkToSales-${cost.id}`} className="text-sm font-medium">
                       Link to sales model
                    </Label>
                </div>
            )}
        </div>
    );
};
