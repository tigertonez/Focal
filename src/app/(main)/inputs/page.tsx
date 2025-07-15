
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, Loader2, Info } from 'lucide-react';
import type { Product, FixedCostItem } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold font-headline">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

const InputField: React.FC<{
  label: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  tooltip?: string;
}> = ({ label, id, value, onChange, type = 'text', placeholder, required, tooltip }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
    <Label htmlFor={id} className="font-medium text-sm flex items-center gap-2">
      {label} {required && <span className="text-destructive">*</span>}
      {tooltip && (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      )}
    </Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="md:col-span-2 text-base"
    />
  </div>
);


const SelectField: React.FC<{
  label: string;
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, id, value, onValueChange, children, required }) => (
     <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        <Label htmlFor={id} className="font-medium text-sm">
            {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="md:col-span-2">
            <Select onValueChange={onValueChange} value={value}>
                <SelectTrigger id={id}><SelectValue /></SelectTrigger>
                <SelectContent>{children}</SelectContent>
            </Select>
        </div>
    </div>
);


const ProductForm: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const { updateProduct, removeProduct } = useForecast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    if (isNaN(finalValue as number) && type === 'number') return;
    updateProduct(index, name as keyof Product, finalValue);
  };

  const handleSelectChange = (name: keyof Product) => (value: string) => {
    updateProduct(index, name, value);
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4 relative">
       <button onClick={() => removeProduct(product.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
          <Trash2 size={18} />
       </button>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`productName-${index}`} className="text-sm font-medium">Product / Service Name</Label>
                <Input id={`productName-${index}`} name="productName" value={product.productName} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., Premium T-Shirt" />
            </div>
             <div>
                <Label htmlFor={`plannedUnits-${index}`} className="text-sm font-medium">Planned Units</Label>
                <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., 5000" />
            </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">Unit Cost</Label>
                <Input id={`unitCost-${index}`} name="unitCost" type="number" value={product.unitCost} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., 15.50" />
            </div>
            <div>
                <Label htmlFor={`sellPrice-${index}`} className="text-sm font-medium">Sell Price</Label>
                <Input id={`sellPrice-${index}`} name="sellPrice" type="number" value={product.sellPrice} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., 49.99" />
            </div>
       </div>
       <div>
            <Label htmlFor={`salesModel-${index}`} className="text-sm font-medium">Sales Model</Label>
            <Select onValueChange={handleSelectChange('salesModel')} value={product.salesModel}>
                <SelectTrigger id={`salesModel-${index}`} className="mt-2 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="even">Even</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
            </Select>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`sellThrough-${index}`} className="text-sm font-medium">Sell-Through %</Label>
                <Input id={`sellThrough-${index}`} name="sellThrough" type="number" value={product.sellThrough} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., 85" />
            </div>
            <div>
                <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium">Deposit Paid %</Label>
                <Input id={`depositPct-${index}`} name="depositPct" type="number" value={product.depositPct} onChange={handleChange} className="mt-2 text-base" placeholder="e.g., 25" />
            </div>
       </div>
    </div>
  );
};

const FixedCostForm: React.FC<{ cost: FixedCostItem; index: number }> = ({ cost, index }) => {
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


export default function InputsPage() {
  const { 
      inputs, 
      setInputs, 
      addProduct,
      addFixedCost,
      saveDraft, 
      calculateForecast, 
      loading, 
      isFormValid 
    } = useForecast();

  const handleParamChange = (section: 'parameters' | 'realtime') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    let finalValue: string | number | boolean = value;
     if (type === 'checkbox') {
        finalValue = checked;
    } else if (type === 'number') {
        finalValue = value === '' ? '' : parseFloat(value);
        if (isNaN(finalValue as number)) return;
    }
    setInputs(prev => ({ ...prev, [section]: { ...prev[section], [id]: finalValue } }));
  };

  const handleSelectChange = (section: 'parameters' | 'realtime') => (id: string) => (value: string) => {
    setInputs(prev => ({ ...prev, [section]: { ...prev[section], [id]: value } }));
  };

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Input Sheet</h1>
          <p className="text-muted-foreground mt-1">Define your forecast assumptions</p>
        </header>

        <div className="space-y-6">
          <Section title="Products & Services">
            <div className="space-y-4">
                {inputs.products.map((p, i) => (
                    <ProductForm key={p.id} product={p} index={i} />
                ))}
            </div>
            <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
              <PlusCircle className="mr-2" size={16} /> Add Product / Service
            </Button>
          </Section>

          <Section title="Fixed Costs">
            <div className="space-y-3">
                {inputs.fixedCosts.map((cost, i) => (
                    <FixedCostForm key={cost.id} cost={cost} index={i} />
                ))}
            </div>
             <Button variant="outline" onClick={addFixedCost} className="w-full border-dashed mt-4">
                <PlusCircle className="mr-2" size={16} /> Add Fixed Cost
            </Button>
          </Section>

          <Section title="General Parameters">
             <InputField label="Forecast Months" id="forecastMonths" type="number" value={inputs.parameters.forecastMonths} onChange={handleParamChange('parameters')} tooltip="How many months into the future to forecast." />
             <InputField label="Tax Rate %" id="taxRate" type="number" value={inputs.parameters.taxRate} onChange={handleParamChange('parameters')} tooltip="Your estimated corporate tax rate." />
             <InputField label="Planning Buffer %" id="planningBuffer" type="number" value={inputs.parameters.planningBuffer} onChange={handleParamChange('parameters')} tooltip="A safety buffer added to total fixed costs." />
             <SelectField label="Currency" id="currency" value={inputs.parameters.currency} onValueChange={handleSelectChange('parameters')('currency')}>
                 <SelectItem value="EUR">EUR</SelectItem>
                 <SelectItem value="USD">USD</SelectItem>
             </SelectField>
             <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <Label htmlFor="preOrder" className="font-medium text-sm">Pre-Order Mode</Label>
                <div className="md:col-span-2 flex items-center">
                    <Switch id="preOrder" checked={inputs.parameters.preOrder} onCheckedChange={(checked) => setInputs(prev => ({ ...prev, parameters: { ...prev.parameters, preOrder: checked } }))} />
                </div>
            </div>
          </Section>

           <Section title="Realtime Settings">
                <SelectField label="Data Source" id="dataSource" value={inputs.realtime.dataSource} onValueChange={handleSelectChange('realtime')('dataSource')}>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Shopify">Shopify</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                </SelectField>
                <InputField label="API Key" id="apiKey" type="password" value={inputs.realtime.apiKey || ''} onChange={handleParamChange('realtime')} placeholder="Optional" />
                <InputField label="Timezone" id="timezone" value={inputs.realtime.timezone} onChange={handleParamChange('realtime')} />
           </Section>
        </div>

        <footer className="flex justify-end items-center gap-4 mt-8 pt-6">
            <Button variant="outline" onClick={saveDraft} style={{height: '44px', padding: '0 24px'}}>
                Save Draft
            </Button>
            <Button 
                onClick={calculateForecast} 
                disabled={!isFormValid || loading}
                style={{height: '44px', padding: '0 24px'}}
            >
                {loading ? <Loader2 className="mr-2 animate-spin" /> : null}
                Calculate Forecast
            </Button>
        </footer>
      </main>
    </div>
  );
}
