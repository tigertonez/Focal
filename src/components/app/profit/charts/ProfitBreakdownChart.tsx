

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
import type { EngineOutput, EngineInput } from "@/lib/types"
import { useForecast } from "@/context/ForecastContext";

interface ProfitBreakdownChartProps {
  data: EngineOutput;
  inputs: EngineInput;
  currency: string;
}

export function ProfitBreakdownChart({ data, inputs, currency }: ProfitBreakdownChartProps) {
  const { t } = useForecast();
  
  const chartConfig = React.useMemo(() => ({
    revenue: {
      label: t.insights.charts.revenue,
      color: "hsl(var(--primary))",
    },
    costs: {
      label: "Operating Costs (P&L)",
      color: "hsl(var(--destructive) / 0.8)",
    },
    cumulativeProfit: {
      label: t.insights.charts.cumulativeProfit,
      color: "hsl(var(--accent))",
    }
  }), [t]) satisfies ChartConfig

  const chartData = React.useMemo(() => {
    const { monthlyRevenue, monthlyProfit } = data;
    
    // Get all unique months from both revenue and costs, and sort them.
    const allMonths = Array.from(new Set([
        ...monthlyRevenue.map(m => m.month),
        ...monthlyProfit.map(m => m.month),
    ])).sort((a,b) => a - b);
    
    let cumulativeProfit = 0;

    return allMonths.map(month => {
        const revMonth = monthlyRevenue.find(r => r.month === month) || {};
        const revenueForMonth = Object.entries(revMonth).reduce((acc, [key, val]) => {
            return key !== 'month' ? acc + (val as number) : acc;
        }, 0);
        
        const profitMonth = monthlyProfit.find(p => p.month === month);
        const costsForMonth = profitMonth?.plOperatingCosts || 0;
        
        const operatingProfit = profitMonth?.operatingProfit || 0;
        cumulativeProfit += operatingProfit;
        
        return {
            month: `M${month}`,
            revenue: revenueForMonth,
            costs: -costsForMonth, // Make costs negative for the stacked bar chart
            cumulativeProfit,
        };
    });
  }, [data]);
  
  if (!chartData || chartData.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }

  const valueFormatter = (value: number) => {
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency, true);
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
          content={<ChartTooltipContent 
            formatter={(value, name) => {
               const itemConfig = chartConfig[name as keyof typeof chartConfig];
               const displayValue = name === 'costs' ? -(value as number) : value;
               return (
                <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
                    <div className="flex flex-1 justify-between">
                        <span>{itemConfig?.label}</span>
                        <span className="ml-4 font-bold">{formatCurrency(Number(displayValue), currency, false)}</span>
                    </div>
                </div>
              )
            }}
          />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 3" />

        <Bar dataKey="costs" fill={"hsl(var(--destructive) / 0.8)"} stackId="stack" />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" stackId="stack" />
        <Line type="monotone" dataKey="cumulativeProfit" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} yAxisId={0} />

      </ComposedChart>
    </ChartContainer>
  )
}
