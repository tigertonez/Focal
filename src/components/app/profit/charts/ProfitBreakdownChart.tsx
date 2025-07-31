

'use client';

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
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
    cumulativeOperatingProfit: {
      label: t.insights.charts.cumulativeProfit,
      color: "hsl(var(--accent))",
    }
  }), [t]) satisfies ChartConfig

  const chartData = React.useMemo(() => {
    return data.monthlyProfit.map(month => ({
        month: `M${month.month}`,
        cumulativeOperatingProfit: month.cumulativeOperatingProfit,
    }));
  }, [data.monthlyProfit]);
  
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
      <LineChart
        accessibilityLayer 
        data={chartData}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
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
                        <span className="ml-4 font-bold">{formatCurrency(Number(value), currency, false)}</span>
                    </div>
                </div>
              )
            }}
          />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} />
        
        <ReferenceLine y={0} stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 3" />

        <Line 
          type="monotone" 
          dataKey="cumulativeOperatingProfit" 
          stroke="hsl(var(--accent))" 
          strokeWidth={3} 
          dot={{ r: 4, fill: "hsl(var(--accent))" }} 
          activeDot={{ r: 6, fill: "hsl(var(--accent))" }}
        />
      </LineChart>
    </ChartContainer>
  )
}
