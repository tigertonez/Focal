
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
import { colorFor, palette, seedPrintColorMap } from "@/lib/printColorMap";
import { EngineInput } from "@/lib/types";

interface MonthlyTimelineChartProps {
  data: any[];
  currency?: string;
  configOverrides?: Record<string, { label: string, color?: string }>;
  formatAs?: 'currency' | 'number';
  isAnimationActive?: boolean;
  isPrint?: boolean;
  seriesKeys?: string[];
  inputs?: EngineInput;
}

export function MonthlyTimelineChart({ data, currency, configOverrides, formatAs = 'currency', isAnimationActive = true, isPrint = false, seriesKeys = [], inputs }: MonthlyTimelineChartProps) {
  
  React.useEffect(() => {
    if (isPrint && seriesKeys.length > 0) {
      seedPrintColorMap(seriesKeys);
    }
  }, [isPrint, seriesKeys]);
  
  const p = palette();

  const chartConfig = React.useMemo(() => {
    const newConfig: ChartConfig = {};
    
    seriesKeys.forEach(key => {
        let color;
        if (inputs) {
            const product = inputs.products.find(p => p.productName === key);
            const fixedCost = inputs.fixedCosts.find(fc => fc.name === key);
            if (product) color = getProductColor(product);
            else if (fixedCost) color = getProductColor(fixedCost);
        }

        newConfig[key] = {
            label: configOverrides?.[key]?.label || key,
            color: color || colorFor(key),
        };
    });

    return newConfig;
  }, [seriesKeys, configOverrides, inputs]);
  
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
    const color = isPrint ? colorFor(name) : chartConfig[name]?.color;
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

  const legendWrapperStylePrint = { width:'100%', textAlign:'center', whiteSpace:'nowrap' } as const;

  return (
      <ChartContainer config={chartConfig} className="h-full w-full" data-chart>
        <BarChart 
          accessibilityLayer 
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          stackOffset="sign"
          barCategoryGap="20%"
        >
          <CartesianGrid vertical={false} stroke={isPrint ? p.grid : undefined} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            stroke={isPrint ? p.text : undefined}
            tick={isPrint ? { fill: p.text } : {}}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => valueFormatter(Number(value))}
            stroke={isPrint ? p.text : undefined}
            tick={isPrint ? { fill: p.text } : {}}
          />
          <ChartTooltip
            cursor={!isPrint}
            wrapperStyle={isPrint ? { display: 'none' } : {}}
            content={<ChartTooltipContent 
              labelFormatter={(label) => `Month ${label.replace('M','')}`}
              formatter={tooltipFormatter}
          />}
          />
          <ChartLegend {...(isPrint ? { layout: "horizontal", align: "center", verticalAlign: "bottom", wrapperStyle: legendWrapperStylePrint } : {})} />
          
          {seriesKeys.map((key) => {
              const itemConfig = chartConfig[key];
              return (
                 <Bar
                    key={key}
                    dataKey={key}
                    fill={isPrint ? colorFor(key) : itemConfig?.color}
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
