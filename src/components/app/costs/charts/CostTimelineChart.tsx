
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { type FixedCostItem } from "@/lib/types"

const HSL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface CostTimelineChartProps {
  data: any[];
  currency: string;
  fixedCostDefs: FixedCostItem[];
}

export function CostTimelineChart({ data, currency, fixedCostDefs }: CostTimelineChartProps) {
  const { chartData, chartConfig, costKeys } = React.useMemo(() => {
    const monthlyData = data.map(month => ({
      ...month,
      name: `M${month.month}`,
    }));

    const allCostKeys = new Set<string>();
    monthlyData.forEach(month => {
      Object.keys(month).forEach(key => {
        if (key !== 'month' && key !== 'name' && key !== 'total' && month[key] > 0) {
          allCostKeys.add(key);
        }
      });
    });

    const sortedCostKeys = Array.from(allCostKeys).sort((a, b) => {
        // Ensure deposits and final payments are first
        if (a === 'deposits') return -1;
        if (b === 'deposits') return 1;
        if (a === 'finalPayments') return -1;
        if (b === 'finalPayments') return 1;
        return a.localeCompare(b);
    });
    
    const config: ChartConfig = {};
    const fixedCostMap = new Map(fixedCostDefs.map(fc => [fc.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(), fc]));

    sortedCostKeys.forEach((key, index) => {
      let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      if (key === 'deposits') label = 'Deposits Paid';
      if (key === 'finalPayments') label = 'Final Payments';

      const fixedCostDef = fixedCostMap.get(key);
      if (fixedCostDef) {
        label = `${fixedCostDef.name} (${fixedCostDef.paymentSchedule})`;
      }
      
      config[key] = {
        label,
        color: HSL_COLORS[index % HSL_COLORS.length],
      };
    });

    return { chartData: monthlyData, chartConfig: config, costKeys: sortedCostKeys };
  }, [data, fixedCostDefs]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value), currency).slice(0, -3)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Month ${label.substring(1)}`}
              formatter={(value, name) => (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span>{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                    <span className="font-bold">{formatCurrency(Number(value), currency)}</span>
                  </div>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {costKeys.map((key) => (
            <Bar 
                key={key} 
                dataKey={key} 
                stackId="a" 
                fill={`var(--color-${key})`} 
                radius={[4, 4, 0, 0]} 
            />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
