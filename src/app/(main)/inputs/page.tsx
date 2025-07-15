
'use client';

import { useForecast } from '@/context/ForecastContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { type Product } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <Card className="shadow-sm ring-1 ring-gray-200/50 border-none">
    <CardHeader>
      <CardTitle className="font-headline text-lg">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const InputField: React.FC<{ label: string; path: string; type?: string; placeholder?: string; children?: React.ReactNode }> = ({ label, path, type = 'text', placeholder, children }) => {
  const { inputs, updateInput } = useForecast();
  
  // Lodash get could be used here for safer deep access
  const value = path.split(/[.\[\]]/).filter(Boolean).reduce((o, k) => o?.[k], inputs) ?? '';

  return (
    <div className="space-y-2">
      <Label htmlFor={path} className="text-xs font-medium">{label}</Label>
      {children ? children : (
        <Input
          id={path}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => updateInput(path, type === 'number' ? e.target.valueAsNumber || 0 : e.target.value)}
          className="text-base"
        />
      )}
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
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


export default function InputsPage() {
  const { inputs, addProduct, saveAndCalculate, loading } = useForecast();

  return (
    <div className="relative h-screen flex flex-col">
       <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white border-b">
        <div>
            <h1 className="text-xl font-bold font-headline">Input Sheet</h1>
            <p className="text-sm text-muted-foreground">Define your forecast assumptions</p>
        </div>
        <Button onClick={saveAndCalculate} disabled={loading} className="font-bold">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save & Calculate
        </Button>
       </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 md:p-8 space-y-8">
            <SectionCard title="Products" description="Add all products for this forecast.">
                <div className="space-y-4">
                    {inputs.products.map((p, i) => (
                        <ProductCard key={p.id} product={p} index={i} />
                    ))}
                    <Button variant="outline" onClick={addProduct} className="w-full border-dashed">
                        <PlusCircle className="mr-2" size={16} /> Add Product
                    </Button>
                </div>
            </SectionCard>

            <SectionCard title="Fixed Costs">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="Samples / Prototypes" path="fixedCosts.samplesOrPrototypes" type="number" />
                    <InputField label="Equipment" path="fixedCosts.equipment" type="number" />
                    <InputField label="Setup & Compliance" path="fixedCosts.setupAndCompliance" type="number" />
                    <InputField label="Marketing Budget" path="fixedCosts.marketingBudget" type="number" />
                </div>
            </SectionCard>

            <SectionCard title="Parameters">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <InputField label="Forecast (Months)" path="parameters.forecastMonths" type="number" />
                    <InputField label="Tax Rate (%)" path="parameters.taxRate" type="number" />
                    <InputField label="Planning Buffer (%)" path="parameters.planningBufferPct" type="number" />
                    <div className="space-y-2">
                        <Label htmlFor="parameters.currency" className="text-xs font-medium">Currency</Label>
                        <Select
                            value={inputs.parameters.currency}
                            onValueChange={(value) => updateInput('parameters.currency', value)}
                        >
                            <SelectTrigger id="parameters.currency"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                            <Switch id="parameters.preOrderMode" checked={inputs.parameters.preOrderMode} onCheckedChange={(val) => updateInput('parameters.preOrderMode', val)} />
                            <Label htmlFor="parameters.preOrderMode" className="text-xs font-medium">Pre-Order Mode</Label>
                        </div>
                    </div>
                </div>
            </SectionCard>

             <SectionCard title="Realtime Settings">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="realtime.dataSource" className="text-xs font-medium">Data Source</Label>
                        <Select
                            value={inputs.realtime.dataSource}
                            onValueChange={(value) => updateInput('realtime.dataSource', value)}
                        >
                            <SelectTrigger id="realtime.dataSource"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="google_sheets">Google Sheets</SelectItem>
                                <SelectItem value="shopify">Shopify</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <InputField label="API Key" path="realtime.apiKeyEncrypted" type="password" placeholder="••••••••••••••••" />
                    <InputField label="Timezone" path="realtime.timezone" />
                     <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                            <Switch id="realtime.llmAssistToggle" checked={inputs.realtime.llmAssistToggle} onCheckedChange={(val) => updateInput('realtime.llmAssistToggle', val)} />
                            <Label htmlFor="realtime.llmAssistToggle" className="text-xs font-medium">LLM Assist</Label>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
      </ScrollArea>
    </div>
  );
}
