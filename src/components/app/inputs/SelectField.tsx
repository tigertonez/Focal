
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const SelectField: React.FC<{
  label: string;
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
}> = ({ label, id, value, onValueChange, children, layout = 'horizontal' }) => {
  if (layout === 'vertical') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="font-medium text-sm">
          {label}
        </Label>
        <Select onValueChange={onValueChange} value={value}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
      <Label htmlFor={id} className="font-medium text-sm">
        {label}{' '}
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
