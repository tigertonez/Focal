
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import type { EngineOutput } from "@/lib/types"

interface ProfitWaterfallChartProps {
  data: EngineOutput;
  currency: string;
}

export function ProfitWaterfallChart({ data, currency }: ProfitWaterfallChartProps) {
  const chartData = React.useMemo(() => {
    const { revenueSummary, profitSummary, costSummary } = data;
    const totalRevenue = revenueSummary.totalRevenue;
    const grossProfit = profitSummary.totalGrossProfit;
    const operatingProfit = profitSummary.totalOperatingProfit;
    const netProfit = profitSummary.totalNetProfit;

    const cogs = totalRevenue - grossProfit;
    const fixedCosts = grossProfit - operatingProfit;
    const taxes = operatingProfit - netProfit;

    // The data is structured for a stacked bar chart to create the waterfall effect.
    // 'range' is the invisible base of the bar, and 'value' is the visible part.
    return [
      { name: "Revenue", value: totalRevenue, range: [0, totalRevenue], fill: "hsl(var(--primary))" },
      { name: "COGS", value: -cogs, range: [grossProfit, totalRevenue], fill: "hsl(var(--destructive))" },
      { name: "Gross Profit", value: grossProfit, range: [0, grossProfit], fill: "hsl(var(--muted-foreground))" },
      { name: "Fixed Costs", value: -fixedCosts, range: [operatingProfit, grossProfit], fill: "hsl(var(--destructive))" },
      { name: "Op. Profit", value: operatingProfit, range: [0, operatingProfit], fill: "hsl(var(--muted-foreground))" },
      { name: "Taxes", value: -taxes, range: [netProfit, operatingProfit], fill: "hsl(var(--destructive))" },
      { name: "Net Profit", value: netProfit, range: [0, netProfit], fill: "hsl(var(--accent))" },
    ].filter(d => d.value !== 0);
  
  }, [data]);
  
  if (!chartData || chartData.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }
  
  const valueFormatter = (value: number) => {
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}${currencySymbol}${(absValue / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value, currency).replace(/\.00$/, '');
  };

  return (
    <ChartContainer config={{}} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={5}
            axisLine={false}
            className="text-xs"
            />
            <XAxis type="number" hide />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                            <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                                <p className="font-semibold">{d.name}</p>
                                <p className="text-foreground">{formatCurrency(d.value, currency)}</p>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            
            {/* Invisible bar to create the floating effect */}
            <Bar dataKey={(d) => d.range[0]} stackId="a" fill="transparent" isAnimationActive={false} />

            {/* Visible bar with the actual value */}
            <Bar dataKey={(d) => d.range[1] - d.range[0]} stackId="a" isAnimationActive={false}>
                 <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-foreground text-xs font-semibold"
                    formatter={(value: number) => valueFormatter(value)}
                />
            </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
