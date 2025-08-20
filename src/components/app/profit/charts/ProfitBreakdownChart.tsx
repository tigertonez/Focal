
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
import { ResponsiveContainer } from "recharts";
import { palette } from "@/lib/printColorMap";


interface ProfitBreakdownChartProps {
  data: EngineOutput;
  currency: string;
  isPrint?: boolean;
}

export function ProfitBreakdownChart({ data, currency, isPrint = false }: ProfitBreakdownChartProps) {
  const { t } = useForecast();
  const p = palette();

  const chartConfig = React.useMemo(() => ({
    revenue: {
      label: t.insights.charts.revenue,
      color: isPrint ? p.primary : "hsl(var(--primary))",
    },
    variableCosts: {
        label: "Variable Costs",
        color: isPrint ? "#fca5a5" : "hsl(0, 70%, 70%)", // red-300
    },
    fixedCosts: {
        label: "Fixed Costs",
        color: isPrint ? p.destructive : "hsl(var(--destructive))",
    },
    cumulativeOperatingProfit: {
      label: t.insights.charts.cumulativeProfit,
      color: isPrint ? "#10B981" : "hsl(140, 70%, 40%)", // green-500
    }
  }), [t, isPrint, p]) satisfies ChartConfig;


  const chartData = React.useMemo(() => {
    return data.monthlyProfit
      .map(month => ({
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

 const legendWrapperStylePrint = { width:'100%', textAlign:'center', whiteSpace:'nowrap' } as const;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ComposedChart 
          accessibilityLayer 
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          stackOffset="sign"
        >
          <CartesianGrid vertical={false} stroke={isPrint ? p.grid : undefined} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            stroke={isPrint ? p.text : undefined}
            tick={isPrint ? { fill: p.text } : {}}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => valueFormatter(Number(value))}
            stroke={isPrint ? p.text : undefined}
            tick={isPrint ? { fill: p.text } : {}}
          />
          <ChartTooltip
            cursor={!isPrint}
            wrapperStyle={isPrint ? { display: 'none' } : {}}
            content={<ChartTooltipContent formatter={tooltipFormatter} />}
          />
          <ChartLegend content={<ChartLegendContent className="text-sm" />} wrapperStyle={isPrint ? legendWrapperStylePrint : undefined} />
          
          <ReferenceLine y={0} stroke={isPrint ? p.muted : "hsl(var(--foreground) / 0.5)"} strokeDasharray="3 3" />
          
          <Bar dataKey="revenue" stackId="stack" fill={chartConfig.revenue.color} isAnimationActive={!isPrint} />
          <Bar dataKey="variableCosts" stackId="stack" fill={chartConfig.variableCosts.color} isAnimationActive={!isPrint} />
          <Bar dataKey="fixedCosts" stackId="stack" fill={chartConfig.fixedCosts.color} isAnimationActive={!isPrint} />

          <Line 
            type="monotone" 
            dataKey="cumulativeOperatingProfit" 
            stroke={chartConfig.cumulativeOperatingProfit.color} 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }} 
            isAnimationActive={!isPrint}
          />

        </ComposedChart>
      </ChartContainer>
    </ResponsiveContainer>
  )
}
