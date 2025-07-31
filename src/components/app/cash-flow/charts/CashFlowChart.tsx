

'use client';

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart, ReferenceLine, Cell } from "recharts"
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
}

export function CashFlowChart({ data, currency }: CashFlowChartProps) {
  const { t } = useForecast();

  const chartConfig = React.useMemo(() => ({
    netCashFlow: {
      label: "Net Cash Flow",
      color: "hsl(var(--primary))",
    },
    cumulativeCash: {
      label: t.insights.charts.cumulativeCash,
      color: "hsl(var(--accent))",
    }
  }), [t]) satisfies ChartConfig;


  const chartData = React.useMemo(() => {
    const { monthlyCashFlow } = data;
    return monthlyCashFlow.map(cf => ({
        month: `M${cf.month}`,
        netCashFlow: cf.netCashFlow,
        cumulativeCash: cf.cumulativeCash,
    }));
  }, [data]);

  const valueFormatter = (value: number) => {
    const currencySymbol = (currency === 'EUR' ? '€' : '$');
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(Number(value), currency);
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ComposedChart 
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
          tickFormatter={(value) => formatCurrency(Number(value), currency)}
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
        
        <Bar dataKey="netCashFlow" yAxisId={0}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.netCashFlow >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive) / 0.8)'} />
          ))}
        </Bar>
        <Line type="monotone" dataKey="cumulativeCash" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} yAxisId={0} />

      </ComposedChart>
    </ChartContainer>
  )
}
