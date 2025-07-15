
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

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export function CostTimelineChart({ data, currency }: { data: any[], currency: string }) {
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
  const [costKeys, setCostKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (data.length > 0) {
      const allKeys = Object.keys(data[0]).filter(key => key !== 'month');
      const newConfig: ChartConfig = {};
      allKeys.forEach((key, index) => {
        newConfig[key] = {
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Prettify label
          color: chartColors[index % chartColors.length],
        };
      });
      setChartConfig(newConfig);
      setCostKeys(allKeys);
    }
  }, [data]);
  
  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data to display.</div>
  }
  
  // The last key in this array will be the top-most bar in the stack.
  const reversedCostKeys = [...costKeys].reverse();

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart 
        accessibilityLayer 
        data={data}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
        stackOffset="sign"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => `M${value}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => formatCurrency(Number(value), currency).replace(/\.00$/, '')}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            labelFormatter={(label) => `Month ${label}`}
            formatter={(value, name, props) => {
               const itemConfig = chartConfig[props.dataKey as string];
               return (
                <div className="flex items-center">
                    <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemConfig?.color }}/>
                    <div className="flex flex-1 justify-between">
                        <span>{itemConfig?.label}</span>
                        <span className="ml-4 font-bold">{formatCurrency(Number(value), currency)}</span>
                    </div>
                </div>
              )
            }}
        />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        
        {reversedCostKeys.map((key, index) => (
           <Bar
              key={key}
              dataKey={key}
              fill={chartConfig[key]?.color}
              stackId="a"
              // Apply radius only to the top-most bar in the stack
              radius={index === reversedCostKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
        ))}

      </BarChart>
    </ChartContainer>
  )
}
