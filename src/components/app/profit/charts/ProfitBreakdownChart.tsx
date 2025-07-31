

'use client';

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart, ReferenceLine } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import type { EngineOutput } from "@/lib/types"
import { useForecast } from "@/context/ForecastContext";

interface ProfitBreakdownChartProps {
  data: EngineOutput;
  currency: string;
}

export function ProfitBreakdownChart({ data, currency }: ProfitBreakdownChartProps) {
  const { t } = useForecast();

  const chartConfig = React.useMemo(() => ({
    revenue: {
      label: t.insights.charts.revenue,
      color: "hsl(var(--primary))",
    },
    variableCosts: {
        label: "Variable Costs",
        color: "hsl(var(--chart-4))",
    },
    fixedCosts: {
        label: "Fixed Costs",
        color: "hsl(var(--chart-1))",
    },
    cumulativeOperatingProfit: {
      label: t.insights.charts.cumulativeProfit,
      color: "hsl(var(--accent))",
    }
  }), [t]) satisfies ChartConfig;


  const chartData = React.useMemo(() => {
    return data.monthlyProfit.map(month => ({
        month: `M${month.month}`,
        revenue: month.revenue,
        variableCosts: -Math.abs(month.variableCosts), // Ensure it's negative for stacking
        fixedCosts: -Math.abs(month.fixedCosts),     // Ensure it's negative for stacking
        cumulativeOperatingProfit: month.cumulativeOperatingProfit,
    }));
  }, [data.monthlyProfit]);
  
  const valueFormatter = (value: number) => {
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency, true);
  };

  const tooltipFormatter = (value: number, name: string) => {
    const itemConfig = chartConfig[name as keyof typeof chartConfig];
    return (
     <div className="flex items-center">
         <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
         <div className="flex flex-1 justify-between">
             <span>{itemConfig?.label || name}</span>
             <span className="ml-4 font-bold">{formatCurrency(Math.abs(Number(value)), currency)}</span>
         </div>
     </div>
   )
 };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ComposedChart 
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
          cursor={true}
          content={<ChartTooltipContent formatter={tooltipFormatter} />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 3" />
        
        <Bar dataKey="revenue" stackId="stack" fill="hsl(var(--primary))" />
        <Bar dataKey="variableCosts" stackId="stack" fill="hsl(var(--chart-4))" />
        <Bar dataKey="fixedCosts" stackId="stack" fill="hsl(var(--chart-1))" />

        <Line 
          type="monotone" 
          dataKey="cumulativeOperatingProfit" 
          stroke="hsl(var(--accent))" 
          strokeWidth={3} 
          dot={{ r: 4 }} 
          activeDot={{ r: 6 }} 
        />

      </ComposedChart>
    </ChartContainer>
  )
}
