
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
import { palette } from "@/lib/printColorMap";

interface CashFlowChartProps {
  data: EngineOutput;
  currency: string;
  isAnimationActive?: boolean;
  isPrint?: boolean;
}

export function CashFlowChart({ data, currency, isAnimationActive = true, isPrint = false }: CashFlowChartProps) {
  const { t } = useForecast();
  const p = palette();

  const chartConfig = React.useMemo(() => ({
    cashIn: {
      label: t.insights.charts.cashIn,
      color: isPrint ? p.primary : "hsl(var(--primary))",
    },
    cashOut: {
      label: t.insights.charts.cashOut,
      color: isPrint ? p.destructive : "hsl(var(--destructive))",
    },
    cumulativeCash: {
      label: t.insights.charts.cumulativeCash,
      color: isPrint ? "#10B981" : "hsl(140, 70%, 40%)", // green-500
    }
  }), [t, isPrint, p]) satisfies ChartConfig;


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

 const legendWrapperStylePrint = { width:'100%', textAlign:'center', whiteSpace:'nowrap' } as const;

  return (
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
        
        <Bar dataKey="cashIn" stackId="stack" fill={chartConfig.cashIn.color} isAnimationActive={!isPrint} />
        <Bar dataKey="cashOut" stackId="stack" fill={chartConfig.cashOut.color} isAnimationActive={!isPrint} />

        <Line 
          type="monotone" 
          dataKey="cumulativeCash" 
          stroke={chartConfig.cumulativeCash.color}
          strokeWidth={3} 
          dot={{ r: isPrint ? 0 : 4, strokeWidth: 0 }} 
          activeDot={{ r: 6 }} 
          isAnimationActive={!isPrint}
        />

      </ComposedChart>
    </ChartContainer>
  )
}
