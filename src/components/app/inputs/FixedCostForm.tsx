
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { FixedCostItem } from '@/lib/types';

export const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
    const { updateFixedCost, removeFixedCost } = useForecast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number = value;
        if (type === 'number') {
            finalValue = value === '' ? '' : parseFloat(value);
            if (isNaN(finalValue)) return;
        }
        updateFixedCost(index, name as keyof FixedCostItem, finalValue);
    };

    return (
        <div className="flex items-center gap-4">
            <Input
                name="name"
                value={cost.name}
                onChange={handleChange}
                placeholder="Cost Name (e.g., Salaries)"
                className="text-base"
            />
            <Input
                name="amount"
                type="number"
                value={cost.amount}
                onChange={handleChange}
                placeholder="Amount"
                className="w-48 text-base"
            />
            <Button variant="ghost" size="icon" onClick={() => removeFixedCost(cost.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={18} />
            </Button>
        </div>
    );
};
