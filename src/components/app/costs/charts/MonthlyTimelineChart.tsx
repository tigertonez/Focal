
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
import { formatCurrency, formatNumber } from "@/lib/utils"
import { useForecast } from "@/context/ForecastContext"
import { getPrintPalette, buildSeriesColorRegistry, legendWrapperStylePrint } from "@/lib/printColors"

interface MonthlyTimelineChartProps {
  data: any[];
  currency?: string;
  configOverrides?: Record<string, { label: string }>;
  formatAs?: 'currency' | 'number';
  isAnimationActive?: boolean;
}

export function MonthlyTimelineChart({ data, currency, configOverrides, formatAs = 'currency', isAnimationActive = true }: MonthlyTimelineChartProps) {
  const { inputs, t } = useForecast();
  const P = getPrintPalette();
  const isPrint = !isAnimationActive;
  
  const getColorForKey = React.useMemo(() => {
    if (!isPrint) return () => undefined;
    const costCategories = ['Deposits', 'Final Payments', ...inputs.fixedCosts.map(fc => fc.name)];
    return buildSeriesColorRegistry({
        products: inputs.products.map(p => p.productName),
        costCategories: costCategories,
    });
  }, [isPrint, inputs]);

  
  const { chartConfig, costKeys } = React.useMemo(() => {
    const newConfig: ChartConfig = {};
    const allKeys = (data && data.length > 0) ? Object.keys(data[0]).filter(key => key !== 'month' && data.some(d => d[key] > 0)) : [];
    
    allKeys.forEach((key) => {
        newConfig[key] = {
            label: key,
            color: isPrint ? getColorForKey(key) : `hsl(var(--${key}))`, // Fallback for non-print
        };
    });

    if (configOverrides) {
        Object.keys(configOverrides).forEach(key => {
            if (newConfig[key]) {
                newConfig[key].label = configOverrides[key].label;
            } else if (t.insights.charts[key as keyof typeof t.insights.charts]) {
                 newConfig[key] = { label: t.insights.charts[key as keyof typeof t.insights.charts] };
            }
        });
    }

    return { 
        chartConfig: newConfig, 
        costKeys: allKeys,
    };
  }, [data, configOverrides, t, isPrint, getColorForKey]);
  
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
    const color = isPrint ? getColorForKey(name) : chartConfig[name]?.color;
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
          <CartesianGrid vertical={false} stroke={isPrint ? P.muted : undefined} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            stroke={isPrint ? '#0F172A' : undefined}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => valueFormatter(Number(value))}
            stroke={isPrint ? '#0F172A' : undefined}
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
          
          {costKeys.map((key) => {
              const itemConfig = chartConfig[key];
              return (
                 <Bar
                    key={key}
                    dataKey={key}
                    fill={isPrint ? getColorForKey(key) : itemConfig?.color}
                    stackId="a"
                    name={itemConfig?.label || key}
                    barSize={20}
                    isAnimationActive={isAnimationActive}
                  />
              )
          })}

        </BarChart>
      </ChartContainer>
  )
}
