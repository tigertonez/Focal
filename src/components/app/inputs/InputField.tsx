
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const InputField: React.FC<{
  label: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  tooltip?: string;
  badge?: string;
  layout?: 'horizontal' | 'vertical';
}> = ({ label, id, value, onChange, type = 'text', placeholder, required, tooltip, badge, layout = 'horizontal' }) => {

  if (layout === 'vertical') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="font-medium text-sm flex items-center gap-2">
          {label} {required && <span className="text-destructive">*</span>}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="text-sm flex-grow"
          />
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
      <Label htmlFor={id} className="font-medium text-sm flex items-center gap-2">
        {label} {required && <span className="text-destructive">*</span>}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
              <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <div className="md:col-span-2 flex items-center gap-2">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="text-sm flex-grow"
        />
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
    </div>
  );
};
