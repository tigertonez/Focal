

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
        
        newConfig[cssId] = { // Use the safe CSS ID as the key
          label: override?.label || key,
          color: item ? getProductColor(item) : 'hsl(var(--muted-foreground))',
        };
      });
    }

    return { chartConfig: newConfig, costKeys: allKeys };
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
  
  const tooltipFormatter = (value: number) => {
    if (formatAs === 'number') {
        return formatNumber(value);
    }
    return formatCurrency(Number(value), currency || 'USD');
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
            formatter={(value, name, props) => {
               const cssId = generateCssId(props.dataKey as string);
               const itemConfig = chartConfig[cssId];
               return (
                <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
                    <div className="flex flex-1 justify-between">
                        <span>{itemConfig?.label}</span>
                        <span className="ml-4 font-bold">{tooltipFormatter(Number(value))}</span>
                    </div>
                </div>
              )
            }}
        />}
        />
        <ChartLegend content={<ChartLegendContent payload={Object.keys(chartConfig).map(key => ({
            value: chartConfig[key]?.label,
            color: chartConfig[key]?.color as string,
            dataKey: key
        }))} />} />
        
        {costKeys.map((key) => {
            const cssId = generateCssId(key);
            return (
               <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${cssId})`} // Use the safe CSS ID here
                  stackId="a"
                />
            )
        })}

      </BarChart>
    </ChartContainer>
  )
}
