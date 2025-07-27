

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
  
  const { chartConfig, costKeys, styleContent } = React.useMemo(() => {
    const newConfig: ChartConfig = {};
    const styleLines: string[] = [];
    const allItems = [...inputs.products, ...inputs.fixedCosts, { id: 'Deposits', name: 'Deposits'}, { id: 'Final Payments', name: 'Final Payments'}];
    
    allItems.forEach(item => {
        const name = 'productName' in item ? item.productName : item.name;
        if (!name) return;

        const color = getProductColor(item);
        const cssId = generateCssId(name);
        
        newConfig[name] = {
          label: name,
          color: `var(--color-${cssId})`,
        };
        styleLines.push(`--color-${cssId}: ${color};`);
    });

    // Apply any specific overrides for things like units sold charts
    if (configOverrides) {
        Object.keys(configOverrides).forEach(key => {
            if (newConfig[key]) {
                newConfig[key].label = configOverrides[key].label;
            }
        });
    }

    const allKeys = (data && data.length > 0) ? Object.keys(data[0]).filter(key => key !== 'month') : [];

    return { 
        chartConfig: newConfig, 
        costKeys: allKeys,
        styleContent: `[data-chart] { ${styleLines.join(' ')} }`
    };
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
    return formatCurrency(Number(value), currency || 'USD', true);
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
    <>
      <style>{styleContent}</style>
      <ChartContainer config={chartConfig} className="h-full w-full" data-chart>
        <BarChart 
          accessibilityLayer 
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          stackOffset="sign"
          barCategoryGap="20%"
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
              const itemConfig = chartConfig[key];
              return (
                 <Bar
                    key={key}
                    dataKey={key}
                    fill={itemConfig?.color}
                    stackId="a"
                    name={itemConfig?.label || key}
                    barSize={20}
                  />
              )
          })}

        </BarChart>
      </ChartContainer>
    </>
  )
}
