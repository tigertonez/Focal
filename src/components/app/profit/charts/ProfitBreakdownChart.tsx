
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
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

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  costs: {
    label: "Total Costs",
    color: "hsl(0, 75%, 65%)", // Subtle Red
  },
  cumulativeProfit: {
    label: "Cumulative Operating Profit",
    color: "hsl(var(--accent))",
  }
} satisfies ChartConfig

interface ProfitBreakdownChartProps {
  data: EngineOutput;
  currency: string;
}

export function ProfitBreakdownChart({ data, currency }: ProfitBreakdownChartProps) {
  const chartData = React.useMemo(() => {
    let cumulativeProfit = 0;
    return data.monthlyProfit.map(p => {
        const revenue = Object.values(data.monthlyRevenue.find(r => r.month === p.month) || {}).reduce((acc, val) => typeof val === 'number' && val > 0 ? acc + val : acc, 0);
        const costs = Object.values(data.monthlyCosts.find(c => c.month === p.month) || {}).reduce((acc, val) => typeof val === 'number' && val > 0 ? acc + val : acc, 0);
        
        cumulativeProfit += p.operatingProfit;
        
        return {
            month: `M${p.month}`,
            revenue,
            costs: -costs, // Costs are negative for stacking
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
    return formatCurrency(Number(value), currency).replace(/\.00$/, '');
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
               return (
                <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
                    <div className="flex flex-1 justify-between">
                        <span>{itemConfig?.label}</span>
                        <span className="ml-4 font-bold">{formatCurrency(Number(value), currency)}</span>
                    </div>
                </div>
              )
            }}
          />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <Bar dataKey="costs" fill="hsl(0, 75%, 65%)" stackId="stack" />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" stackId="stack" />
        <Line type="monotone" dataKey="cumulativeProfit" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} yAxisId={0} />

      </ComposedChart>
    </ChartContainer>
  )
}
