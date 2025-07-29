

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SelectField: React.FC<{
  label: string;
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  tooltip?: string;
  className?: string;
}> = ({ label, id, value, onValueChange, children, layout = 'horizontal', tooltip, className }) => {
  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={id} className="font-medium text-sm flex items-center gap-2">
          {label}
           {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                    <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Select onValueChange={onValueChange} value={value}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
    );
  }
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 items-center gap-4", className)}>
      <Label htmlFor={id} className="font-medium text-sm">
        {label}{' '}
         {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                    <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
      </Label>
      <div className="md:col-span-2">
        <Select onValueChange={onValueChange} value={value}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
    </div>
  );
};

    