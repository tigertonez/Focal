
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Tooltip } from "recharts"
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

    return [
      { name: "Revenue", value: totalRevenue, range: [0, totalRevenue], color: "hsl(var(--primary))" },
      { name: "COGS", value: cogs, range: [grossProfit, totalRevenue], color: "hsl(var(--destructive))" },
      { name: "Gross Profit", value: grossProfit, range: [0, grossProfit], color: "hsl(var(--muted-foreground))" },
      { name: "Fixed Costs", value: fixedCosts, range: [operatingProfit, grossProfit], color: "hsl(var(--destructive))" },
      { name: "Op. Profit", value: operatingProfit, range: [0, operatingProfit], color: "hsl(var(--muted-foreground))" },
      { name: "Taxes", value: taxes, range: [netProfit, operatingProfit], color: "hsl(var(--destructive))" },
      { name: "Net Profit", value: netProfit, range: [0, netProfit], color: "hsl(var(--accent))" },
    ].filter(d => d.value !== 0); // Filter out zero-value items like taxes if not applicable
  
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
    <ChartContainer config={{}} className="h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs"
        />
        <XAxis type="number" hide />
        <Tooltip
            cursor={false}
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                        <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                            <p className="font-semibold">{d.name}</p>
                            <p>{formatCurrency(d.value, currency)}</p>
                        </div>
                    );
                }
                return null;
            }}
        />
        <Bar dataKey="range" stackId="a" isAnimationActive={false}>
            {chartData.map((item, index) => (
                <LabelList
                    key={index}
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-foreground text-xs font-semibold"
                    formatter={(value: number) => value > 0 ? valueFormatter(value) : ''}
                />
            ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
