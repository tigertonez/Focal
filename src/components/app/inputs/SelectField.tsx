

'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';


export const SelectField: React.FC<{
  name: string;
  label: string;
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  tooltipTitle?: string;
  tooltip?: string;
  className?: string;
}> = ({ name, label, children, layout = 'horizontal', tooltipTitle, tooltip, className }) => {
  const { control } = useFormContext();
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

  const helpTrigger = (
    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
  );

  const renderTooltip = () => {
    if (!tooltip) return null;
    if (isMobile) {
      return (
        <Dialog>
          <DialogTrigger asChild>{helpTrigger}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tooltipTitle || label}</DialogTitle>
              <DialogDescription as="div" className="pt-2">{tooltip}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{helpTrigger}</TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
              <div className="space-y-1 text-left">
                  <p className="font-semibold">{tooltipTitle || label}</p>
                  <p className="text-muted-foreground text-xs">{tooltip}</p>
              </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  const renderSelect = (field: any) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger id={name}><SelectValue /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );

  const labelContent = (
    <>
      {label}
      {tooltip && renderTooltip()}
    </>
  );

  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
          {labelContent}
        </Label>
        <Controller name={name} control={control} render={({ field }) => renderSelect(field)} />
        <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null}/>
      </div>
    );
  }
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 items-center gap-4", className)}>
      <Label htmlFor={name} className="font-medium text-sm flex items-center gap-2">
        {labelContent}
      </Label>
      <div className="md:col-span-2">
        <Controller name={name} control={control} render={({ field }) => renderSelect(field)} />
      </div>
      <Controller name={name} control={control} render={({ fieldState }) => fieldState.error ? <p className="md:col-start-2 md:col-span-2 text-sm text-destructive">{fieldState.error.message}</p> : null}/>
    </div>
  );
};
