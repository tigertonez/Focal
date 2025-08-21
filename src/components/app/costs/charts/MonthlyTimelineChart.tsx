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
import { EngineInput } from "@/lib/types";

interface MonthlyTimelineChartProps {
  data: any[];
  currency?: string;
  formatAs?: 'currency' | 'number';
  isAnimationActive?: boolean;
  isPrint?: boolean;
  seriesKeys?: string[];
  inputs?: EngineInput;
}

export function MonthlyTimelineChart({ data, currency, formatAs = 'currency', isAnimationActive = true, isPrint = false, seriesKeys = [], inputs }: MonthlyTimelineChartProps) {
  
  const chartConfig = React.useMemo(() => {
    const newConfig: ChartConfig = {};
    if (!inputs || !seriesKeys) return newConfig;

    seriesKeys.forEach(key => {
        let name = key;
        let color;
        
        const product = inputs.products.find(p => p.id === key);
        const fixedCost = inputs.fixedCosts.find(fc => fc.name === key);
        
        if (product) {
            name = product.productName;
            color = getProductColor(product);
        } else if (fixedCost) {
            name = fixedCost.name;
            color = getProductColor(fixedCost);
        } else {
            color = getProductColor({ id: key, name: key });
        }

        newConfig[key] = {
            label: name,
            color: color,
        };
    });

    return newConfig;
  }, [seriesKeys, inputs]);
  
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
    const color = chartConfig[name]?.color;
    return (
        <div className="flex items-center">
            <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}/>
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
            cursor={!isPrint}
            wrapperStyle={isPrint ? { display: 'none' } : {}}
            content={<ChartTooltipContent 
              labelFormatter={(label) => `Month ${label.replace('M','')}`}
              formatter={tooltipFormatter}
          />}
          />
          <ChartLegend />
          
          {seriesKeys.map((key) => {
              const itemConfig = chartConfig[key];
              return (
                 <Bar
                    key={key}
                    dataKey={key}
                    fill={itemConfig?.color}
                    stackId="a"
                    name={itemConfig?.label || key}
                    barSize={20}
                    isAnimationActive={!isPrint}
                  />
              )
          })}

        </BarChart>
      </ChartContainer>
  )
}
