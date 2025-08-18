
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

interface CashFlowChartProps {
  data: EngineOutput;
  currency: string;
  isAnimationActive?: boolean;
}

export function CashFlowChart({ data, currency, isAnimationActive = true }: CashFlowChartProps) {
  const { t } = useForecast();

  const chartConfig = React.useMemo(() => ({
    cashIn: {
      label: t.insights.charts.cashIn,
      color: "hsl(var(--primary))",
    },
    cashOut: {
      label: t.insights.charts.cashOut,
      color: "hsl(var(--destructive))",
    },
    cumulativeCash: {
      label: t.insights.charts.cumulativeCash,
      color: "hsl(140, 70%, 40%)", // Green for profit/positive trends
    }
  }), [t]) satisfies ChartConfig;


  const chartData = React.useMemo(() => {
    const { monthlyCashFlow, monthlyRevenue, monthlyCosts } = data;
    
    return monthlyCashFlow.map((cf) => {
        const revenue = Object.values(monthlyRevenue.find(r => r.month === cf.month) || {}).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
        const costs = Object.values(monthlyCosts.find(c => c.month === cf.month) || {}).reduce((sum, val) => (typeof val === 'number' ? sum + val : sum), 0);
        const cashOut = -(costs);
        
        return {
            month: `M${cf.month}`,
            cashIn: revenue,
            cashOut: cashOut,
            cumulativeCash: cf.cumulativeCash,
        };
    });
  }, [data]);

  const valueFormatter = (value: number) => {
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency);
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
          isAnimationActive={isAnimationActive}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 3" />
        
        <Bar dataKey="cashIn" stackId="stack" fill="hsl(var(--primary))" isAnimationActive={isAnimationActive} />
        <Bar dataKey="cashOut" stackId="stack" fill="hsl(var(--destructive))" isAnimationActive={isAnimationActive} />

        <Line 
          type="monotone" 
          dataKey="cumulativeCash" 
          stroke="hsl(140, 70%, 40%)" 
          strokeWidth={3} 
          dot={{ r: 4 }} 
          activeDot={{ r: 6 }} 
          isAnimationActive={isAnimationActive}
        />

      </ComposedChart>
    </ChartContainer>
  )
}
