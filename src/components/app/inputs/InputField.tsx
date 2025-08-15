

'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/ui/form';

export const InputField: React.FC<{
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  tooltipTitle?: string;
  tooltip?: string;
  badge?: string;
  layout?: 'horizontal' | 'vertical';
}> = ({ name, label, type = 'text', placeholder, required, tooltipTitle, tooltip, badge, layout = 'horizontal' }) => {
  const { control } = useFormContext();

  const renderInput = (field: any) => (
    <Input
      {...field}
      type={type}
      placeholder={placeholder}
      className="text-sm flex-grow"
      onChange={e => {
          if (type === 'number') {
              field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value));
          } else {
              field.onChange(e.target.value);
          }
      }}
    />
  );
  
  if (layout === 'vertical') {
    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
          {label} {required && <span className="text-destructive">*</span>}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                    <div className="space-y-1 text-left">
                        <p className="font-semibold">{tooltipTitle || label}</p>
                        <p className="text-muted-foreground text-xs">{tooltip}</p>
                    </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Controller name={name} control={control} render={({ field }) => renderInput(field)} />
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null}/>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
      <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
        {label} {required && <span className="text-destructive">*</span>}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                  <div className="space-y-1 text-left">
                      <p className="font-semibold">{tooltipTitle || label}</p>
                      <p className="text-muted-foreground text-xs">{tooltip}</p>
                  </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <div className="md:col-span-2 flex items-center gap-2">
        <Controller name={name} control={control} render={({ field }) => renderInput(field)} />
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
       <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <p className="md:col-start-2 md:col-span-2 text-sm text-destructive">{fieldState.error.message}</p> : null}/>
    </div>
  );
};
