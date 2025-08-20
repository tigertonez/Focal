

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
import { getPrintPalette } from "@/lib/printColors";

interface ProfitBreakdownChartProps {
  data: EngineOutput;
  currency: string;
  isAnimationActive?: boolean;
}

export function ProfitBreakdownChart({ data, currency, isAnimationActive = true }: ProfitBreakdownChartProps) {
  const { t } = useForecast();
  const printPalette = getPrintPalette();
  const isPrint = !isAnimationActive;

  const chartConfig = React.useMemo(() => ({
    revenue: {
      label: t.insights.charts.revenue,
      color: isPrint ? printPalette.primary : "hsl(var(--primary))",
    },
    variableCosts: {
        label: "Variable Costs",
        color: isPrint ? printPalette.lightRed : "hsl(0, 70%, 70%)",
    },
    fixedCosts: {
        label: "Fixed Costs",
        color: isPrint ? printPalette.destructive : "hsl(var(--destructive))",
    },
    cumulativeOperatingProfit: {
      label: t.insights.charts.cumulativeProfit,
      color: isPrint ? printPalette.green : "hsl(140, 70%, 40%)",
    }
  }), [t, isPrint, printPalette]) satisfies ChartConfig;


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

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ComposedChart 
        accessibilityLayer 
        data={chartData}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        stackOffset="sign"
      >
        <CartesianGrid vertical={false} stroke={isPrint ? printPalette.muted : undefined} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          stroke={isPrint ? '#0F172A' : undefined}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => valueFormatter(Number(value))}
          stroke={isPrint ? '#0F172A' : undefined}
        />
        <ChartTooltip
          cursor={!isAnimationActive ? false : true}
          wrapperStyle={!isAnimationActive ? { display: 'none' } : {}}
          content={<ChartTooltipContent formatter={tooltipFormatter} />}
        />
        <ChartLegend content={<ChartLegendContent className="text-sm" />} wrapperStyle={isPrint ? { width: '100%', textAlign: 'center', bottom: -10 } : undefined} />
        
        <ReferenceLine y={0} stroke={isPrint ? printPalette.muted : "hsl(var(--foreground) / 0.5)"} strokeDasharray="3 3" />
        
        <Bar dataKey="revenue" stackId="stack" fill={chartConfig.revenue.color} isAnimationActive={isAnimationActive} />
        <Bar dataKey="variableCosts" stackId="stack" fill={chartConfig.variableCosts.color} isAnimationActive={isAnimationActive} />
        <Bar dataKey="fixedCosts" stackId="stack" fill={chartConfig.fixedCosts.color} isAnimationActive={isAnimationActive} />

        <Line 
          type="monotone" 
          dataKey="cumulativeOperatingProfit" 
          stroke={chartConfig.cumulativeOperatingProfit.color} 
          strokeWidth={3} 
          dot={{ r: 4 }} 
          activeDot={{ r: 6 }} 
          isAnimationActive={isAnimationActive}
        />

      </ComposedChart>
    </ChartContainer>
  )
}
