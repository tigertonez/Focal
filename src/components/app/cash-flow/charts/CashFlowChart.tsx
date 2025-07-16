
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

const chartConfig = {
  cashIn: {
    label: "Cash In",
    color: "hsl(var(--primary))",
  },
  cashOut: {
    label: "Cash Out",
    color: "hsl(var(--destructive) / 0.8)",
  },
  cumulativeCash: {
    label: "Cumulative Cash",
    color: "hsl(var(--accent))",
  }
} satisfies ChartConfig

interface CashFlowChartProps {
  data: EngineOutput;
  currency: string;
}

export function CashFlowChart({ data, currency }: CashFlowChartProps) {
  const chartData = React.useMemo(() => {
    const { monthlyCashFlow, monthlyRevenue, monthlyCosts, monthlyProfit } = data;
    return monthlyCashFlow.map(cf => {
        const cashIn = Object.values(monthlyRevenue.find(r => r.month === cf.month) || {}).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
        const totalCosts = Object.values(monthlyCosts.find(c => c.month === cf.month) || {}).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
        const taxes = (monthlyProfit.find(p => p.month === cf.month)?.operatingProfit || 0) - (monthlyProfit.find(p => p.month === cf.month)?.netProfit || 0);
        const cashOut = -(totalCosts + taxes);

        return {
            month: `M${cf.month}`,
            cashIn,
            cashOut,
            cumulativeCash: cf.cumulativeCash,
        };
    });
  }, [data]);

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
                        <span className="ml-4 font-bold">{formatCurrency(Math.abs(Number(value)), currency)}</span>
                    </div>
                </div>
              )
            }}
          />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 3" />
        
        <Bar dataKey="cashIn" fill="hsl(var(--primary))" stackId="stack" />
        <Bar dataKey="cashOut" fill="hsl(var(--destructive) / 0.8)" stackId="stack" />
        <Line type="monotone" dataKey="cumulativeCash" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} yAxisId={0} />

      </ComposedChart>
    </ChartContainer>
  )
}
