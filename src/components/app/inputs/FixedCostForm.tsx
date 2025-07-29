
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, HelpCircle } from 'lucide-react';
import type { FixedCostItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductColor, cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
    const { updateFixedCost, removeFixedCost, inputs, t } = useForecast();
    const currency = inputs.parameters.currency;
    const colorInputRef = React.useRef<HTMLInputElement>(null);
    
    // State to detect mobile view for currency symbol
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const currencySymbol = isMobile ? (currency === 'EUR' ? '€' : '$') : currency;

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
    
    const schedule = cost.paymentSchedule || 'monthly_from_m0';
    const costType = cost.costType || 'Total for Period';
    
    const name = cost.name.toLowerCase();
    const isPlanningBuffer = name.includes('planning buffer');
    const planningBufferTitle = t.inputs.fixedCosts.planningBuffer;

    const assignedColor = React.useMemo(() => getProductColor(cost), [cost.id, cost.color, cost.name]);

    return (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
             <div className="flex items-start gap-3">
                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                         <Input
                            name="name"
                            value={cost.name}
                            onChange={handleChange}
                            placeholder={t.inputs.fixedCosts.costName}
                            className="text-sm"
                        />
                         {isPlanningBuffer && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-3">
                                      <div className="space-y-1 text-left">
                                          <p className="font-semibold">{planningBufferTitle}</p>
                                          <p className="text-muted-foreground text-xs">{t.inputs.fixedCosts.planningBuffer}</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                    <Label className="text-xs">{t.inputs.fixedCosts.amount}</Label>
                    <div className="relative">
                        <Input
                            name="amount"
                            type="number"
                            value={cost.amount}
                            onChange={handleChange}
                            placeholder={t.inputs.fixedCosts.amount}
                            className="text-sm pr-[140px]"
                        />
                        <span className="absolute inset-y-0 right-[108px] flex items-center pr-3 text-sm text-muted-foreground">{currencySymbol}</span>
                         <Select onValueChange={handleSelectChange('costType')} value={costType}>
                            <SelectTrigger className="absolute top-0 right-0 h-full w-[100px] text-xs bg-transparent border-l rounded-l-none px-2 text-muted-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Total for Period">{t.inputs.fixedCosts.total}</SelectItem>
                                <SelectItem value="Monthly Cost">{t.inputs.fixedCosts.perMonth}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">{t.inputs.fixedCosts.paymentSchedule.title}</Label>
                    <Select onValueChange={handleSelectChange('paymentSchedule')} value={schedule}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder={t.inputs.fixedCosts.paymentSchedule.title} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="up_front_m0">{t.inputs.fixedCosts.paymentSchedule.upFront}</SelectItem>
                            <SelectItem value="monthly_from_m0">{t.inputs.fixedCosts.paymentSchedule.monthly_from_m0}</SelectItem>
                            <SelectItem value="monthly_from_m1">{t.inputs.fixedCosts.paymentSchedule.monthly_from_m1}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
