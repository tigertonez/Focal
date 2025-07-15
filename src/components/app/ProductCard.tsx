
'use client';

import { useForecast } from '@/context/ForecastContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { Product } from '@/lib/types';

const InputField: React.FC<{ label: string; path: string; type?: string; placeholder?: string; }> = ({ label, path, type = 'text', placeholder }) => {
  const { inputs, updateInput } = useForecast();
  
  const value = path.split(/[.\[\]]/).filter(Boolean).reduce((o, k) => o?.[k], inputs) ?? '';

  return (
    <div className="space-y-2">
      <Label htmlFor={path} className="text-xs font-medium">{label}</Label>
        <Input
          id={path}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => updateInput(path, type === 'number' ? e.target.valueAsNumber || 0 : e.target.value)}
          className="text-base"
        />
    </div>
  );
};


export const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const { removeProduct, updateInput } = useForecast();

  return (
    <div className="bg-white/60 p-4 rounded-lg space-y-4 relative ring-1 ring-black/5">
       <button onClick={() => removeProduct(product.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Product Name" path={`products[${index}].name`} placeholder="e.g. T-Shirt"/>
        <InputField label="SKU" path={`products[${index}].sku`} placeholder="e.g. TS-BLK-LG"/>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField label="Unit Cost" path={`products[${index}].unitCost`} type="number" />
        <InputField label="Sell Price" path={`products[${index}].sellPrice`} type="number" />
         <div className="space-y-2">
            <Label htmlFor={`products[${index}].strategy`} className="text-xs font-medium">Strategy</Label>
            <Select
              value={product.strategy}
              onValueChange={(value) => updateInput(`products[${index}].strategy`, value)}
            >
              <SelectTrigger id={`products[${index}].strategy`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="launch">Launch</SelectItem>
                <SelectItem value="lifter">Lifter</SelectItem>
                <SelectItem value="filler">Filler</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Sell-Through (%)" path={`products[${index}].sellThrough`} type="number" />
          <InputField label="Deposit Paid (%)" path={`products[${index}].depositPaid`} type="number" />
      </div>
    </div>
  );
};
