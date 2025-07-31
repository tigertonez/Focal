

'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/ui/form';


export const SelectField: React.FC<{
  name: string;
  label: string;
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  tooltip?: string;
  className?: string;
}> = ({ name, label, children, layout = 'horizontal', tooltip, className }) => {
  const { control } = useFormContext();

  const renderSelect = (field: any) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger id={name}><SelectValue /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );

  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
          {label}
           {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-xs p-3"><p>{tooltip}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Controller name={name} control={control} render={({ field }) => renderSelect(field)} />
        <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null}/>
      </div>
    );
  }
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 items-center gap-4", className)}>
      <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-xs p-3"><p>{tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <div className="md:col-span-2">
        <Controller name={name} control={control} render={({ field }) => renderSelect(field)} />
      </div>
      <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <p className="md:col-start-2 md:col-span-2 text-sm text-destructive">{fieldState.error.message}</p> : null}/>
    </div>
  );
};
