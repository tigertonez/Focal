

"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency, formatNumber, getProductColor } from "@/lib/utils"
import { useForecast } from "@/context/ForecastContext"
import { generateCssId } from "@/lib/generate-css-id"

interface CostTimelineChartProps {
  data: any[];
  currency?: string;
  configOverrides?: Record<string, { label: string }>;
  formatAs?: 'currency' | 'number';
}

export function CostTimelineChart({ data, currency, configOverrides, formatAs = 'currency' }: CostTimelineChartProps) {
  const { inputs } = useForecast();
  
  const { chartConfig, costKeys } = React.useMemo(() => {
    const allItems = [...inputs.products, ...inputs.fixedCosts];
    const newConfig: ChartConfig = {};
    let allKeys: string[] = [];

    if (data && data.length > 0) {
      allKeys = Object.keys(data[0]).filter(key => key !== 'month');
      
      allKeys.forEach((key) => {
        const item = allItems.find(p => ('productName' in p ? p.productName : p.name) === key);
        const override = configOverrides ? configOverrides[key] : null;
        
        const cssId = generateCssId(key);
        
        newConfig[key] = { // Use the original key for lookup
          label: override?.label || key,
          color: `var(--color-${cssId})`, // Reference the CSS variable
        };

        if (item) {
          newConfig[key].color = `var(--color-${generateCssId(item.id)})`;
        }
      });
    }

    // This part is for the <style> tag generation
    const styleConfig: ChartConfig = {};
     [...inputs.products, ...inputs.fixedCosts].forEach(item => {
        const id = ('productName' in item) ? item.id : item.id;
        const cssId = generateCssId(id);
        styleConfig[cssId] = { color: getProductColor(item) };
    });

    return { chartConfig: {...styleConfig, ...newConfig}, costKeys: allKeys };
  }, [data, configOverrides, inputs.products, inputs.fixedCosts]);
  
  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }
  
  const valueFormatter = (value: number) => {
    if (formatAs === 'number') {
      return formatNumber(value);
    }
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency || 'USD').replace(/\.00$/, '');
  };
  
  const tooltipFormatter = (value: number, name: string) => {
    const formattedValue = formatAs === 'number' ? formatNumber(value) : formatCurrency(Number(value), currency || 'USD');
    return (
        <div className="flex items-center">
            <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartConfig[name]?.color }}/>
            <div className="flex flex-1 justify-between">
                <span>{chartConfig[name]?.label || name}</span>
                <span className="ml-4 font-bold">{formattedValue}</span>
            </div>
        </div>
    )
  };

  const chartData = data.map(monthData => {
      const newMonthData = {...monthData};
      newMonthData.month = `M${newMonthData.month}`;
      return newMonthData;
  });

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart 
        accessibilityLayer 
        data={chartData}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        stackOffset="sign"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => valueFormatter(Number(value))}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            labelFormatter={(label) => `Month ${label.replace('M','')}`}
            formatter={tooltipFormatter}
        />}
        />
        <ChartLegend />
        
        {costKeys.map((key) => {
            return (
               <Bar
                  key={key}
                  dataKey={key}
                  fill={chartConfig[key]?.color}
                  stackId="a"
                />
            )
        })}

      </BarChart>
    </ChartContainer>
  )
}
