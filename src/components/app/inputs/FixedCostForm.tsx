

'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductColor } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useForecast } from '@/context/ForecastContext';

export const FixedCostForm: React.FC<{ index: number; removeFixedCost: (index: number) => void; }> = ({ index, removeFixedCost }) => {
    const { control, watch } = useFormContext();
    const { t } = useForecast();
    
    const currency = watch('parameters.currency');
    const cost = watch(`fixedCosts.${index}`);
    const colorInputRef = React.useRef<HTMLInputElement>(null);
    const assignedColor = React.useMemo(() => getProductColor(cost), [cost]);

    // State to detect mobile view for currency symbol
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

    const currencySymbol = isMobile ? (currency === 'EUR' ? '€' : '$') : currency;

    const isPlanningBuffer = cost.name?.toLowerCase().includes('planning buffer');
    const planningBufferTitle = "Risikopuffer";
    const planningBufferTooltip = "Ein Notfallfonds für unerwartete Kosten. Typischerweise 10-20% der gesamten Fixkosten, um ein Sicherheitsnetz für Ihre Prognose zu schaffen.";

    return (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
             <div className="flex items-start gap-3">
                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                        <Controller
                            name={`fixedCosts.${index}.name`}
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder={t.inputs.fixedCosts.costName} className="text-sm font-semibold h-9" />
                            )}
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
                                          <p className="text-muted-foreground text-xs">{planningBufferTooltip}</p>
                                      </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <Controller
                        name={`fixedCosts.${index}.color`}
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFixedCost(index)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                    <Label className="text-xs">{t.inputs.fixedCosts.amount}</Label>
                    <div className="relative">
                        <Controller
                            name={`fixedCosts.${index}.amount`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    placeholder="0"
                                    className="text-sm pr-[140px]"
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />
                        <span className="absolute inset-y-0 right-[108px] flex items-center pr-3 text-sm text-muted-foreground">{currencySymbol}</span>
                        <Controller
                            name={`fixedCosts.${index}.costType`}
                            control={control}
                            defaultValue="Total for Period"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="absolute top-0 right-0 h-full w-[100px] text-xs bg-transparent border-l rounded-l-none px-2 text-muted-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Total for Period">{t.inputs.fixedCosts.total}</SelectItem>
                                        <SelectItem value="Monthly Cost">{t.inputs.fixedCosts.perMonth}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">{t.inputs.fixedCosts.paymentSchedule.title}</Label>
                    <Controller
                        name={`fixedCosts.${index}.paymentSchedule`}
                        control={control}
                        defaultValue="monthly_from_m0"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="text-sm"><SelectValue placeholder={t.inputs.fixedCosts.paymentSchedule.title} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="up_front_m0">{t.inputs.fixedCosts.paymentSchedule.upFront}</SelectItem>
                                    <SelectItem value="monthly_from_m0">{t.inputs.fixedCosts.paymentSchedule.monthly_from_m0}</SelectItem>
                                    <SelectItem value="monthly_from_m1">{t.inputs.fixedCosts.paymentSchedule.monthly_from_m1}</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};
