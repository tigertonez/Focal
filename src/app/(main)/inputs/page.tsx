
'use client';

import React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
}> = ({ label, id, value, onChange, type = 'text', placeholder, required }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
    <Label htmlFor={id} className="font-medium text-sm">
      {label} {required && <span className="text-destructive">*</span>}
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
                <Label htmlFor={`productName-${index}`} className="text-sm font-medium">Product / SKU</Label>
                <Input id={`productName-${index}`} name="productName" value={product.productName} onChange={handleChange} className="mt-2 text-base" />
            </div>
             <div>
                <Label htmlFor={`plannedUnits-${index}`} className="text-sm font-medium">Planned Units</Label>
                <Input id={`plannedUnits-${index}`} name="plannedUnits" type="number" value={product.plannedUnits} onChange={handleChange} className="mt-2 text-base" />
            </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">Unit Cost</Label>
                <Input id={`unitCost-${index}`} name="unitCost" type="number" value={product.unitCost} onChange={handleChange} className="mt-2 text-base" />
            </div>
            <div>
                <Label htmlFor={`sellPrice-${index}`} className="text-sm font-medium">Sell Price</Label>
                <Input id={`sellPrice-${index}`} name="sellPrice" type="number" value={product.sellPrice} onChange={handleChange} className="mt-2 text-base" />
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
                <Input id={`sellThrough-${index}`} name="sellThrough" type="number" value={product.sellThrough} onChange={handleChange} className="mt-2 text-base" />
            </div>
            <div>
                <Label htmlFor={`depositPct-${index}`} className="text-sm font-medium">Deposit Paid %</Label>
                <Input id={`depositPct-${index}`} name="depositPct" type="number" value={product.depositPct} onChange={handleChange} className="mt-2 text-base" />
            </div>
       </div>
    </div>
  );
};


export default function InputsPage() {
  const { inputs, setInputs, addProduct, saveDraft, calculateForecast, loading, isFormValid } = useForecast();

  const handleInputChange = (section: 'fixedCosts' | 'parameters' | 'realtime') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value);
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
          <Section title="Products">
            <div className="space-y-4">
                {inputs.products.map((p, i) => (
                    <ProductForm key={p.id} product={p} index={i} />
                ))}
            </div>
            <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
              <PlusCircle className="mr-2" size={16} /> Add Product
            </Button>
          </Section>

          <Section title="Fixed Costs">
            <InputField label="Samples / Prototypes" id="samples" type="number" value={inputs.fixedCosts.samples} onChange={handleInputChange('fixedCosts')} />
            <InputField label="Equipment" id="equipment" type="number" value={inputs.fixedCosts.equipment} onChange={handleInputChange('fixedCosts')} />
            <InputField label="Setup & Compliance" id="setup" type="number" value={inputs.fixedCosts.setup} onChange={handleInputChange('fixedCosts')} />
            <InputField label="Marketing Budget" id="marketing" type="number" value={inputs.fixedCosts.marketing} onChange={handleInputChange('fixedCosts')} />
          </Section>

          <Section title="General Parameters">
             <InputField label="Forecast Months" id="forecastMonths" type="number" value={inputs.parameters.forecastMonths} onChange={handleInputChange('parameters')} />
             <InputField label="Tax Rate %" id="taxRate" type="number" value={inputs.parameters.taxRate} onChange={handleInputChange('parameters')} />
             <InputField label="Planning Buffer %" id="planningBuffer" type="number" value={inputs.parameters.planningBuffer} onChange={handleInputChange('parameters')} />
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
                <InputField label="API Key" id="apiKey" type="password" value={inputs.realtime.apiKey || ''} onChange={handleInputChange('realtime')} placeholder="Optional" />
                <InputField label="Timezone" id="timezone" value={inputs.realtime.timezone} onChange={handleInputChange('realtime')} />
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
